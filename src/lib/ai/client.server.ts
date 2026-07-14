import "server-only";

import { GoogleGenAI, ThinkingLevel, type GenerateContentParameters } from "@google/genai";
import type { z } from "zod";

import { getServerEnvironment } from "@/lib/config/env.server";

const GEMINI_ATTEMPT_TIMEOUT_MS = 10_000;
const GEMINI_TOTAL_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 900;
const MAX_ATTEMPTS = 2;

export class AiGenerationError extends Error {
  public constructor() {
    super("The language model did not return a usable response.");
    this.name = "AiGenerationError";
  }
}

export interface StructuredGenerationRequest<T> {
  readonly systemInstruction: string;
  readonly prompt: string;
  readonly responseJsonSchema: unknown;
  readonly schema: z.ZodType<T>;
}

type GenerateContent = (
  parameters: GenerateContentParameters,
) => Promise<Readonly<{ text: string | undefined }>>;

function parseModelJson(text: string | undefined): unknown {
  if (text === undefined || text.trim().length === 0) {
    throw new AiGenerationError();
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AiGenerationError();
  }
}

function statusFromError(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  const status = Reflect.get(error, "status");
  return typeof status === "number" ? status : undefined;
}

function canRetry(error: unknown): boolean {
  if (error instanceof AiGenerationError) {
    return true;
  }
  const status = statusFromError(error);
  return status === undefined || status === 408 || status === 429 || status >= 500;
}

export async function generateValidatedJsonWith(
  generateContent: GenerateContent,
  model: string,
  request: StructuredGenerationRequest<unknown>,
): Promise<unknown> {
  const deadline = Date.now() + GEMINI_TOTAL_TIMEOUT_MS;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await generateContent({
        model,
        contents: request.prompt,
        config: {
          systemInstruction: request.systemInstruction,
          temperature: 0.15,
          topP: 0.8,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          candidateCount: 1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseJsonSchema: request.responseJsonSchema,
          abortSignal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
          httpOptions: { timeout: GEMINI_ATTEMPT_TIMEOUT_MS },
        },
      });
      const validation = request.schema.safeParse(parseModelJson(response.text));
      if (validation.success) {
        return validation.data;
      }
      throw new AiGenerationError();
    } catch (error) {
      const isFinalAttempt = attempt === MAX_ATTEMPTS - 1;
      const retryCannotFinishInBudget = deadline - Date.now() < GEMINI_ATTEMPT_TIMEOUT_MS;
      if (isFinalAttempt || retryCannotFinishInBudget || !canRetry(error)) {
        throw new AiGenerationError();
      }
    }
  }

  throw new AiGenerationError();
}

export async function generateValidatedJson<T>(
  request: StructuredGenerationRequest<T>,
): Promise<T> {
  const environment = getServerEnvironment();
  if (environment.geminiApiKey === undefined) {
    throw new AiGenerationError();
  }

  const client = new GoogleGenAI({
    apiKey: environment.geminiApiKey,
    httpOptions: { timeout: GEMINI_ATTEMPT_TIMEOUT_MS },
  });
  const result = await generateValidatedJsonWith(
    (parameters) => client.models.generateContent(parameters),
    environment.geminiModel,
    request,
  );
  return request.schema.parse(result);
}
