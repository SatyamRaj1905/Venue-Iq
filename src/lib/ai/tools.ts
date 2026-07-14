import { getVolunteerFallback } from "@/lib/content/volunteerSops";
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
  type SimulationState,
  type StadiumAlert,
  type ZoneStatus,
} from "@/lib/domain";

import {
  localizeAccessibilityNote,
  localizeAlert,
  localizeFacilityType,
  localizeRouteExplanations,
  localizeRouteInstruction,
} from "./localization";
import { applyFanRequestPolicy, type FanIntent, type FanToolName } from "./intent";
import type {
  AlertSummary,
  FanAssistRequest,
  FanTransportOption,
  OperationsBriefRequest,
  RouteResult,
  ScenarioId,
  VolunteerRequest,
  VolunteerTopic,
} from "./types";

export interface FanGrounding {
  readonly intent: FanIntent;
  readonly selectedTool: FanToolName;
  readonly route?: RouteResult;
  readonly transportOptions?: readonly FanTransportOption[];
  readonly routeExplanations: readonly string[];
  readonly alerts: readonly AlertSummary[];
  readonly unavailableReason?: string;
}

export interface GroundedAction {
  readonly title: string;
  readonly description: string;
  readonly ownerTeam: string;
  readonly rationale: string;
}

export interface OperationsGrounding {
  readonly scenario: ScenarioId;
  readonly riskLevel: CrowdLevel;
  readonly affectedZones: readonly string[];
  readonly evidence: readonly string[];
  readonly recommendedActions: readonly GroundedAction[];
  readonly snapshot: Readonly<{
    occupancyPercentage: number;
    zones: readonly Readonly<{
      id: string;
      occupancyPercentage: number;
      status: ZoneStatus;
    }>[];
    gates: readonly Readonly<{
      id: string;
      throughputPerHour: number;
      estimatedQueueMinutes: number;
      status: ZoneStatus;
    }>[];
    transport: string;
    incidents: readonly Readonly<{
      title: string;
      severity: CrowdLevel;
      escalationRole: string;
    }>[];
    sustainabilityStatus: string;
  }>;
}

export interface VenueSop {
  readonly title: string;
  readonly steps: readonly string[];
  readonly escalationRequired: boolean;
  readonly escalationReason: string;
  readonly contactRole: string;
  readonly authorityBoundary: string;
}

export interface VolunteerGrounding {
  readonly sop: VenueSop;
  readonly localizedFallback: Readonly<{
    summary: string;
    checklist: readonly string[];
    escalation: string;
    contactRole: string;
  }>;
  readonly scenarioContext: Readonly<{
    scenario: ScenarioId;
    alerts: readonly string[];
  }>;
}

function round(value: number, digits = 1): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
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

function riskWeight(level: CrowdLevel): number {
  switch (level) {
    case "low":
      return 0;
    case "moderate":
      return 1;
    case "high":
      return 2;
    case "critical":
      return 3;
  }
}

function zoneRisk(status: ZoneStatus): CrowdLevel {
  switch (status) {
    case "normal":
      return "low";
    case "busy":
      return "moderate";
    case "congested":
      return "high";
    case "critical":
      return "critical";
  }
}

function operationsRisk(state: SimulationState): CrowdLevel {
  const levels: CrowdLevel[] = [
    ...state.zones.map((zone) => zoneRisk(zone.status)),
    ...state.incidents.map((incident) => incident.severity),
  ];
  return levels.reduce<CrowdLevel>(
    (highest, level) => (riskWeight(level) > riskWeight(highest) ? level : highest),
    "low",
  );
}

