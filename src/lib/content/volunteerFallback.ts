import { createVolunteerFallback as createCanonicalVolunteerFallback } from "@/lib/ai/fallback/volunteer";
import type {
  ScenarioId,
  SupportedLanguage,
  VolunteerAssistanceResponse,
  VolunteerRequest,
} from "@/lib/ai/schemas";
import { getVolunteerFallbackGrounding } from "@/lib/ai/tools/volunteerGrounding";

export function createVolunteerFallback(
  language: SupportedLanguage,
  topic: VolunteerRequest["topic"],
  scenario: ScenarioId = "normal",
): VolunteerAssistanceResponse {
  const request: VolunteerRequest = {
    question: "What trusted venue SOP should I follow?",
    language,
    role: "guest-services",
    topic,
    scenario,
  };
  return createCanonicalVolunteerFallback(request, getVolunteerFallbackGrounding(request));
}
