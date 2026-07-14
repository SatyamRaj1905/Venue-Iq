import {
  STADIUM_GRAPH,
  findNearbyFacilities,
  findRoute,
  getScenarioState,
  getTransportOptions as rankTransportOptions,
  type CrowdLevel,
  type FacilityKind,
  type RouteConditions,
  type RouteResult as DomainRouteResult,
  type StadiumAlert,
} from "@/lib/domain";

import { applyFanRequestPolicy, type FanIntent, type FanToolName } from "../intent";
import {
  localizeAccessibilityNote,
  localizeAlert,
  localizeFacilityType,
  localizeRouteExplanations,
  localizeRouteInstruction,
} from "../localization";
import type { AlertSummary, FanAssistRequest, FanTransportOption, RouteResult } from "../types";
import { round } from "./shared";

export interface FanGrounding {
  readonly intent: FanIntent;
  readonly selectedTool: FanToolName;
  readonly route?: RouteResult;
  readonly transportOptions?: readonly FanTransportOption[];
  readonly routeExplanations: readonly string[];
  readonly alerts: readonly AlertSummary[];
  readonly unavailableReason?: string;
}

function mapAlertSeverity(severity: StadiumAlert["severity"]): CrowdLevel {
  switch (severity) {
    case "info":
      return "low";
    case "warning":
      return "high";
    case "critical":
      return "critical";
  }
}

function mapRoute(
  route: DomainRouteResult,
  request: FanAssistRequest,
  facilityKinds?: readonly FacilityKind[],
  conditions?: RouteConditions,
): RouteResult {
  const candidateFacilities =
    facilityKinds === undefined
      ? route.nearbyFacilities
      : findNearbyFacilities(route.nodeIds, {
          graph: STADIUM_GRAPH,
          kinds: facilityKinds,
          maximumDistanceMeters: 200,
        });
  const unavailableFacilityIds = new Set(conditions?.closedNodeIds ?? []);
  const unavailableEdgeIds = new Set([
    ...(conditions?.closedEdgeIds ?? []),
    ...(conditions?.obstructedEdgeIds ?? []),
  ]);
  for (const edge of STADIUM_GRAPH.edges) {
    if (
      edge.status === "closed" ||
      edge.accessibilityObstructed ||
      unavailableEdgeIds.has(edge.id)
    ) {
      unavailableFacilityIds.add(edge.from);
      unavailableFacilityIds.add(edge.to);
    }
  }
  const nearbyFacilities = candidateFacilities.filter(
    (facility) => !unavailableFacilityIds.has(facility.id),
  );
  return {
    originId: route.originId,
    destinationId: route.destinationId,
    totalDistanceMeters: route.totalDistanceMeters,
    estimatedWalkingMinutes: route.estimatedWalkingMinutes,
    stepFree: route.isStepFree,
    crowdLevel: route.crowdLevel,
    steps: route.steps.map((step) => ({
      id: step.edgeId,
      instruction: localizeRouteInstruction(request.language, step.pathKind, step.toName),
      distanceMeters: step.distanceMeters,
      estimatedMinutes: round(step.estimatedSeconds / 60),
      crowdLevel: step.crowdLevel,
      accessibilityNotes: [
        localizeAccessibilityNote(request.language, step.pathKind, step.stepFree),
      ],
    })),
    nearbyFacilities: nearbyFacilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      type: localizeFacilityType(request.language, facility.kind),
      locationId: facility.zoneId,
      accessible: facility.accessible,
    })),
  };
}

/** Executes deterministic, read-only routing and facility lookup. */
export function getAccessibleRoute(request: FanAssistRequest): FanGrounding {
  const policy = applyFanRequestPolicy(request);
  const effectiveRequest = policy.request;
  const state = getScenarioState(effectiveRequest.scenario);
  const result = findRoute(STADIUM_GRAPH, {
    originId: effectiveRequest.currentLocation,
    destinationId: effectiveRequest.destination,
    preferences: effectiveRequest.preferences,
    conditions: state.routeConditions,
  });
  const alerts = state.alerts.map((alert) =>
    localizeAlert(
      alert,
      effectiveRequest.scenario,
      effectiveRequest.language,
      mapAlertSeverity(alert.severity),
    ),
  );
  const transportOptions =
    policy.selectedTool === "getTransportOptions"
      ? rankTransportOptions({
          accessibleOnly: effectiveRequest.preferences.stepFree,
        })
          .slice(0, 5)
          .map((option) => ({
            id: option.id,
            name: option.name,
            mode: option.mode,
            status: option.status,
            waitMinutes: option.waitMinutes,
            totalJourneyMinutes: option.totalJourneyMinutes,
            accessible: option.accessible,
            destinationNodeId: option.destinationNodeId,
            note: option.note,
            simulated: true as const,
          }))
      : undefined;

  if (!result.found) {
    return {
      intent: policy.intent,
      selectedTool: policy.selectedTool,
      ...(transportOptions === undefined ? {} : { transportOptions }),
      routeExplanations: [],
      alerts,
      unavailableReason: result.message,
    };
  }

  return {
    intent: policy.intent,
    selectedTool: policy.selectedTool,
    ...(transportOptions === undefined ? {} : { transportOptions }),
    route: mapRoute(result.route, effectiveRequest, policy.facilityKinds, state.routeConditions),
    routeExplanations: localizeRouteExplanations(
      effectiveRequest.language,
      effectiveRequest.preferences,
      result.route.crowdLevel,
    ),
    alerts,
  };
}
