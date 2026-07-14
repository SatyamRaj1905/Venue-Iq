import {
  Accessibility,
  CircleAlert,
  CloudSun,
  DoorClosed,
  HeartPulse,
  Sparkles,
  TrainFront,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type ScenarioId =
  | "normal"
  | "arrival-surge"
  | "gate-closure"
  | "train-disruption"
  | "heat-alert"
  | "medical-response"
  | "accessibility-obstruction"
  | "waste-overflow";

export interface ScenarioOption {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const scenarioOptions: ScenarioOption[] = [
  {
    id: "normal",
    label: "Normal operations",
    shortLabel: "Normal",
    description: "Balanced arrival flow and all venue systems available.",
    icon: Sparkles,
  },
  {
    id: "arrival-surge",
    label: "Pre-kickoff arrival surge",
    shortLabel: "Arrival surge",
    description: "High inbound demand across the north and east approaches.",
    icon: CircleAlert,
  },
  {
    id: "gate-closure",
    label: "Gate C closure",
    shortLabel: "Gate closure",
    description: "Gate C is unavailable and arrivals need redistribution.",
    icon: DoorClosed,
  },
  {
    id: "train-disruption",
    label: "Train disruption",
    shortLabel: "Train delay",
    description: "A delayed service creates an uneven late-arrival wave.",
    icon: TrainFront,
  },
  {
    id: "heat-alert",
    label: "Heat alert",
    shortLabel: "Heat alert",
    description: "Elevated temperature increases welfare and refill demand.",
    icon: CloudSun,
  },
  {
    id: "medical-response",
    label: "Medical response",
    shortLabel: "Medical",
    description: "A medical incident needs a protected response corridor.",
    icon: HeartPulse,
  },
  {
    id: "accessibility-obstruction",
    label: "Accessible-path obstruction",
    shortLabel: "Path blocked",
    description: "The west lift route is temporarily unavailable.",
    icon: Accessibility,
  },
  {
    id: "waste-overflow",
    label: "Waste-bin overflow",
    shortLabel: "Waste overflow",
    description: "South concourse capacity has reached its safe threshold.",
    icon: Trash2,
  },
];
