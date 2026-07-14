import {
  calculateGateThroughput,
  calculateOccupancyPercentage,
  calculateZoneCrowdMetrics,
  classifyZoneStatus,
  estimateQueueTime,
} from "./crowd";
import { assessIncident, sortIncidentsByPriority } from "./incidents";
import type { ScenarioId } from "./constants";
import { getScenarioDefinition } from "./scenarioDefinitions";
import { getScenarioProfile, type ScenarioProfile } from "./scenarioProfiles";
import { STADIUM_ZONES } from "./stadiumGraph";
import { getSustainabilitySnapshot } from "./sustainability";
import { BASE_TRANSPORT_SERVICES, calculateTransportStatus } from "./transport";
import type {
  AlertSeverity,
  GateSimulationMetrics,
  ScenarioDefinition,
  SimulationState,
  SimulationTimelineEvent,
  StadiumAlert,
  SustainabilityInput,
  TransportService,
  ZoneCrowdMetrics,
} from "./types";

export { getScenarioDefinition, SCENARIO_DEFINITIONS, SCENARIOS } from "./scenarioDefinitions";

export const DEFAULT_SIMULATION_SEED = 20_260_714;

const BASE_OCCUPANCY_FRACTION: Readonly<Record<string, number>> = {
  "north-entry": 0.42,
  "north-concourse": 0.58,
  "east-concourse": 0.56,
  "south-concourse": 0.49,
  "west-concourse": 0.38,
  "upper-north": 0.54,
  "upper-east": 0.48,
  "transport-hub": 0.43,
};

const BASE_QUEUE: Readonly<Record<string, number>> = {
  "north-entry": 230,
  "north-concourse": 140,
  "east-concourse": 175,
  "south-concourse": 125,
  "west-concourse": 80,
  "upper-north": 95,
  "upper-east": 90,
  "transport-hub": 210,
};

const BASE_ENTRIES_PER_15_MINUTES: Readonly<Record<string, number>> = {
  "north-entry": 1_050,
  "north-concourse": 920,
  "east-concourse": 880,
  "south-concourse": 820,
  "west-concourse": 710,
  "upper-north": 760,
  "upper-east": 680,
  "transport-hub": 1_120,
};

interface SimulationOptions {
  readonly seed?: number;
  readonly tick?: number;
  readonly paused?: boolean;
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new RangeError("Simulation seed must be finite.");
  }
  return Math.trunc(seed) >>> 0;
}

