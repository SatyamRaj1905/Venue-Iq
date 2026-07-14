import type { VolunteerRequest } from "../schemas";
import type { VolunteerGrounding } from "../tools/volunteer";
import { CORE_SAFETY_INSTRUCTION, LANGUAGE_NAMES, stringSchema, trustedPrompt } from "./shared";

export const VOLUNTEER_SYSTEM_INSTRUCTION = `${CORE_SAFETY_INSTRUCTION}
Restate only the trusted SOP in role-appropriate language. Volunteers must not improvise in emergencies or act beyond the stated authority boundary.`;

function volunteerNarrativeContext(grounding: VolunteerGrounding): unknown {
  return {
    sop: grounding.sop,
    scenario: grounding.scenarioContext.scenario,
    alerts: grounding.scenarioContext.alerts,
  };
}

export function buildVolunteerPrompt(
  request: VolunteerRequest,
  grounding: VolunteerGrounding,
): string {
  return trustedPrompt(
    `Respond in ${LANGUAGE_NAMES[request.language]}. Do not expand the SOP`,
    {
      question: request.question,
      role: request.role,
      topic: request.topic,
      scenario: request.scenario,
    },
    volunteerNarrativeContext(grounding),
  );
}

export const VOLUNTEER_NARRATIVE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { ...stringSchema, maxLength: 400 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["summary", "confidence"],
} as const;
