import { describe, expect, it } from "vitest";

import {
  DEFAULT_SIMULATION_SEED,
  SCENARIO_IDS,
  SCENARIO_DEFINITIONS,
  STADIUM_GRAPH,
  advanceSimulation,
  createSeededRandom,
  findRoute,
  getHighestScenarioSeverity,
  getScenarioState,
  isScenarioId,
  setSimulationPaused,
} from "@/lib/domain";

describe("seeded operations simulation", () => {
  it("defines all eight required scenarios", () => {
    expect(SCENARIO_DEFINITIONS.map((scenario) => scenario.id)).toEqual(SCENARIO_IDS);
  });

  it("constructs a deterministic state for every canonical scenario", () => {
    for (const scenarioId of SCENARIO_IDS) {
      const first = getScenarioState(scenarioId, 50);
      const second = getScenarioState(scenarioId, 50);

      expect(first.scenarioId).toBe(scenarioId);
      expect(first).toEqual(second);
    }
  });

  it("validates scenario ids", () => {
    expect(isScenarioId("heat-alert")).toBe(true);
    expect(isScenarioId("invented-emergency")).toBe(false);
  });

  it("produces the same random sequence for the same seed", () => {
    const first = createSeededRandom(2026);
    const second = createSeededRandom(2026);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("is deeply repeatable for the same scenario and seed", () => {
    const first = getScenarioState("arrival-surge", 42);
    const second = getScenarioState("arrival-surge", 42);

    expect(first).toEqual(second);
  });

  it("uses the documented deterministic default seed", () => {
    expect(getScenarioState("normal").seed).toBe(DEFAULT_SIMULATION_SEED);
  });

  it("changes simulated observations when the seed changes", () => {
    const first = getScenarioState("normal", 1);
    const second = getScenarioState("normal", 2);

    expect(first.zones.map((zone) => zone.occupancy)).not.toEqual(
      second.zones.map((zone) => zone.occupancy),
    );
  });

  it("labels every normal-operation dataset as simulated", () => {
    const state = getScenarioState("normal", 50);

    expect(state.simulated).toBe(true);
    expect(state.zones.every((zone) => zone.simulated)).toBe(true);
    expect(state.gates.every((gate) => gate.simulated)).toBe(true);
    expect(state.transport.services.every((service) => service.simulated)).toBe(true);
    expect(state.alerts.every((alert) => alert.simulated)).toBe(true);
  });

  it("keeps normal operations free of active incidents", () => {
    const state = getScenarioState("normal", 50);

    expect(state.incidents).toEqual([]);
    expect(getHighestScenarioSeverity(state)).toBe("info");
  });

  it("raises north occupancy and a crowd incident during the arrival surge", () => {
    const normal = getScenarioState("normal", 50);
    const surge = getScenarioState("arrival-surge", 50);
    const normalNorth = normal.zones.find((zone) => zone.zoneId === "north-entry");
    const surgeNorth = surge.zones.find((zone) => zone.zoneId === "north-entry");

    expect(surgeNorth?.occupancyPercentage).toBeGreaterThan(normalNorth?.occupancyPercentage ?? 0);
    expect(surge.incidents[0]).toMatchObject({
      type: "crowd-congestion",
      escalationRole: "crowd-safety-lead",
    });
  });

  it("closes Gate C and its graph edge during the gate-closure scenario", () => {
    const state = getScenarioState("gate-closure", 50);
    const gateC = state.gates.find((gate) => gate.gateNodeId === "gate-c");

    expect(state.routeConditions.closedNodeIds).toContain("gate-c");
    expect(state.routeConditions.closedEdgeIds).toContain("gate-c--south");
    expect(gateC).toMatchObject({ throughputPerHour: 0, status: "critical" });
    expect(getHighestScenarioSeverity(state)).toBe("critical");
  });

  it("marks rail as a major delay during train disruption", () => {
    const state = getScenarioState("train-disruption", 50);
    const rail = state.transport.services.find((service) => service.id === "north-stadium-rail");

    expect(state.transport.networkStatus).toBe("disrupted");
    expect(rail).toMatchObject({ status: "major-delay", delayMinutes: 28 });
  });

  it("increases water-refill use during a heat alert", () => {
    const normal = getScenarioState("normal", 50);
    const heat = getScenarioState("heat-alert", 50);

    expect(heat.sustainability.waterRefillLiters).toBeGreaterThan(
      normal.sustainability.waterRefillLiters,
    );
    expect(heat.incidents[0]).toMatchObject({
      type: "heat",
      escalationRole: "medical-command",
    });
  });

  it("creates a critical, human-approved medical response", () => {
    const state = getScenarioState("medical-response", 50);

    expect(state.incidents[0]).toMatchObject({
      severity: "critical",
      requiresHumanApproval: true,
      sopCategory: "medical-response",
    });
  });

  it("routes wheelchair users around the north lift obstruction", () => {
    const state = getScenarioState("accessibility-obstruction", 50);
    const result = findRoute(STADIUM_GRAPH, {
      originId: "gate-a",
      destinationId: "section-214",
      preferences: {
        stepFree: true,
        avoidCrowds: true,
        avoidAccessibilityObstructions: true,
      },
      conditions: state.routeConditions,
    });

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.route.edgeIds).not.toContain("lift-north--upper-north");
      expect(result.route.edgeIds).toContain("ramp-north--upper-north");
      expect(result.route.isStepFree).toBe(true);
    }
  });

  it("marks waste overflow as requiring sustainability action", () => {
    const state = getScenarioState("waste-overflow", 50);

    expect(state.sustainability.wasteBinUtilizationPercentage).toBeGreaterThan(100);
    expect(state.sustainability.status).toBe("action-required");
    expect(state.incidents[0]?.escalationRole).toBe("sustainability-lead");
  });

  it("advances ticks and deterministic timestamps when running", () => {
    const initial = getScenarioState("normal", { seed: 50, tick: 2 });
    const advanced = advanceSimulation(initial, 3);

    expect(advanced.tick).toBe(5);
    expect(advanced.lastUpdatedIso).toBe("2026-06-15T14:05:00.000Z");
    expect(advanced).toEqual(getScenarioState("normal", { seed: 50, tick: 5 }));
  });

  it("does not advance a paused simulation", () => {
    const initial = getScenarioState("normal", 50);
    const paused = setSimulationPaused(initial, true);

    expect(advanceSimulation(paused, 3)).toBe(paused);
  });
});
