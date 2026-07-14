import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createFanFallback } from "@/lib/ai/fallback";
import type { FanAssistRequest, SupportedLanguage } from "@/lib/ai/schemas";
import { getAccessibleRoute } from "@/lib/ai/tools";
import {
  BASE_TRANSPORT_SERVICES,
  STADIUM_GRAPH,
  calculateEnergyConsumptionTrend,
  calculatePublicTransportUsage,
  calculateSustainabilityStatus,
  calculateTransportStatus,
  calculateWaterRefillUsage,
  replaceTransportService,
  validateStadiumGraph,
  type StadiumGraph,
} from "@/lib/domain";
import { validateJsonRequest } from "@/lib/security/requestValidation";

const languages: readonly SupportedLanguage[] = ["en", "es", "fr", "pt", "ar", "hi"];

function fanRequest(
  language: SupportedLanguage,
  scenario: FanAssistRequest["scenario"] = "normal",
) {
  return {
    message: "Find the verified step-free route.",
    language,
    currentLocation: "gate-a",
    destination: "section-214",
    preferences: {
      stepFree: true,
      avoidCrowds: true,
      preferQuiet: true,
      avoidAccessibilityObstructions: true,
    },
    scenario,
  } satisfies FanAssistRequest;
}

describe("grounded fallback edge cases", () => {
  it("builds a localized deterministic fallback in every supported language", () => {
    for (const language of languages) {
      const request = fanRequest(language);
      const grounding = getAccessibleRoute(request);
      const result = createFanFallback(request, grounding);

      expect(result.language).toBe(language);
      expect(result.route?.destinationId).toBe("section-214");
      expect(result.route?.steps.length).toBeGreaterThan(0);
      expect(result.summary.length).toBeGreaterThan(20);
    }
  });

  it("maps warning and critical simulated alerts without changing severity", () => {
    const warning = getAccessibleRoute(fanRequest("en", "arrival-surge"));
    const critical = getAccessibleRoute(fanRequest("en", "gate-closure"));

    expect(warning.alerts.some((alert) => alert.severity === "high")).toBe(true);
    expect(critical.alerts.some((alert) => alert.severity === "critical")).toBe(true);
  });

  it("does not advertise a facility whose access edge is obstructed", () => {
    const grounding = getAccessibleRoute(fanRequest("en", "accessibility-obstruction"));

    expect(grounding.route?.nearbyFacilities.map((facility) => facility.id)).not.toContain(
      "lift-north",
    );
  });

  it("returns an explicit unavailable grounding for an unknown origin", () => {
    const request = { ...fanRequest("en"), currentLocation: "unknown-gate" };
    const grounding = getAccessibleRoute(request);

    expect(grounding.route).toBeUndefined();
    expect(grounding.unavailableReason).toContain("Unknown origin");
  });
});

describe("graph and transport edge cases", () => {
  it("reports every invalid graph relationship without throwing", () => {
    const node = STADIUM_GRAPH.nodes[0];
    const edge = STADIUM_GRAPH.edges[0];
    expect(node).toBeDefined();
    expect(edge).toBeDefined();
    if (node === undefined || edge === undefined) {
      return;
    }

    const invalidGraph: StadiumGraph = {
      zones: [],
      nodes: [node, node],
      edges: [
        { ...edge, from: "missing-node", distanceMeters: 0, zoneIds: ["missing-zone"] },
        { ...edge },
      ],
    };
    const report = validateStadiumGraph(invalidGraph);

    expect(report.valid).toBe(false);
    expect(report.errors.some((error) => error.includes("Duplicate node"))).toBe(true);
    expect(report.errors.some((error) => error.includes("Duplicate edge"))).toBe(true);
    expect(report.errors.some((error) => error.includes("unknown node"))).toBe(true);
    expect(report.errors.some((error) => error.includes("positive distance"))).toBe(true);
    expect(report.errors.some((error) => error.includes("unknown zone"))).toBe(true);
  });

  it("handles an empty transport network and both replacement branches", () => {
    expect(calculateTransportStatus([])).toMatchObject({
      networkStatus: "normal",
      averageDelayMinutes: 0,
      accessibleServiceCount: 0,
    });

    const existing = BASE_TRANSPORT_SERVICES[0];
    expect(existing).toBeDefined();
    if (existing === undefined) {
      return;
    }
    const changed = { ...existing, delayMinutes: 7, status: "minor-delay" as const };
    const replaced = replaceTransportService(BASE_TRANSPORT_SERVICES, changed);
    expect(replaced.find((service) => service.id === changed.id)?.delayMinutes).toBe(7);

    const added = replaceTransportService([], changed);
    expect(added).toEqual([changed]);
  });
});

describe("sustainability validation branches", () => {
  it("handles zero arrivals and all energy trend bands", () => {
    expect(calculatePublicTransportUsage(0, 0)).toBe(0);
    expect(calculateEnergyConsumptionTrend(1_000, 1_000).trend).toBe("stable");
    expect(calculateEnergyConsumptionTrend(1_050, 1_000).trend).toBe("increasing");
  });

  it("rejects impossible or non-positive sustainability inputs", () => {
    expect(() => calculatePublicTransportUsage(-1, 10)).toThrow(RangeError);
    expect(() => calculatePublicTransportUsage(11, 10)).toThrow(RangeError);
    expect(() => calculateWaterRefillUsage(1, 0)).toThrow(RangeError);
  });

  it("classifies watch and on-track sustainability states", () => {
    expect(
      calculateSustainabilityStatus({
        publicTransportUsagePercentage: 45,
        wasteBinUtilizationPercentage: 60,
        energyChangePercentage: 0,
      }),
    ).toBe("watch");
    expect(
      calculateSustainabilityStatus({
        publicTransportUsagePercentage: 70,
        wasteBinUtilizationPercentage: 40,
        energyChangePercentage: -4,
      }),
    ).toBe("on-track");
  });
});

describe("request transport edge cases", () => {
  const schema = z.object({ message: z.string() }).strict();

  it("rejects missing content type and non-numeric content length", async () => {
    const missing = new Request("https://venue.example/api", { method: "POST", body: "{}" });
    const malformedLength = new Request("https://venue.example/api", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "not-a-number" },
      body: "{}",
    });

    await expect(validateJsonRequest(missing, schema)).resolves.toMatchObject({
      code: "INVALID_CONTENT_TYPE",
    });
    await expect(validateJsonRequest(malformedLength, schema)).resolves.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  it("measures the actual UTF-8 body and omits empty root issue paths", async () => {
    const oversized = new Request("https://venue.example/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"message":"ééé"}',
    });
    await expect(validateJsonRequest(oversized, schema, 8)).resolves.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });

    const rootSchema = schema.refine(() => false, "Rejected at root");
    const rootFailure = new Request("https://venue.example/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"message":"ok"}',
    });
    await expect(validateJsonRequest(rootFailure, rootSchema)).resolves.toEqual({
      ok: false,
      code: "INVALID_REQUEST",
    });
  });
});
