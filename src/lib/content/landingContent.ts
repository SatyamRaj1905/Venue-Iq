import {
  Accessibility,
  BadgeCheck,
  BusFront,
  Earth,
  Languages,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface CapabilityContent {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface RoleContent extends CapabilityContent {
  href: string;
  eyebrow: string;
  linkLabel: string;
}

export interface ImpactMetricContent {
  value: string;
  label: string;
  detail: string;
}

export const capabilities: CapabilityContent[] = [
  {
    title: "Grounded navigation",
    description:
      "Step-free and lower-crowd routes come from a trusted stadium graph, never model guesswork.",
    icon: MapPinned,
  },
  {
    title: "Crowd intelligence",
    description:
      "Seeded live scenarios turn venue signals into clear, evidence-backed operational priorities.",
    icon: RadioTower,
  },
  {
    title: "Inclusive by design",
    description:
      "Accessible routes, six languages, RTL support and low-stimulation preferences are built in.",
    icon: Accessibility,
  },
  {
    title: "Human-led decisions",
    description:
      "AI explains and recommends. Venue teams approve every operational or emergency action.",
    icon: ShieldCheck,
  },
  {
    title: "Transport context",
    description:
      "Travel disruption and pickup-point guidance stay connected to the stadium-day picture.",
    icon: BusFront,
  },
  {
    title: "Sustainable flow",
    description:
      "Refill, waste and transport indicators make lower-impact choices visible in the moment.",
    icon: Earth,
  },
];

export const roles: RoleContent[] = [
  {
    eyebrow: "For every guest",
    title: "Fan Companion",
    description: "Find a clear route, avoid busy areas and get assistance in your language.",
    href: "/fan",
    linkLabel: "Open Fan Companion",
    icon: MapPinned,
  },
  {
    eyebrow: "For venue teams",
    title: "Operations Center",
    description:
      "Simulate pressure, read the stadium and review grounded recommendations together.",
    href: "/operations",
    linkLabel: "Open Operations Center",
    icon: UsersRound,
  },
  {
    eyebrow: "For the front line",
    title: "Volunteer Assistant",
    description: "Turn trusted venue procedures into concise, multilingual, role-aware checklists.",
    href: "/volunteer",
    linkLabel: "Open Volunteer Assistant",
    icon: Languages,
  },
];

export const impactMetrics: ImpactMetricContent[] = [
  { value: "6", label: "supported languages", detail: "Including Arabic RTL guidance" },
  { value: "100%", label: "human-approved actions", detail: "No autonomous safety decisions" },
  { value: "8", label: "seeded scenarios", detail: "Repeatable, judge-ready simulation" },
  { value: "24/7", label: "deterministic fallback", detail: "Core guidance remains available" },
];

export const responsiblePrinciples: CapabilityContent[] = [
  {
    title: "Trusted facts first",
    description:
      "Routes, occupancy, incidents and sustainability figures are calculated in typed tools.",
    icon: BadgeCheck,
  },
  {
    title: "AI with a narrow job",
    description:
      "Gemini interprets intent, translates trusted content and turns evidence into plain language.",
    icon: Sparkles,
  },
  {
    title: "Safe when AI is unavailable",
    description:
      "Validated fixtures and deterministic guidance keep the demonstration useful without a model.",
    icon: ShieldCheck,
  },
];