/** Mulberry32: a compact repeatable pseudo-random generator for demo data. */
export function createSeededRandom(seed: number): () => number {
  let state = normalizeSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function jitter(value: number, fraction: number, random: () => number): number {
  return value * (1 + (random() * 2 - 1) * fraction);
}

function profileValue(values: Readonly<Record<string, number>>, zoneId: string): number {
  return values[zoneId] ?? 1;
}

function createZoneMetrics(
  profile: ScenarioProfile,
  random: () => number,
  tick: number,
): readonly ZoneCrowdMetrics[] {
  const tickWave = 1 + Math.sin(tick / 3) * 0.012;
  return STADIUM_ZONES.map((zone) => {
    const baseFraction = BASE_OCCUPANCY_FRACTION[zone.id] ?? 0.5;
    const occupancy = Math.max(
      0,
      Math.round(
        jitter(
          zone.capacity *
            baseFraction *
            profileValue(profile.occupancyMultiplier, zone.id) *
            tickWave,
          0.015,
          random,
        ),
      ),
    );
    const queuedPeople = Math.max(
      0,
      Math.round(
        jitter(
          (BASE_QUEUE[zone.id] ?? 100) * profileValue(profile.queueMultiplier, zone.id),
          0.025,
          random,
        ),
      ),
    );
    const entriesInWindow = Math.max(
      1,
      Math.round(
        jitter(
          (BASE_ENTRIES_PER_15_MINUTES[zone.id] ?? 700) *
            profileValue(profile.throughputMultiplier, zone.id),
          0.018,
          random,
        ),
      ),
    );

    return calculateZoneCrowdMetrics({
      zoneId: zone.id,
      occupancy,
      capacity: zone.capacity,
      areaSquareMeters: zone.areaSquareMeters,
      queuedPeople,
      entriesInWindow,
      windowMinutes: 15,
      activeIncidentCount: profile.incidentZoneIds.includes(zone.id) ? 1 : 0,
    });
  });
}

interface GateProfile {
  readonly nodeId: string;
  readonly zoneId: string;
  readonly baseEntries: number;
  readonly baseQueue: number;
}

const GATE_PROFILES: readonly GateProfile[] = [
  {
    nodeId: "gate-a",
    zoneId: "north-entry",
    baseEntries: 1_050,
    baseQueue: 230,
  },
  {
    nodeId: "gate-b",
    zoneId: "east-concourse",
    baseEntries: 880,
    baseQueue: 175,
  },
  {
    nodeId: "gate-c",
    zoneId: "south-concourse",
    baseEntries: 820,
    baseQueue: 125,
  },
  {
    nodeId: "gate-d",
    zoneId: "west-concourse",
    baseEntries: 710,
    baseQueue: 80,
  },
];

function createGateMetrics(
  profile: ScenarioProfile,
  random: () => number,
): readonly GateSimulationMetrics[] {
  const closedNodes = new Set(profile.closedNodeIds);
  return GATE_PROFILES.map((gate) => {
    const closed = closedNodes.has(gate.nodeId);
    const entriesInLast15Minutes = closed
      ? 0
      : Math.max(
          1,
          Math.round(
            jitter(
              gate.baseEntries * profileValue(profile.throughputMultiplier, gate.zoneId),
              0.018,
              random,
            ),
          ),
        );
    const throughputPerHour = calculateGateThroughput(entriesInLast15Minutes, 15);
    const queuedPeople = Math.max(
      0,
      Math.round(
        jitter(gate.baseQueue * profileValue(profile.queueMultiplier, gate.zoneId), 0.025, random),
      ),
    );
    const estimatedQueueMinutes = closed ? 60 : estimateQueueTime(queuedPeople, throughputPerHour);
    const gateRisk = Math.min(100, estimatedQueueMinutes * 3 + (closed ? 45 : 12));
    return {
      gateNodeId: gate.nodeId,
      entriesInLast15Minutes,
      throughputPerHour,
      queuedPeople,
      estimatedQueueMinutes,
      status: classifyZoneStatus(gateRisk),
      simulated: true,
    };
  });
}

function transportForScenario(scenarioId: ScenarioId): readonly TransportService[] {
  if (scenarioId !== "train-disruption") {
    return BASE_TRANSPORT_SERVICES;
  }
  return BASE_TRANSPORT_SERVICES.map((service) => {
    if (service.id === "north-stadium-rail") {
      return {
        ...service,
        status: "major-delay" as const,
        waitMinutes: 31,
        delayMinutes: 28,
        capacityUtilizationPercentage: 112,
        note: "Major simulated delay; use metro or south shuttle.",
      };
    }
    if (service.id === "south-park-shuttle") {
      return {
        ...service,
        status: "crowded" as const,
        waitMinutes: 13,
        capacityUtilizationPercentage: 88,
        note: "Extra demand following the rail disruption.",
      };
    }
    return service;
  });
}

function createSustainabilityInput(
  totalOccupancy: number,
  overrides: Partial<SustainabilityInput>,
): SustainabilityInput {
  const defaults: SustainabilityInput = {
    totalArrivals: totalOccupancy,
    publicTransportArrivals: Math.round(totalOccupancy * 0.62),
    waterRefills: 8_400,
    totalWasteKilograms: 3_250,
    binCapacityKilograms: 5_000,
    currentEnergyKwh: 6_720,
    baselineEnergyKwh: 7_000,
  };
  return { ...defaults, ...overrides };
}

function createAlerts(profile: ScenarioProfile): readonly StadiumAlert[] {
  if (profile.alertInputs.length === 0) {
    return [
      {
        id: "alert-normal",
        title: "Normal simulated operations",
        message: "No major venue disruption is active.",
        severity: "info",
        zoneIds: [],
        simulated: true,
      },
    ];
  }
  return profile.alertInputs.map((alert) => ({ ...alert, simulated: true }));
}

function createTimeline(
  definition: ScenarioDefinition,
  alerts: readonly StadiumAlert[],
): readonly SimulationTimelineEvent[] {
  const start: SimulationTimelineEvent = {
    id: `${definition.id}-start`,
    minute: 0,
    label: "Simulation started",
    detail: definition.description,
    severity: "info",
    simulated: true,
  };
  const alertEvents = alerts
    .filter((alert) => alert.id !== "alert-normal")
    .map((alert, index) => ({
      id: `${definition.id}-event-${index + 1}`,
      minute: 5 + index * 3,
      label: alert.title,
      detail: alert.message,
      severity: alert.severity,
      simulated: true as const,
    }));
  return [start, ...alertEvents];
}

function optionsFromArgument(
  seedOrOptions: number | SimulationOptions,
): Required<SimulationOptions> {
  if (typeof seedOrOptions === "number") {
    return { seed: normalizeSeed(seedOrOptions), tick: 0, paused: false };
  }
  const tick = seedOrOptions.tick ?? 0;
  if (!Number.isInteger(tick) || tick < 0) {
    throw new RangeError("Simulation tick must be a non-negative integer.");
  }
  return {
    seed: normalizeSeed(seedOrOptions.seed ?? DEFAULT_SIMULATION_SEED),
    tick,
    paused: seedOrOptions.paused ?? false,
  };
}

export function getScenarioState(
  scenarioId: ScenarioId,
  seedOrOptions: number | SimulationOptions = DEFAULT_SIMULATION_SEED,
): SimulationState {
  const definition = getScenarioDefinition(scenarioId);
  const options = optionsFromArgument(seedOrOptions);
  const profile = getScenarioProfile(scenarioId);
  const random = createSeededRandom(options.seed + options.tick * 7_919);
  const zones = createZoneMetrics(profile, random, options.tick);
  const gates = createGateMetrics(profile, random);
  const totalOccupancy = zones.reduce((total, zone) => total + zone.occupancy, 0);
  const capacity = zones.reduce((total, zone) => total + zone.capacity, 0);
  const crowdByZone = Object.fromEntries(
    zones.map((zone) => [zone.zoneId, zone.occupancyPercentage]),
  );
  const alerts = createAlerts(profile);
  const baseTimestamp = Date.parse("2026-06-15T14:00:00.000Z");

  return {
    scenarioId,
    seed: options.seed,
    tick: options.tick,
    paused: options.paused,
    lastUpdatedIso: new Date(baseTimestamp + options.tick * 60_000).toISOString(),
    affectedZoneIds: definition.affectedZoneIds,
    zones,
    gates,
    routeConditions: {
      closedEdgeIds: profile.closedEdgeIds,
      closedNodeIds: profile.closedNodeIds,
      obstructedEdgeIds: profile.obstructedEdgeIds,
      crowdByZone,
    },
    transport: calculateTransportStatus(transportForScenario(scenarioId)),
    incidents: sortIncidentsByPriority(profile.incidentInputs.map(assessIncident)),
    sustainability: getSustainabilitySnapshot(
      createSustainabilityInput(totalOccupancy, profile.sustainabilityOverrides),
    ),
    alerts,
    timeline: createTimeline(definition, alerts),
    totalOccupancy,
    capacity,
    occupancyPercentage: calculateOccupancyPercentage(totalOccupancy, capacity),
    simulated: true,
  };
}

export function getOperationsSnapshot(
  scenarioId: ScenarioId = "normal",
  seed = DEFAULT_SIMULATION_SEED,
): SimulationState {
  return getScenarioState(scenarioId, seed);
}

export function advanceSimulation(state: SimulationState, ticks = 1): SimulationState {
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new RangeError("Ticks must be a non-negative integer.");
  }
  if (state.paused || ticks === 0) {
    return state;
  }
  return getScenarioState(state.scenarioId, {
    seed: state.seed,
    tick: state.tick + ticks,
    paused: false,
  });
}

export function setSimulationPaused(state: SimulationState, paused: boolean): SimulationState {
  if (state.paused === paused) {
    return state;
  }
  return { ...state, paused };
}

export function getHighestScenarioSeverity(state: SimulationState): AlertSeverity {
  if (state.alerts.some((alert) => alert.severity === "critical")) {
    return "critical";
  }
  if (state.alerts.some((alert) => alert.severity === "warning")) {
    return "warning";
  }
  return "info";
}
