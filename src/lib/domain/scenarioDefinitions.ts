import { SCENARIO_IDS, type ScenarioId } from "./constants";
import type { ScenarioDefinition } from "./types";

const DEFINITIONS_BY_ID = {
  normal: {
    id: "normal",
    name: "Normal operations",
    description: "Expected match-day flows with no active disruption.",
    affectedZoneIds: [],
  },
  "arrival-surge": {
    id: "arrival-surge",
    name: "Pre-kickoff arrival surge",
    description: "A concentrated wave of fans reaches the north and east gates.",
    affectedZoneIds: ["north-entry", "north-concourse", "east-concourse"],
  },
  "gate-closure": {
    id: "gate-closure",
    name: "Gate C closure",
    description: "Gate C is closed and arrivals must be redirected.",
    affectedZoneIds: ["south-concourse", "east-concourse", "west-concourse"],
  },
  "train-disruption": {
    id: "train-disruption",
    name: "Train disruption",
    description: "North Stadium Rail has a major delay and crowding is building.",
    affectedZoneIds: ["transport-hub", "north-entry"],
  },
  "heat-alert": {
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
  "medical-response": {
    id: "medical-response",
    name: "Medical response",
    description: "A medical incident requires a protected access corridor.",
    affectedZoneIds: ["east-concourse"],
  },
  "accessibility-obstruction": {
    id: "accessibility-obstruction",
    name: "Accessible-path obstruction",
    description: "The north lift route is unavailable; the ramp remains open.",
    affectedZoneIds: ["north-concourse", "upper-north"],
  },
  "waste-overflow": {
    id: "waste-overflow",
    name: "Waste-bin overflow",
    description: "Waste capacity is exceeded around the south food court.",
    affectedZoneIds: ["south-concourse"],
  },
} as const satisfies Readonly<Record<ScenarioId, ScenarioDefinition>>;

export const SCENARIO_DEFINITIONS: readonly ScenarioDefinition[] = SCENARIO_IDS.map(
  (scenarioId) => DEFINITIONS_BY_ID[scenarioId],
);

/** Concise alias used by scenario controls. */
export const SCENARIOS = SCENARIO_DEFINITIONS;

export function getScenarioDefinition(scenarioId: ScenarioId): ScenarioDefinition {
  const definition = SCENARIO_DEFINITIONS.find((candidate) => candidate.id === scenarioId);
  if (definition === undefined) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }
  return definition;
}
