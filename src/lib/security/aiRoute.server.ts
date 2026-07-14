import "server-only";

import type { z } from "zod";

import type { SuccessEnvelope } from "@/lib/ai/schemas";

import { checkAiRateLimit, RateLimitUnavailableError, rateLimitHeaders } from "./rateLimit.server";
import { containsProhibitedAiRequest, validateJsonRequest } from "./requestValidation";
import { safeErrorResponse, successResponse } from "./safeErrors";
import { isTrustedRequestOrigin } from "./trustedOrigin";

export interface AiHandlerResult<T> {
  readonly data: T;
  readonly mode: "gemini" | "demo" | "fallback";
}

interface AiRouteOptions<TRequest, TResponse> {
  readonly scope: string;
  readonly schema: z.ZodType<TRequest>;
  readonly userText: (request: TRequest) => string;
  readonly handler: (request: TRequest) => Promise<AiHandlerResult<TResponse>>;
}

function validationErrorResponse(
  result: Exclude<Awaited<ReturnType<typeof validateJsonRequest>>, { ok: true }>,
): Response {
  switch (result.code) {
    case "INVALID_CONTENT_TYPE":
      return safeErrorResponse(result.code, "Content-Type must be application/json.", 415);
    case "PAYLOAD_TOO_LARGE":
      return safeErrorResponse(result.code, "Request body is too large.", 413);
    case "INVALID_JSON":
      return safeErrorResponse(result.code, "Request body must contain valid JSON.", 400);
    case "INVALID_REQUEST":
      return safeErrorResponse(result.code, "Request data is invalid.", 400, {
        ...(result.fields === undefined ? {} : { fields: result.fields }),
      });
  }
}

export async function handleAiRoute<TRequest, TResponse>(
  request: Request,
  options: AiRouteOptions<TRequest, TResponse>,
): Promise<Response> {
  try {
    if (!isTrustedRequestOrigin(request)) {
      return safeErrorResponse("ORIGIN_NOT_ALLOWED", "Request origin is not allowed.", 403);
    }

    const rateLimit = await checkAiRateLimit(request, options.scope);
    const headers = rateLimitHeaders(rateLimit);
    if (!rateLimit.success) {
      return safeErrorResponse("RATE_LIMITED", "Too many requests. Please try again soon.", 429, {
        headers,
      });
    }

    const validation = await validateJsonRequest(request, options.schema);
    if (!validation.ok) {
      const response = validationErrorResponse(validation);
      Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      return response;
    }

    if (containsProhibitedAiRequest(options.userText(validation.data))) {
      return safeErrorResponse(
        "SAFETY_BLOCKED",
        "This request cannot be processed. Ask only for venue assistance.",
        400,
        { headers },
      );
    }

    const result = await options.handler(validation.data);
    const envelope: SuccessEnvelope<TResponse> = {
      data: result.data,
      meta: { mode: result.mode, simulated: true },
    };
    return successResponse(envelope, headers);
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return safeErrorResponse(
        "RATE_LIMIT_UNAVAILABLE",
        "Venue assistance is temporarily unavailable because request protection could not be verified.",
        503,
      );
    }
    return safeErrorResponse(
      "SERVICE_UNAVAILABLE",
      "Venue assistance is temporarily unavailable. Please use on-site signage or contact venue staff.",
      503,
    );
  }
}
