import {
  calculateGateThroughput,
  calculateOccupancyPercentage,
  calculateZoneCrowdMetrics,
  classifyZoneStatus,
  estimateQueueTime,
} from "./crowd";
import { assessIncident, sortIncidentsByPriority } from "./incidents";
import { STADIUM_ZONES } from "./stadiumGraph";
import { getSustainabilitySnapshot } from "./sustainability";
import { BASE_TRANSPORT_SERVICES, calculateTransportStatus } from "./transport";
import type {
  AlertSeverity,
  GateSimulationMetrics,
  IncidentInput,
  ScenarioDefinition,
  ScenarioId,
  SimulationState,
  SimulationTimelineEvent,
  StadiumAlert,
  SustainabilityInput,
  TransportService,
  ZoneCrowdMetrics,
  ZoneId,
} from "./types";

export const DEFAULT_SIMULATION_SEED = 20_260_714;

export const SCENARIO_DEFINITIONS: readonly ScenarioDefinition[] = [
  {
    id: "normal",
    name: "Normal operations",
    description: "Expected match-day flows with no active disruption.",
    affectedZoneIds: [],
  },
  {
    id: "arrival-surge",
    name: "Pre-kickoff arrival surge",
    description: "A concentrated wave of fans reaches the north and east gates.",
    affectedZoneIds: ["north-entry", "north-concourse", "east-concourse"],
  },
  {
    id: "gate-closure",
    name: "Gate C closure",
    description: "Gate C is closed and arrivals must be redirected.",
    affectedZoneIds: ["south-concourse", "east-concourse", "west-concourse"],
  },
  {
    id: "train-disruption",
    name: "Train disruption",
    description: "North Stadium Rail has a major delay and crowding is building.",
    affectedZoneIds: ["transport-hub", "north-entry"],
  },
  {
    id: "heat-alert",
    name: "Heat alert",
    description: "High temperatures increase welfare and hydration demand.",
    affectedZoneIds: [
      "north-entry",
      "north-concourse",
      "east-concourse",
      "south-concourse",
      "west-concourse",
    ],
  },
  {
    id: "medical-response",
    name: "Medical response",
    description: "A medical incident requires a protected access corridor.",
    affectedZoneIds: ["east-concourse"],
  },
  {
    id: "accessibility-obstruction",
    name: "Accessible-path obstruction",
    description: "The north lift route is unavailable; the ramp remains open.",
    affectedZoneIds: ["north-concourse", "upper-north"],
  },
  {
    id: "waste-overflow",
    name: "Waste-bin overflow",
    description: "Waste capacity is exceeded around the south food court.",
    affectedZoneIds: ["south-concourse"],
  },
] as const;

/** Concise alias used by scenario controls. */
export const SCENARIOS = SCENARIO_DEFINITIONS;

const SCENARIO_IDS: ReadonlySet<string> = new Set(
  SCENARIO_DEFINITIONS.map((scenario) => scenario.id),
);

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

interface ScenarioProfile {
  readonly occupancyMultiplier: Readonly<Record<string, number>>;
  readonly queueMultiplier: Readonly<Record<string, number>>;
  readonly throughputMultiplier: Readonly<Record<string, number>>;
  readonly incidentZoneIds: readonly ZoneId[];
  readonly closedEdgeIds: readonly string[];
  readonly closedNodeIds: readonly string[];
  readonly obstructedEdgeIds: readonly string[];
  readonly incidentInputs: readonly IncidentInput[];
  readonly alertInputs: readonly Omit<StadiumAlert, "simulated">[];
  readonly sustainabilityOverrides: Partial<SustainabilityInput>;
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

export function isScenarioId(value: string): value is ScenarioId {
  return SCENARIO_IDS.has(value);
}

export function getScenarioDefinition(scenarioId: ScenarioId): ScenarioDefinition {
  const definition = SCENARIO_DEFINITIONS.find((candidate) => candidate.id === scenarioId);
  if (definition === undefined) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }
  return definition;
}

