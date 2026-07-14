import type { ScenarioId } from "@/lib/domain/constants";

export type { ScenarioId } from "@/lib/domain/constants";

export interface ScenarioOption {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  description: string;
}

export const scenarioOptions: readonly ScenarioOption[] = [
  {
    id: "normal",
    label: "Normal operations",
    shortLabel: "Normal",
    description: "Balanced arrival flow and all venue systems available.",
  },
  {
    id: "arrival-surge",
    label: "Pre-kickoff arrival surge",
    shortLabel: "Arrival surge",
    description: "High inbound demand across the north and east approaches.",
  },
  {
    id: "gate-closure",
    label: "Gate C closure",
    shortLabel: "Gate closure",
    description: "Gate C is unavailable and arrivals need redistribution.",
  },
  {
    id: "train-disruption",
    label: "Train disruption",
    shortLabel: "Train delay",
    description: "A delayed service creates an uneven late-arrival wave.",
  },
  {
    id: "heat-alert",
    label: "Heat alert",
    shortLabel: "Heat alert",
    description: "Elevated temperature increases welfare and refill demand.",
  },
  {
    id: "medical-response",
    label: "Medical response",
    shortLabel: "Medical",
    description: "A medical incident needs a protected response corridor.",
  },
  {
    id: "accessibility-obstruction",
    label: "Accessible-path obstruction",
    shortLabel: "Path blocked",
    description: "The north lift route is unavailable; the ramp remains open.",
  },
  {
    id: "waste-overflow",
    label: "Waste-bin overflow",
    shortLabel: "Waste overflow",
    description: "South concourse capacity has reached its safe threshold.",
  },
];
