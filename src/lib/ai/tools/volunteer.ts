import { getScenarioState } from "@/lib/domain";

import type { VolunteerRequest } from "../types";
import {
  buildVolunteerGrounding,
  type VolunteerGrounding as VolunteerGroundingResult,
} from "./volunteerGrounding";

export { getVolunteerFallbackGrounding } from "./volunteerGrounding";
export type { VenueSop, VolunteerGrounding } from "./volunteerGrounding";

export function getVenueSop(request: VolunteerRequest): VolunteerGroundingResult {
  const state = getScenarioState(request.scenario);
  return buildVolunteerGrounding(request, {
    accessRouteUnavailable: (state.routeConditions.obstructedEdgeIds?.length ?? 0) > 0,
    alerts: state.alerts.map((alert) => alert.message),
  });
}
