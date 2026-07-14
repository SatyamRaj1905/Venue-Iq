import type { OperationsBriefRequest } from "../schemas";
import type { OperationsGrounding } from "../tools/operations";
import { CORE_SAFETY_INSTRUCTION, LANGUAGE_NAMES, stringSchema, trustedPrompt } from "./shared";

export const OPERATIONS_SYSTEM_INSTRUCTION = `${CORE_SAFETY_INSTRUCTION}
Summarize the operations snapshot and suggest reversible actions for the listed venue teams. Do not invent affected zones or evidence. Never give autonomous emergency commands.`;

function operationsNarrativeContext(grounding: OperationsGrounding): unknown {
  return {
    scenario: grounding.scenario,
    riskLevel: grounding.riskLevel,
    affectedZones: grounding.affectedZones,
    evidence: grounding.evidence,
    recommendedActions: grounding.recommendedActions,
  };
}

export function buildOperationsPrompt(
  request: OperationsBriefRequest,
  grounding: OperationsGrounding,
): string {
  return trustedPrompt(
    `Respond in ${LANGUAGE_NAMES[request.language]}. Every recommendation remains pending human approval`,
    { scenario: request.scenario },
    operationsNarrativeContext(grounding),
  );
}

export const OPERATIONS_NARRATIVE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { ...stringSchema, maxLength: 400 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["summary", "confidence"],
} as const;
