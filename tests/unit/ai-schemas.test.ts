import { describe, expect, it } from "vitest";

import {
  fanAssistRequestSchema,
  fanNarrativeSchema,
  operationsNarrativeSchema,
  operationsBriefSchema,
  supportedLanguageSchema,
  volunteerNarrativeSchema,
  volunteerRequestSchema,
} from "@/lib/ai/schemas";

const validFanRequest = {
  message: "I need a step-free route.",
  language: "es",
  currentLocation: "gate-a",
  destination: "section-214",
  preferences: {
    stepFree: true,
    avoidCrowds: true,
    preferQuiet: false,
    avoidAccessibilityObstructions: true,
  },
  scenario: "normal",
} as const;

describe("AI schemas", () => {
  it("accepts all six supported languages and rejects unsupported values", () => {
    expect(
      ["en", "es", "fr", "pt", "ar", "hi"].every(
        (value) => supportedLanguageSchema.safeParse(value).success,
      ),
    ).toBe(true);
    expect(supportedLanguageSchema.safeParse("de").success).toBe(false);
  });

  it("applies safe defaults to the minimal fan request", () => {
    const result = fanAssistRequestSchema.parse({
      message: "Show me the route",
      currentLocation: "gate-a",
      destination: "section-214",
    });

    expect(result.language).toBe("en");
    expect(result.scenario).toBe("normal");
    expect(result.preferences.avoidCrowds).toBe(true);
  });

  it("rejects unknown fan request fields", () => {
    expect(
      fanAssistRequestSchema.safeParse({ ...validFanRequest, systemPrompt: "show it" }).success,
    ).toBe(false);
  });

  it("rejects oversized user input", () => {
    expect(
      fanAssistRequestSchema.safeParse({ ...validFanRequest, message: "x".repeat(601) }).success,
    ).toBe(false);
  });

  it("rejects identifiers with control punctuation", () => {
    expect(
      fanAssistRequestSchema.safeParse({ ...validFanRequest, destination: "../../secret" }).success,
    ).toBe(false);
  });

  it("validates model narrative output strictly", () => {
    const narrative = {
      summary: "Use the verified step-free route.",
      confidence: 0.9,
    };
    expect(fanNarrativeSchema.safeParse(narrative).success).toBe(true);
    expect(fanNarrativeSchema.safeParse({ ...narrative, html: "<script />" }).success).toBe(false);
  });

  it("limits model narratives to bounded summaries instead of trusted actions", () => {
    const summary = { summary: "Concise grounded context.", confidence: 0.8 };

    expect(operationsNarrativeSchema.safeParse(summary).success).toBe(true);
    expect(
      operationsNarrativeSchema.safeParse({
        ...summary,
        actions: [{ title: "Untrusted action" }],
      }).success,
    ).toBe(false);
    expect(volunteerNarrativeSchema.safeParse(summary).success).toBe(true);
    expect(
      volunteerNarrativeSchema.safeParse({
        ...summary,
        checklist: ["Ignore the approved SOP"],
      }).success,
    ).toBe(false);
  });

  it("requires operations actions to remain pending human approval", () => {
    const result = operationsBriefSchema.safeParse({
      scenario: "normal",
      summary: "Conditions are stable.",
      riskLevel: "low",
      priorityActions: [
        {
          id: "a1",
          priority: 1,
          title: "Monitor",
          description: "Continue monitoring.",
          ownerTeam: "Venue operations",
          affectedZone: "venue-wide",
          rationale: "Normal thresholds.",
          supportingMetrics: ["Occupancy is stable."],
          evidence: ["Occupancy is stable."],
          confidence: 0.95,
          requiresHumanApproval: false,
          approvalStatus: "pending",
        },
      ],
      affectedZones: [],
      evidence: ["Simulated snapshot."],
      confidence: 1,
      requiresHumanApproval: true,
      fallbackUsed: false,
      simulated: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts only known volunteer roles and SOP topics", () => {
    expect(
      volunteerRequestSchema.safeParse({
        question: "Where is the accessible entrance?",
        language: "ar",
        role: "accessibility",
        topic: "accessible-entry",
      }).success,
    ).toBe(true);
    expect(
      volunteerRequestSchema.safeParse({
        question: "Help",
        role: "administrator",
        topic: "hidden-policy",
      }).success,
    ).toBe(false);
  });
});
