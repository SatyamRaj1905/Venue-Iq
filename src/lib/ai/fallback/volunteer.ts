import { localizeSopTitle, localizeVolunteerBoundary } from "../localization/volunteer";
import type { VolunteerAssistanceResponse, VolunteerRequest } from "../types";
import type { VolunteerGrounding } from "../tools/volunteer";

export function createVolunteerFallback(
  request: VolunteerRequest,
  grounding: VolunteerGrounding,
): VolunteerAssistanceResponse {
  return {
    language: request.language,
    sopTitle: localizeSopTitle(request.language, request.topic),
    summary: grounding.localizedFallback.summary,
    checklist: [...grounding.localizedFallback.checklist],
    escalationRequired: grounding.sop.escalationRequired,
    escalationReason: grounding.localizedFallback.escalation,
    contactRole: grounding.localizedFallback.contactRole,
    authorityBoundary: localizeVolunteerBoundary(request.language, grounding.sop.authorityBoundary),
    confidence: 0.96,
    fallbackUsed: true,
    simulated: true,
  };
}
