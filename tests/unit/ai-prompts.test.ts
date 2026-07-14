import { describe, expect, it } from "vitest";

import { buildFanPrompt, buildOperationsPrompt, buildVolunteerPrompt } from "@/lib/ai/prompts";
import type { FanAssistRequest, OperationsBriefRequest, VolunteerRequest } from "@/lib/ai/schemas";
import type { FanGrounding, OperationsGrounding, VolunteerGrounding } from "@/lib/ai/tools";

const fanRequest: FanAssistRequest = {
  message: "Find a safe route.",
  language: "en",
  currentLocation: "gate-a",
  destination: "section-214",
  preferences: {
    stepFree: true,
    avoidCrowds: true,
    preferQuiet: false,
    avoidAccessibilityObstructions: true,
  },
  scenario: "normal",
};

const fanGrounding: FanGrounding = {
  intent: "navigation",
  selectedTool: "getAccessibleRoute",
  route: {
    originId: "gate-a",
    destinationId: "section-214",
    totalDistanceMeters: 180,
    estimatedWalkingMinutes: 4,
    stepFree: true,
    crowdLevel: "low",
    steps: [
      {
        id: "edge-1",
        instruction: "DO_NOT_SEND_ROUTE_STEP",
        distanceMeters: 180,
        estimatedMinutes: 4,
        crowdLevel: "low",
        accessibilityNotes: [],
      },
    ],
    nearbyFacilities: [],
  },
  routeExplanations: ["Every segment is step-free."],
  alerts: [],
};

const operationsRequest: OperationsBriefRequest = {
  scenario: "arrival-surge",
  language: "en",
};

const operationsGrounding: OperationsGrounding = {
  scenario: "arrival-surge",
  riskLevel: "high",
  affectedZones: ["north-entry"],
  evidence: ["Queue demand is elevated."],
  recommendedActions: [
    {
      title: "Review staffing",
      description: "Review the gate staffing plan.",
      ownerTeam: "Venue operations",
      rationale: "Demand is elevated.",
    },
  ],
  snapshot: {
    seed: 2_026,
    tick: 0,
    occupancyPercentage: 72,
    zones: [{ id: "DO_NOT_SEND_SNAPSHOT", occupancyPercentage: 80, status: "busy" }],
    gates: [],
    transport: "normal",
    incidents: [],
    sustainabilityStatus: "on-track",
  },
};

const volunteerRequest: VolunteerRequest = {
  question: "Where should I direct this guest?",
  language: "en",
  role: "wayfinding",
  topic: "accessible-entry",
  scenario: "normal",
};

const volunteerGrounding: VolunteerGrounding = {
  sop: {
    title: "Accessible entrance assistance",
    steps: ["Use only the approved route."],
    escalationRequired: false,
    escalationReason: "Escalate when the approved route is blocked.",
    contactRole: "Accessibility host",
    authorityBoundary: "Do not improvise a diversion.",
  },
  localizedFallback: {
    summary: "DO_NOT_SEND_LOCALIZED_FALLBACK",
    checklist: [],
    escalation: "Escalate.",
    contactRole: "Accessibility host",
  },
  scenarioContext: { scenario: "normal", alerts: [] },
};

describe("AI prompt budgets", () => {
  it("sends only facts needed to generate the narrative fields", () => {
    const prompts = [
      buildFanPrompt(fanRequest, fanGrounding),
      buildOperationsPrompt(operationsRequest, operationsGrounding),
      buildVolunteerPrompt(volunteerRequest, volunteerGrounding),
    ];

    expect(prompts[0]).not.toContain("DO_NOT_SEND_ROUTE_STEP");
    expect(prompts[1]).not.toContain("DO_NOT_SEND_SNAPSHOT");
    expect(prompts[2]).not.toContain("DO_NOT_SEND_LOCALIZED_FALLBACK");
    expect(prompts.every((prompt) => new TextEncoder().encode(prompt).byteLength < 4_000)).toBe(
      true,
    );
  });
});
