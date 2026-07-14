import "server-only";

import { createVolunteerFallback } from "../fallback/volunteer";
import {
  buildVolunteerPrompt,
  VOLUNTEER_NARRATIVE_JSON_SCHEMA,
  VOLUNTEER_SYSTEM_INSTRUCTION,
} from "../prompts/volunteer";
import {
  volunteerAssistanceResponseSchema,
  volunteerNarrativeSchema,
  type VolunteerAssistanceResponse,
  type VolunteerRequest,
} from "../schemas";
import { getVenueSop } from "../tools/volunteer";
import { getOfflineMode, type AiServiceResult } from "./shared.server";

export async function assistVolunteer(
  request: VolunteerRequest,
): Promise<AiServiceResult<VolunteerAssistanceResponse>> {
  const grounding = getVenueSop(request);
  const fallback = createVolunteerFallback(request, grounding);
  const mode = getOfflineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  try {
    const { generateValidatedJson } = await import("../client.server");
    const narrative = await generateValidatedJson({
      systemInstruction: VOLUNTEER_SYSTEM_INSTRUCTION,
      prompt: buildVolunteerPrompt(request, grounding),
      responseJsonSchema: VOLUNTEER_NARRATIVE_JSON_SCHEMA,
      schema: volunteerNarrativeSchema,
    });
    return {
      data: volunteerAssistanceResponseSchema.parse({
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
