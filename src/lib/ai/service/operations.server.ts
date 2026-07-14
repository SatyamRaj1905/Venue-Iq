import "server-only";

import { createOperationsFallback } from "../fallback/operations";
import {
  buildOperationsPrompt,
  OPERATIONS_NARRATIVE_JSON_SCHEMA,
  OPERATIONS_SYSTEM_INSTRUCTION,
} from "../prompts/operations";
import {
  operationsBriefSchema,
  operationsNarrativeSchema,
  type OperationsBrief,
  type OperationsBriefRequest,
} from "../schemas";
import { getOperationsSnapshot } from "../tools/operations";
import { getOfflineMode, type AiServiceResult } from "./shared.server";

const OPERATIONS_BRIEF_CACHE_TTL_MS = 60_000;
const MAX_OPERATIONS_BRIEF_CACHE_ENTRIES = 64;

interface CachedOperationsBrief {
  readonly expiresAt: number;
  readonly result: AiServiceResult<OperationsBrief>;
}

const operationsBriefCache = new Map<string, CachedOperationsBrief>();

function operationsCacheKey(request: OperationsBriefRequest): string {
  return [request.scenario, request.language, request.seed ?? "default", request.tick ?? 0].join(
    ":",
  );
}

function getCachedOperationsBrief(
  request: OperationsBriefRequest,
  now = Date.now(),
): AiServiceResult<OperationsBrief> | undefined {
  const key = operationsCacheKey(request);
  const cached = operationsBriefCache.get(key);
  if (cached === undefined) {
    return undefined;
  }
  if (cached.expiresAt <= now) {
    operationsBriefCache.delete(key);
    return undefined;
  }
  return cached.result;
}

function cacheOperationsBrief(
  request: OperationsBriefRequest,
  result: AiServiceResult<OperationsBrief>,
  now = Date.now(),
): void {
  if (operationsBriefCache.size >= MAX_OPERATIONS_BRIEF_CACHE_ENTRIES) {
    const oldestKey = operationsBriefCache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) {
      operationsBriefCache.delete(oldestKey);
    }
  }
  operationsBriefCache.set(operationsCacheKey(request), {
    expiresAt: now + OPERATIONS_BRIEF_CACHE_TTL_MS,
    result,
  });
}

export async function createOperationsBrief(
  request: OperationsBriefRequest,
): Promise<AiServiceResult<OperationsBrief>> {
  const grounding = getOperationsSnapshot(request);
  const fallback = createOperationsFallback(request, grounding);
  const mode = getOfflineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  const cached = getCachedOperationsBrief(request);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const { generateValidatedJson } = await import("../client.server");
    const narrative = await generateValidatedJson({
      systemInstruction: OPERATIONS_SYSTEM_INSTRUCTION,
      prompt: buildOperationsPrompt(request, grounding),
      responseJsonSchema: OPERATIONS_NARRATIVE_JSON_SCHEMA,
      schema: operationsNarrativeSchema,
    });
    const result: AiServiceResult<OperationsBrief> = {
      data: operationsBriefSchema.parse({
        ...fallback,
        summary: narrative.summary,
        confidence: narrative.confidence,
        fallbackUsed: false,
      }),
      mode: "gemini",
    };
    cacheOperationsBrief(request, result);
    return result;
  } catch {
    return { data: fallback, mode: "fallback" };
  }
}
