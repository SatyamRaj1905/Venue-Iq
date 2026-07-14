import type { z } from "zod";

export const MAX_AI_REQUEST_BYTES = 16_384;

export type RequestValidationFailure = Readonly<{
  ok: false;
  code: "INVALID_CONTENT_TYPE" | "INVALID_JSON" | "INVALID_REQUEST" | "PAYLOAD_TOO_LARGE";
  fields?: readonly string[];
}>;

export type RequestValidationResult<T> = Readonly<{ ok: true; data: T }> | RequestValidationFailure;

function isJsonContentType(value: string | null): boolean {
  if (value === null) {
    return false;
  }
  return value.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function declaredLengthIsInvalid(value: string | null, maxBytes: number): boolean {
  if (value === null) {
    return false;
  }
  if (!/^\d+$/.test(value)) {
    return true;
  }
  return Number(value) > maxBytes;
}

type BodyReadResult =
  | Readonly<{ ok: true; rawBody: string }>
  | Readonly<{ ok: false; code: "INVALID_JSON" | "PAYLOAD_TOO_LARGE" }>;

async function readBodyWithinLimit(request: Request, maxBytes: number): Promise<BodyReadResult> {
  if (request.body === null) {
    return { ok: true, rawBody: "" };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        chunks.push(decoder.decode());
        return { ok: true, rawBody: chunks.join("") };
      }

      bytesRead += chunk.value.byteLength;
      if (bytesRead > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size limit is already known; cancellation failure is non-sensitive.
        }
        return { ok: false, code: "PAYLOAD_TOO_LARGE" };
      }
      chunks.push(decoder.decode(chunk.value, { stream: true }));
    }
  } catch {
    return { ok: false, code: "INVALID_JSON" };
  } finally {
    reader.releaseLock();
  }
}

export async function validateJsonRequest<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = MAX_AI_REQUEST_BYTES,
): Promise<RequestValidationResult<T>> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, code: "INVALID_CONTENT_TYPE" };
  }

  if (declaredLengthIsInvalid(request.headers.get("content-length"), maxBytes)) {
    return { ok: false, code: "PAYLOAD_TOO_LARGE" };
  }

  const body = await readBodyWithinLimit(request, maxBytes);
  if (!body.ok) return body;
  const { rawBody } = body;

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return { ok: false, code: "INVALID_JSON" };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const fields = [
      ...new Set(
        result.error.issues.map((issue) => issue.path.join(".")).filter((path) => path.length > 0),
      ),
    ].slice(0, 8);
    return {
      ok: false,
      code: "INVALID_REQUEST",
      ...(fields.length === 0 ? {} : { fields }),
    };
  }

  return { ok: true, data: result.data };
}

const BLOCKED_INPUT_PATTERNS = [
  /\b(?:ignore|disregard|override|bypass)\b.{0,40}\b(?:previous|prior|system|developer|safety|instructions?)\b/i,
  /\b(?:reveal|show|print|repeat|expose|leak)\b.{0,50}\b(?:system prompt|hidden prompt|developer message|instructions?)\b/i,
  /\b(?:api[_ -]?key|secret|credential|password|environment variables?|\.env)\b/i,
  /\b(?:jailbreak|prompt injection)\b/i,
] as const;

export function containsProhibitedAiRequest(input: string): boolean {
  const normalized = input.normalize("NFKC").replace(/\s+/g, " ").slice(0, 2_000);
  return BLOCKED_INPUT_PATTERNS.some((pattern) => pattern.test(normalized));
}