const ACTIONS_BY_SCENARIO: Readonly<Record<ScenarioId, readonly GroundedAction[]>> = {
  normal: [
    {
      title: "Maintain live monitoring",
      description: "Continue observing gate queues, zone density, and accessible routes.",
      ownerTeam: "Venue operations",
      rationale: "The simulated venue is within its normal operating thresholds.",
    },
  ],
  "arrival-surge": [
    {
      title: "Review gate staffing distribution",
      description: "Prepare a temporary staffing shift toward the busiest open arrival gates.",
      ownerTeam: "Crowd safety lead",
      rationale: "Arrival demand and queue estimates are elevated in affected zones.",
    },
    {
      title: "Publish approved low-crowd wayfinding",
      description: "Ask communications staff to highlight the open lower-load approach routes.",
      ownerTeam: "Guest services",
      rationale: "Deterministic zone data identifies less-loaded alternatives.",
    },
  ],
  "gate-closure": [
    {
      title: "Approve gate diversion plan",
      description: "Review the signed diversion route before directing arrivals to open gates.",
      ownerTeam: "Venue operations",
      rationale: "A simulated gate closure affects access and nearby crowd distribution.",
    },
    {
      title: "Position accessibility support",
      description: "Place trained hosts at the approved diversion decision point.",
      ownerTeam: "Accessibility lead",
      rationale: "Diversions can create additional barriers for step-free travel.",
    },
  ],
  "train-disruption": [
    {
      title: "Review transport contingency messaging",
      description: "Confirm accessible alternatives with the transport partner before publication.",
      ownerTeam: "Transport liaison",
      rationale: "The deterministic transport snapshot reports a disrupted network.",
    },
  ],
  "heat-alert": [
    {
      title: "Prepare heat-support points",
      description: "Confirm staffed water and shaded assistance points before directing guests.",
      ownerTeam: "Medical command",
      rationale: "A simulated heat alert increases guest welfare risk.",
    },
  ],
  "medical-response": [
    {
      title: "Protect the medical access corridor",
      description: "Request human approval to keep the designated response path clear.",
      ownerTeam: "Medical command",
      rationale: "The active incident requires an unobstructed trained-response route.",
    },
  ],
  "accessibility-obstruction": [
    {
      title: "Approve accessible-route diversion",
      description: "Verify the signed step-free alternative before volunteers communicate it.",
      ownerTeam: "Accessibility lead",
      rationale: "The primary accessible path is marked obstructed in the simulation.",
    },
  ],
  "waste-overflow": [
    {
      title: "Dispatch approved waste response",
      description:
        "Review a cleaning-team deployment that preserves emergency and accessible paths.",
      ownerTeam: "Sustainability lead",
      rationale: "Simulated bin utilization has exceeded the action threshold.",
    },
  ],
};

function operationsEvidence(state: SimulationState): string[] {
  const evidence = [
    `Simulated stadium occupancy is ${round(state.occupancyPercentage)}%.`,
    `The scenario affects ${state.affectedZoneIds.length} zone(s): ${state.affectedZoneIds.join(", ") || "none"}.`,
    `Transport network status is ${state.transport.networkStatus} with an average ${round(state.transport.averageDelayMinutes)} minute delay.`,
    `There are ${state.incidents.length} active or monitored incident(s).`,
    `Sustainability status is ${state.sustainability.status}.`,
  ];
  return evidence;
}

/** Returns a reduced, serializable operations snapshot without server configuration. */
export function getOperationsSnapshot(request: OperationsBriefRequest): OperationsGrounding {
  const state = getScenarioState(request.scenario);
  return {
    scenario: request.scenario,
    riskLevel: operationsRisk(state),
    affectedZones: state.affectedZoneIds,
    evidence: operationsEvidence(state),
    recommendedActions: ACTIONS_BY_SCENARIO[request.scenario],
    snapshot: {
      occupancyPercentage: round(state.occupancyPercentage),
      zones: state.zones.map((zone) => ({
        id: zone.zoneId,
        occupancyPercentage: round(zone.occupancyPercentage),
        status: zone.status,
      })),
      gates: state.gates.map((gate) => ({
        id: gate.gateNodeId,
        throughputPerHour: round(gate.throughputPerHour),
        estimatedQueueMinutes: round(gate.estimatedQueueMinutes),
        status: gate.status,
      })),
      transport: state.transport.summary,
      incidents: state.incidents.map((incident) => ({
        title: incident.title,
        severity: incident.severity,
        escalationRole: incident.escalationRole,
      })),
      sustainabilityStatus: state.sustainability.status,
    },
  };
}

