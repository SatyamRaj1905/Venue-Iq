import {
  Accessibility,
  BotOff,
  BusFront,
  Languages,
  Leaf,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface ImpactArea {
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: LucideIcon;
}

export const impactAreas: ImpactArea[] = [
  {
    title: "Navigation",
    description: "Routes adapt to access needs, crowd conditions and path availability.",
    metric: "3",
    metricLabel: "route preferences",
    icon: MapPinned,
  },
  {
    title: "Crowd distribution",
    description: "Teams see zone pressure and evidence before considering redistribution.",
    metric: "8",
    metricLabel: "monitored zones",
    icon: UsersRound,
  },
  {
    title: "Accessibility",
    description: "Step-free routing, assistance points and equivalent map lists share one flow.",
    metric: "100%",
    metricLabel: "routes explained",
    icon: Accessibility,
  },
  {
    title: "Multilingual support",
    description: "Trusted guidance can be communicated in six fan-facing languages.",
    metric: "6",
    metricLabel: "languages + RTL",
    icon: Languages,
  },
  {
    title: "Transportation",
    description: "Network delay and accessible-service context reaches venue operations.",
    metric: "Live",
    metricLabel: "arrival context",
    icon: BusFront,
  },
  {
    title: "Volunteer effectiveness",
    description: "Role-aware SOP checklists reduce hesitation without expanding authority.",
    metric: "1",
    metricLabel: "clear handoff",
    icon: Sparkles,
  },
  {
    title: "Sustainability",
    description: "Refill, waste, transport and energy signals make intervention points visible.",
    metric: "4",
    metricLabel: "resource signals",
    icon: Leaf,
  },
  {
    title: "Decision-making",
    description: "Every suggested action shows evidence, ownership and approval status.",
    metric: "0",
    metricLabel: "autonomous actions",
    icon: RadioTower,
  },
];

export const responsibilityCards = [
  {
    title: "Grounded by design",
    description: "Routes and operational metrics come only from deterministic typed functions.",
    icon: ShieldCheck,
  },
  {
    title: "Human in the loop",
    description: "AI recommendations remain pending until accountable venue personnel review them.",
    icon: RadioTower,
  },
  {
    title: "Failure is a state",
    description:
      "Model, network and rate-limit failures surface clearly with a safe deterministic fallback.",
    icon: BotOff,
  },
  {
    title: "Data minimization",
    description: "No unnecessary personal profile or conversation history is required or stored.",
    icon: Accessibility,
  },
];
