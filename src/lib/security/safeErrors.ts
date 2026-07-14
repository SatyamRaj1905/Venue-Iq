export type SafeErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "ORIGIN_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "SAFETY_BLOCKED"
  | "SERVICE_UNAVAILABLE";

export interface SafeErrorBody {
  readonly error: Readonly<{
    code: SafeErrorCode;
    message: string;
    fields?: readonly string[];
  }>;
}

const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
} as const;

export function safeErrorResponse(
  code: SafeErrorCode,
  message: string,
  status: number,
  options: Readonly<{ fields?: readonly string[]; headers?: HeadersInit }> = {},
): Response {
  const body: SafeErrorBody = {
    error: {
      code,
      message,
      ...(options.fields === undefined ? {} : { fields: options.fields }),
    },
  };
  const headers = new Headers(JSON_HEADERS);

  if (options.headers !== undefined) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export function successResponse<T>(body: T, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(JSON_HEADERS);
  if (headers !== undefined) {
    new Headers(headers).forEach((value, key) => responseHeaders.set(key, value));
  }
  return new Response(JSON.stringify(body), { status: 200, headers: responseHeaders });
}
