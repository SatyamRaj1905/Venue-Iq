import type { ScenarioId } from "./constants";
import type { IncidentInput, StadiumAlert, SustainabilityInput, ZoneId } from "./types";

export interface ScenarioProfile {
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

type ScenarioProfileFactory = () => ScenarioProfile;

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

function arrivalSurgeProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function gateClosureProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function trainDisruptionProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function heatAlertProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function medicalResponseProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function accessibilityObstructionProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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
}

function wasteOverflowProfile(): ScenarioProfile {
  return {
    ...baseProfile(),
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

const PROFILE_FACTORIES = {
  normal: baseProfile,
  "arrival-surge": arrivalSurgeProfile,
  "gate-closure": gateClosureProfile,
  "train-disruption": trainDisruptionProfile,
  "heat-alert": heatAlertProfile,
  "medical-response": medicalResponseProfile,
  "accessibility-obstruction": accessibilityObstructionProfile,
  "waste-overflow": wasteOverflowProfile,
} satisfies Readonly<Record<ScenarioId, ScenarioProfileFactory>>;

export function getScenarioProfile(scenarioId: ScenarioId): ScenarioProfile {
  return PROFILE_FACTORIES[scenarioId]();
}
