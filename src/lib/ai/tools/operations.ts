import {
  getScenarioState,
  type CrowdLevel,
  type SimulationState,
  type ZoneStatus,
} from "@/lib/domain";

import type { OperationsBriefRequest, ScenarioId } from "../types";
import { round } from "./shared";

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
    seed: number;
    tick: number;
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
  return [
    `Simulated stadium occupancy is ${round(state.occupancyPercentage)}%.`,
    `The scenario affects ${state.affectedZoneIds.length} zone(s): ${state.affectedZoneIds.join(", ") || "none"}.`,
    `Transport network status is ${state.transport.networkStatus} with an average ${round(state.transport.averageDelayMinutes)} minute delay.`,
    `There are ${state.incidents.length} active or monitored incident(s).`,
    `Sustainability status is ${state.sustainability.status}.`,
  ];
}

/** Converts an existing simulation state into reduced, serializable AI grounding. */
export function getOperationsGroundingFromState(state: SimulationState): OperationsGrounding {
  return {
    scenario: state.scenarioId,
    riskLevel: operationsRisk(state),
    affectedZones: state.affectedZoneIds,
    evidence: operationsEvidence(state),
    recommendedActions: ACTIONS_BY_SCENARIO[state.scenarioId],
    snapshot: {
      seed: state.seed,
      tick: state.tick,
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

/** Returns a reduced, serializable operations snapshot without server configuration. */
export function getOperationsSnapshot(request: OperationsBriefRequest): OperationsGrounding {
  const state =
    request.seed === undefined && request.tick === undefined
      ? getScenarioState(request.scenario)
      : getScenarioState(request.scenario, {
          ...(request.seed === undefined ? {} : { seed: request.seed }),
          ...(request.tick === undefined ? {} : { tick: request.tick }),
        });
  return getOperationsGroundingFromState(state);
}
