import { describe, expect, it } from "vitest";

import {
  createFanFallback,
  createOperationsFallback,
  createVolunteerFallback,
} from "@/lib/ai/fallback";
import type { FanAssistRequest, OperationsBriefRequest, VolunteerRequest } from "@/lib/ai/schemas";
import { getOperationsSnapshot, getVenueSop } from "@/lib/ai/tools";
import type { FanGrounding, OperationsGrounding } from "@/lib/ai/tools";
import { createVolunteerFallback as createClientVolunteerFallback } from "@/lib/content/volunteerFallback";

const fanRequest: FanAssistRequest = {
  message: "Necesito una ruta accesible",
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
};

const fanGrounding: FanGrounding = {
  intent: "accessibility",
  selectedTool: "getAccessibleRoute",
  route: {
    originId: "gate-a",
    destinationId: "section-214",
    totalDistanceMeters: 300,
    estimatedWalkingMinutes: 5,
    stepFree: true,
    crowdLevel: "low",
    steps: [
      {
        id: "edge-1",
        instruction: "Use the ramp.",
        distanceMeters: 300,
        estimatedMinutes: 5,
        crowdLevel: "low",
        accessibilityNotes: ["Step-free"],
      },
    ],
    nearbyFacilities: [],
  },
  routeExplanations: ["This route is step-free."],
  alerts: [],
};

describe("deterministic AI fallback", () => {
  it("returns a grounded Spanish route without changing route values", () => {
    const result = createFanFallback(fanRequest, fanGrounding);
    expect(result.summary).toContain("5 minutos");
    expect(result.route?.totalDistanceMeters).toBe(300);
    expect(result.route?.stepFree).toBe(true);
    expect(result.fallbackUsed).toBe(true);
  });

  it("requires a human handoff when no verified route exists", () => {
    const result = createFanFallback(fanRequest, {
      intent: "accessibility",
      selectedTool: "getAccessibleRoute",
      routeExplanations: [],
      alerts: [],
      unavailableReason: "No route",
    });
    expect(result.route).toBeUndefined();
    expect(result.handoffRequired).toBe(true);
    expect(result.confidence).toBeLessThan(0.6);
  });

  it("keeps every operations recommendation pending human approval", () => {
    const request: OperationsBriefRequest = { scenario: "gate-closure", language: "en" };
    const grounding: OperationsGrounding = {
      scenario: "gate-closure",
      riskLevel: "high",
      affectedZones: ["east"],
      evidence: ["Gate C is closed."],
      recommendedActions: [
        {
          title: "Review diversion",
          description: "Review the signed diversion.",
          ownerTeam: "Venue operations",
          rationale: "The gate is closed.",
        },
      ],
      snapshot: {
        seed: 2_026,
        tick: 0,
        occupancyPercentage: 70,
        zones: [],
        gates: [],
        transport: "normal",
        incidents: [],
        sustainabilityStatus: "on-track",
      },
    };
    const result = createOperationsFallback(request, grounding);
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.priorityActions.every((action) => action.requiresHumanApproval)).toBe(true);
    expect(result.priorityActions.every((action) => action.approvalStatus === "pending")).toBe(
      true,
    );
    expect(result.priorityActions[0]).toMatchObject({
      affectedZone: "east",
      confidence: 0.95,
    });
    expect(result.priorityActions[0]?.supportingMetrics.length).toBeGreaterThan(0);
  });

  it("grounds operations guidance in the client-visible simulation coordinates", () => {
    const request: OperationsBriefRequest = {
      scenario: "arrival-surge",
      language: "en",
      seed: 4_204,
      tick: 7,
    };
    const first = getOperationsSnapshot(request);
    const repeated = getOperationsSnapshot(request);

    expect(first.snapshot).toMatchObject({ seed: 4_204, tick: 7 });
    expect(repeated.snapshot).toEqual(first.snapshot);
  });

  it("uses trusted SOP escalation and authority boundaries", () => {
    const request: VolunteerRequest = {
      question: "Someone needs medical help",
      language: "en",
      role: "guest-services",
      topic: "medical",
      scenario: "normal",
    };
    const grounding = getVenueSop(request);
    const result = createVolunteerFallback(request, grounding);
    expect(result.escalationRequired).toBe(true);
    expect(result.contactRole).toBe("Medical command");
    expect(result.checklist.join(" ")).toContain("medical command");
    expect(result.checklist.join(" ")).not.toContain("Gate B");
    expect(result.authorityBoundary).toContain("Do not improvise");
  });

  it.each([
    ["lost-person", "Guest-services supervisor"],
    ["medical", "Medical command"],
    ["transport", "Transport liaison"],
    ["crowd", "Crowd safety lead"],
  ] as const)("keeps the %s fallback tied to its trusted SOP", (topic, contactRole) => {
    const request: VolunteerRequest = {
      question: "What should I do?",
      language: "ar",
      role: "guest-services",
      topic,
      scenario: "normal",
    };

    const result = createVolunteerFallback(request, getVenueSop(request));
    const clientResult = createClientVolunteerFallback(request.language, request.topic);

    expect(result.contactRole).toBe(contactRole);
    expect(result.checklist.join(" ")).not.toContain("Gate B");
    expect(clientResult.contactRole).toBe(contactRole);
  });

  it("changes accessible-entry guidance when the shared route is obstructed", () => {
    const request: VolunteerRequest = {
      question: "Where is the accessible entrance?",
      language: "ar",
      role: "accessibility",
      topic: "accessible-entry",
      scenario: "accessibility-obstruction",
    };

    const result = createVolunteerFallback(request, getVenueSop(request));
    const clientResult = createClientVolunteerFallback(
      request.language,
      request.topic,
      request.scenario,
    );

    expect(result.escalationRequired).toBe(true);
    expect(result.contactRole).toContain("غرفة التحكم");
    expect(result.summary).toContain("المحاكاة المشتركة");
    expect(clientResult.summary).toContain("المحاكاة المشتركة");
  });
});
