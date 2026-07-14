import "server-only";

import { createFanFallback } from "../fallback/fan";
import { buildFanPrompt, FAN_NARRATIVE_JSON_SCHEMA, FAN_SYSTEM_INSTRUCTION } from "../prompts/fan";
import {
  fanAssistanceResponseSchema,
  fanNarrativeSchema,
  type FanAssistRequest,
  type FanAssistanceResponse,
} from "../schemas";
import { getAccessibleRoute } from "../tools/fan";
import { getOfflineMode, type AiServiceResult } from "./shared.server";

export async function assistFan(
  request: FanAssistRequest,
): Promise<AiServiceResult<FanAssistanceResponse>> {
  const grounding = getAccessibleRoute(request);
  const fallback = createFanFallback(request, grounding);
  const mode = getOfflineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  try {
    const { generateValidatedJson } = await import("../client.server");
    const narrative = await generateValidatedJson({
      systemInstruction: FAN_SYSTEM_INSTRUCTION,
      prompt: buildFanPrompt(request, grounding),
      responseJsonSchema: FAN_NARRATIVE_JSON_SCHEMA,
      schema: fanNarrativeSchema,
    });
    return {
      data: fanAssistanceResponseSchema.parse({
        ...fallback,
        summary: narrative.summary,
        confidence: narrative.confidence,
        fallbackUsed: false,
      }),
      mode: "gemini",
    };
  } catch {
    return { data: fallback, mode: "fallback" };
  }
}
