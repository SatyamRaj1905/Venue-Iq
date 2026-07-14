import type {
  SupportedLanguage,
  VolunteerAssistanceResponse,
  VolunteerRequest,
  ScenarioId,
} from "@/lib/ai/schemas";
import { getVolunteerFallback } from "./volunteerSops";

const sopTitles: Record<VolunteerRequest["topic"], string> = {
  "accessible-entry": "Accessible entrance support",
  "lost-person": "Lost person and family reunification",
  medical: "Medical escalation",
  transport: "Transport disruption support",
  crowd: "Crowd concern escalation",
};

export function createVolunteerFallback(
  language: SupportedLanguage,
  topic: VolunteerRequest["topic"],
  scenario: ScenarioId = "normal",
): VolunteerAssistanceResponse {
  const fallback = getVolunteerFallback(language, topic, scenario === "accessibility-obstruction");
  return {
    language,
    sopTitle: sopTitles[topic],
    summary: fallback.summary,
    checklist: [...fallback.checklist],
    escalationRequired: true,
    escalationReason: fallback.escalation,
    contactRole: fallback.contactRole,
    authorityBoundary:
      "Volunteers may guide, reassure and contact the named venue role. They must not improvise emergency instructions or enter restricted areas.",
    confidence: 0.9,
    fallbackUsed: true,
    simulated: true,
  };
}
