import type { FanAssistRequest } from "../schemas";
import type { FanGrounding } from "../tools/fan";
import { CORE_SAFETY_INSTRUCTION, LANGUAGE_NAMES, stringSchema, trustedPrompt } from "./shared";

export const FAN_SYSTEM_INSTRUCTION = `${CORE_SAFETY_INSTRUCTION}
Explain the deterministic route without changing any step, distance, time, facility, or alert. Keep the result concise and practical.`;

function fanNarrativeContext(grounding: FanGrounding): unknown {
  const route = grounding.route;
  return {
    intent: grounding.intent,
    selectedTool: grounding.selectedTool,
    ...(route === undefined
      ? {}
      : {
          route: {
            originId: route.originId,
            destinationId: route.destinationId,
            totalDistanceMeters: route.totalDistanceMeters,
            estimatedWalkingMinutes: route.estimatedWalkingMinutes,
            stepFree: route.stepFree,
            crowdLevel: route.crowdLevel,
          },
        }),
    ...(grounding.transportOptions === undefined
      ? {}
      : {
          transportOptions: grounding.transportOptions.slice(0, 3).map((option) => ({
            name: option.name,
            status: option.status,
            waitMinutes: option.waitMinutes,
            totalJourneyMinutes: option.totalJourneyMinutes,
            accessible: option.accessible,
          })),
        }),
    routeExplanations: grounding.routeExplanations.slice(0, 4),
    alerts: grounding.alerts.slice(0, 4).map((alert) => ({
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
    })),
    ...(grounding.unavailableReason === undefined
      ? {}
      : { unavailableReason: grounding.unavailableReason }),
  };
}

export function buildFanPrompt(request: FanAssistRequest, grounding: FanGrounding): string {
  return trustedPrompt(
    `Respond in ${LANGUAGE_NAMES[request.language]}. Preserve all grounded route facts`,
    { message: request.message },
    fanNarrativeContext(grounding),
  );
}

export const FAN_NARRATIVE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { ...stringSchema, maxLength: 400 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["summary", "confidence"],
} as const;