function baseProfile(): ScenarioProfile {
  return {
    occupancyMultiplier: {},
    queueMultiplier: {},
    throughputMultiplier: {},
    incidentZoneIds: [],
    closedEdgeIds: [],
    closedNodeIds: [],
    obstructedEdgeIds: [],
    incidentInputs: [],
    alertInputs: [],
    sustainabilityOverrides: {},
  };
}

function scenarioProfile(scenarioId: ScenarioId): ScenarioProfile {
  const base = baseProfile();
  switch (scenarioId) {
    case "normal":
      return base;
    case "arrival-surge":
      return {
        ...base,
        occupancyMultiplier: {
          "north-entry": 2.55,
          "north-concourse": 1.62,
          "east-concourse": 1.38,
        },
        queueMultiplier: {
          "north-entry": 8.2,
          "north-concourse": 4.5,
          "east-concourse": 3.6,
        },
        throughputMultiplier: {
          "north-entry": 1.16,
          "north-concourse": 1.12,
          "east-concourse": 1.08,
        },
        incidentZoneIds: ["north-entry", "north-concourse"],
        incidentInputs: [
          {
            id: "incident-arrival-surge",
            type: "crowd-congestion",
            title: "Pre-kickoff arrival surge",
            zoneIds: ["north-entry", "north-concourse"],
            reportedAtMinute: 8,
            peopleAffected: 2_600,
          },
        ],
        alertInputs: [
          {
            id: "alert-arrival-surge",
            title: "Heavy arrivals at Gate A",
            message: "Use Gates B or D when directed by venue staff.",
            severity: "warning",
            zoneIds: ["north-entry", "north-concourse"],
          },
        ],
      };
    case "gate-closure":
      return {
        ...base,
        occupancyMultiplier: {
          "south-concourse": 2.05,
          "east-concourse": 1.42,
          "west-concourse": 1.5,
        },
        queueMultiplier: {
          "south-concourse": 9,
          "east-concourse": 3.1,
          "west-concourse": 2.8,
        },
        throughputMultiplier: { "south-concourse": 0.18 },
        incidentZoneIds: ["south-concourse"],
        closedEdgeIds: ["gate-c--south"],
        closedNodeIds: ["gate-c"],
        incidentInputs: [
          {
            id: "incident-gate-c-closure",
            type: "gate-closure",
            title: "Gate C closed",
            zoneIds: ["south-concourse"],
            reportedAtMinute: 11,
            peopleAffected: 4_000,
            blockingCriticalRoute: true,
          },
        ],
        alertInputs: [
          {
            id: "alert-gate-c-closure",
            title: "Gate C is closed",
            message: "Follow staff directions to Gate B or Gate D.",
            severity: "critical",
            zoneIds: ["south-concourse"],
          },
        ],
      };
    case "train-disruption":
      return {
        ...base,
        occupancyMultiplier: {
          "transport-hub": 2.15,
          "north-entry": 1.35,
        },
        queueMultiplier: { "transport-hub": 6.8, "north-entry": 2.1 },
        throughputMultiplier: { "transport-hub": 0.42 },
        incidentZoneIds: ["transport-hub"],
        incidentInputs: [
          {
            id: "incident-train-disruption",
            type: "transport-disruption",
            title: "North Stadium Rail major delay",
            zoneIds: ["transport-hub", "north-entry"],
            reportedAtMinute: 13,
            peopleAffected: 5_200,
          },
        ],
        alertInputs: [
          {
            id: "alert-train-disruption",
            title: "Rail service disrupted",
            message: "Use the south shuttle or metro where possible.",
            severity: "critical",
            zoneIds: ["transport-hub", "north-entry"],
          },
        ],
        sustainabilityOverrides: { publicTransportArrivals: 15_000 },
      };
    case "heat-alert":
      return {
        ...base,
        occupancyMultiplier: {
          "north-entry": 1.35,
          "north-concourse": 1.2,
          "south-concourse": 1.25,
        },
        queueMultiplier: {
          "north-concourse": 2.2,
          "south-concourse": 2.4,
          "west-concourse": 1.6,
        },
        throughputMultiplier: {},
        incidentZoneIds: [
          "north-entry",
          "north-concourse",
          "east-concourse",
          "south-concourse",
          "west-concourse",
        ],
        incidentInputs: [
          {
            id: "incident-heat-alert",
            type: "heat",
            title: "Severe heat protocol active",
            zoneIds: [
              "north-entry",
              "north-concourse",
              "east-concourse",
              "south-concourse",
              "west-concourse",
            ],
            reportedAtMinute: 5,
            peopleAffected: 28_000,
          },
        ],
        alertInputs: [
          {
            id: "alert-heat",
            title: "Heat alert active",
            message: "Use refill points, seek shade, and ask staff for help if unwell.",
            severity: "critical",
            zoneIds: [
              "north-entry",
              "north-concourse",
              "east-concourse",
              "south-concourse",
              "west-concourse",
            ],
          },
        ],
        sustainabilityOverrides: {
          waterRefills: 14_800,
          currentEnergyKwh: 8_100,
        },
      };
    case "medical-response":
      return {
        ...base,
        occupancyMultiplier: { "east-concourse": 1.45 },
        queueMultiplier: { "east-concourse": 3.4 },
        throughputMultiplier: { "east-concourse": 0.62 },
        incidentZoneIds: ["east-concourse"],
        closedEdgeIds: ["north--east"],
        incidentInputs: [
          {
            id: "incident-medical-east",
            type: "medical",
            title: "Medical response in East Concourse",
            zoneIds: ["east-concourse"],
            reportedAtMinute: 16,
            peopleAffected: 1,
            blockingCriticalRoute: true,
            medicalUrgency: "life-threatening",
          },
        ],
        alertInputs: [
          {
            id: "alert-medical-east",
            title: "East Concourse route restricted",
            message: "Keep the marked medical corridor clear and follow staff directions.",
            severity: "critical",
            zoneIds: ["east-concourse"],
          },
        ],
      };
    case "accessibility-obstruction":
      return {
        ...base,
        occupancyMultiplier: {
          "north-concourse": 1.28,
          "upper-north": 1.2,
        },
        queueMultiplier: { "north-concourse": 2.8, "upper-north": 2.2 },
        throughputMultiplier: { "north-concourse": 0.78 },
        incidentZoneIds: ["north-concourse", "upper-north"],
        obstructedEdgeIds: ["lift-north--upper-north"],
        incidentInputs: [
          {
            id: "incident-accessible-route",
            type: "accessibility-obstruction",
            title: "North accessible lift route obstructed",
            zoneIds: ["north-concourse", "upper-north"],
            reportedAtMinute: 7,
            peopleAffected: 900,
            blockingCriticalRoute: true,
          },
        ],
        alertInputs: [
          {
            id: "alert-accessible-route",
            title: "North lift route unavailable",
            message: "Use the signed north ramp or request accessibility assistance.",
            severity: "warning",
            zoneIds: ["north-concourse", "upper-north"],
          },
        ],
      };
    case "waste-overflow":
      return {
        ...base,
        occupancyMultiplier: { "south-concourse": 1.38 },
        queueMultiplier: { "south-concourse": 1.9 },
        throughputMultiplier: {},
        incidentZoneIds: ["south-concourse"],
        incidentInputs: [
          {
            id: "incident-waste-south",
            type: "waste-overflow",
            title: "South food-court waste overflow",
            zoneIds: ["south-concourse"],
            reportedAtMinute: 20,
            peopleAffected: 1_200,
          },
        ],
        alertInputs: [
          {
            id: "alert-waste-south",
            title: "Waste collection in progress",
            message: "Use the west concourse disposal points until the area is cleared.",
            severity: "warning",
            zoneIds: ["south-concourse"],
          },
        ],
        sustainabilityOverrides: { totalWasteKilograms: 5_650 },
      };
  }
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
  const profile = scenarioProfile(scenarioId);
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