const SOPS: Readonly<Record<VolunteerTopic, VenueSop>> = {
  "accessible-entry": {
    title: "Accessible entrance assistance",
    steps: [
      "Ask what mobility or sensory support the guest needs without requesting a diagnosis.",
      "Use the signed east-plaza step-free route to the Gate B assistance desk.",
      "Offer to contact the trained accessibility host.",
      "Use only a route confirmed open by venue control.",
    ],
    escalationRequired: false,
    escalationReason:
      "Escalate if the signed route is blocked, the guest is distressed, or medical help is requested.",
    contactRole: "Gate B accessibility host",
    authorityBoundary:
      "Volunteers may guide guests on approved routes but may not create a diversion or provide physical assistance without consent and training.",
  },
  "lost-person": {
    title: "Lost person or separated family",
    steps: [
      "Keep the reporting guest at the nearest staffed assistance point.",
      "Record only the minimum description needed by venue control.",
      "Contact the guest-services supervisor using the approved radio channel.",
      "Do not broadcast personal details publicly.",
    ],
    escalationRequired: true,
    escalationReason:
      "All lost-person reports must be handed to the trained guest-services and security teams.",
    contactRole: "Guest-services supervisor",
    authorityBoundary:
      "Volunteers must not independently search restricted areas or share personal information.",
  },
  medical: {
    title: "Medical assistance",
    steps: [
      "Contact medical command immediately through the approved channel.",
      "State the signed location marker and visible hazards.",
      "Keep access clear and follow the medical commander's instructions.",
      "Do not diagnose, move, or treat the guest unless specifically trained and directed.",
    ],
    escalationRequired: true,
    escalationReason:
      "Medical concerns are outside standard volunteer authority and require trained responders.",
    contactRole: "Medical command",
    authorityBoundary:
      "Do not improvise treatment or move a person in distress unless the area is immediately unsafe and trained staff direct you.",
  },
  transport: {
    title: "Transport disruption assistance",
    steps: [
      "Check the approved transport status bulletin.",
      "Share only the listed accessible alternatives and estimated times.",
      "Direct guests to the transport liaison desk for individual support.",
    ],
    escalationRequired: false,
    escalationReason:
      "Escalate when no approved accessible option is listed or a guest may miss essential assistance.",
    contactRole: "Transport liaison",
    authorityBoundary:
      "Volunteers may relay approved updates but cannot promise departures, capacity, refunds, or unlisted transport.",
  },
  crowd: {
    title: "Crowd concern",
    steps: [
      "Report the signed location and observable concern to crowd control.",
      "Keep emergency and step-free paths clear.",
      "Follow approved steward instructions and avoid creating a counter-flow.",
    ],
    escalationRequired: true,
    escalationReason:
      "Crowd interventions require the trained crowd-safety team and human approval.",
    contactRole: "Crowd safety lead",
    authorityBoundary:
      "Volunteers must not open barriers, redirect a crowd, or make emergency announcements without authorization.",
  },
};

/** Retrieves trusted local SOP content; it performs no generative operation. */
export function getVenueSop(request: VolunteerRequest): VolunteerGrounding {
  const state = getScenarioState(request.scenario);
  const accessRouteUnavailable =
    request.topic === "accessible-entry" &&
    (state.routeConditions.obstructedEdgeIds?.length ?? 0) > 0;
  const baseSop = SOPS[request.topic];
  const sop: VenueSop = accessRouteUnavailable
    ? {
        ...baseSop,
        steps: [
          "Keep the guest at the nearest staffed assistance point.",
          "Contact the accessibility lead through the approved channel.",
          "Wait for venue control to confirm a signed step-free alternative.",
          "Do not improvise or communicate an unverified diversion.",
        ],
        escalationRequired: true,
        escalationReason:
          "The shared simulation reports an accessible-route obstruction that requires venue-control confirmation.",
        contactRole: "Accessibility lead and venue control",
      }
    : baseSop;
  return {
    sop,
    localizedFallback: getVolunteerFallback(
      request.language,
      request.topic,
      accessRouteUnavailable,
    ),
    scenarioContext: {
      scenario: request.scenario,
      alerts: state.alerts.map((alert) => alert.message),
    },
  };
}
