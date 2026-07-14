import { describe, expect, it } from "vitest";

import { createFanFallback } from "@/lib/ai/fallback";
import { applyFanRequestPolicy, inferFanIntent } from "@/lib/ai/intent";
import type { FanAssistRequest } from "@/lib/ai/schemas";
import { getAccessibleRoute } from "@/lib/ai/tools";
import { createFanFallback as createClientFanFallback } from "@/lib/content/fanFallback";

function request(message: string): FanAssistRequest {
  return {
    message,
    language: "en",
    currentLocation: "gate-a",
    destination: "section-214",
    preferences: {
      stepFree: false,
      avoidCrowds: false,
      preferQuiet: false,
      avoidAccessibilityObstructions: false,
    },
    scenario: "normal",
  };
}

describe("deterministic fan intent and tool policy", () => {
  it.each([
    ["I use a wheelchair and need the safest route", "accessibility"],
    ["Where is the nearest accessible toilet?", "facility"],
    ["Which train or shuttle should I use?", "transport"],
    ["Give me directions to Section 214", "navigation"],
    ["What can you help with?", "general"],
  ] as const)("classifies %s as %s", (message, expected) => {
    expect(inferFanIntent(message)).toBe(expected);
  });

  it("enforces step-free obstruction avoidance for a wheelchair statement", () => {
    const input = request("I use a wheelchair and need the safest low-crowd route.");
    const policy = applyFanRequestPolicy(input);
    const grounding = getAccessibleRoute(input);

    expect(policy.request.preferences).toMatchObject({
      stepFree: true,
      avoidCrowds: true,
      avoidAccessibilityObstructions: true,
    });
    expect(grounding.intent).toBe("accessibility");
    expect(grounding.route?.stepFree).toBe(true);
    expect(grounding.route?.steps.map((step) => step.instruction).join(" ")).not.toContain(
      "stairs",
    );
  });

  it("grounds transport intent in ranked deterministic transport data", () => {
    const input = request("I use a wheelchair. Which train or shuttle should I use?");
    const grounding = getAccessibleRoute(input);
    const fallback = createFanFallback(input, grounding);
    const clientFallback = createClientFanFallback(input);

    expect(grounding.selectedTool).toBe("getTransportOptions");
    expect(grounding.transportOptions?.length).toBeGreaterThan(0);
    expect(grounding.transportOptions?.every((option) => option.accessible)).toBe(true);
    expect(fallback.intent).toBe("transport");
    expect(fallback.transportOptions).toEqual(grounding.transportOptions);
    expect(fallback.summary).toContain(grounding.transportOptions?.[0]?.name);
    expect(clientFallback).toEqual(fallback);
    expect(clientFallback.transportOptions?.every((option) => option.accessible)).toBe(true);
  });

  it("filters facility grounding to the requested accessible facility kind", () => {
    const input = {
      ...request("Where is the nearest accessible toilet?"),
      language: "es" as const,
    };
    const grounding = getAccessibleRoute(input);
    const fallback = createFanFallback(input, grounding);
    const clientFallback = createClientFanFallback(input);

    expect(grounding.selectedTool).toBe("getNearbyFacilities");
    expect(grounding.route?.nearbyFacilities).toEqual([
      expect.objectContaining({ id: "accessible-toilet-north", accessible: true }),
    ]);
    expect(fallback.intent).toBe("facility");
    expect(fallback.summary).toContain("North Accessible Toilet");
    expect(clientFallback).toEqual(fallback);
    expect(clientFallback.route?.nearbyFacilities).toContainEqual(
      expect.objectContaining({ id: "accessible-toilet-north", accessible: true }),
    );
  });
});
