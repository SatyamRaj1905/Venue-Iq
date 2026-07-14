import { describe, expect, it } from "vitest";

import {
  STADIUM_GRAPH,
  calculateWalkingTime,
  findNearbyFacilities,
  findRoute,
  getAccessibleRoute,
  getShortestRoute,
  getStadiumEdge,
  getStadiumNode,
  getZone,
  validateStadiumGraph,
} from "@/lib/domain";
import type { StadiumGraph } from "@/lib/domain";

function successfulRoute(
  result: ReturnType<typeof findRoute>,
): Extract<ReturnType<typeof findRoute>, { found: true }>["route"] {
  if (!result.found) {
    throw new Error(`Expected a route, received ${result.reason}`);
  }
  return result.route;
}

const preferenceGraph: StadiumGraph = {
  zones: [{ id: "test", name: "Test", capacity: 100, areaSquareMeters: 100, level: 0 }],
  nodes: [
    {
      id: "start",
      name: "Start",
      kind: "gate",
      zoneId: "test",
      level: 0,
      position: { x: 0, y: 0 },
      accessible: true,
      quietScore: 50,
      description: "Start",
    },
    {
      id: "noisy",
      name: "Noisy",
      kind: "concourse",
      zoneId: "test",
      level: 0,
      position: { x: 1, y: 0 },
      accessible: true,
      quietScore: 10,
      description: "Noisy path",
    },
    {
      id: "quiet",
      name: "Quiet",
      kind: "concourse",
      zoneId: "test",
      level: 0,
      position: { x: 0, y: 1 },
      accessible: true,
      quietScore: 95,
      description: "Quiet path",
    },
    {
      id: "finish",
      name: "Finish",
      kind: "section",
      zoneId: "test",
      level: 0,
      position: { x: 1, y: 1 },
      accessible: true,
      quietScore: 50,
      description: "Finish",
    },
  ],
  edges: [
    {
      id: "short-noisy-1",
      from: "start",
      to: "noisy",
      bidirectional: true,
      distanceMeters: 20,
      kind: "walkway",
      stepFree: true,
      widthMeters: 3,
      quietScore: 5,
      baselineCrowd: 0.92,
      status: "open",
      accessibilityObstructed: false,
      zoneIds: ["test"],
    },
    {
      id: "short-noisy-2",
      from: "noisy",
      to: "finish",
      bidirectional: true,
      distanceMeters: 20,
      kind: "walkway",
      stepFree: true,
      widthMeters: 3,
      quietScore: 5,
      baselineCrowd: 0.92,
      status: "open",
      accessibilityObstructed: false,
      zoneIds: ["test"],
    },
    {
      id: "long-quiet-1",
      from: "start",
      to: "quiet",
      bidirectional: true,
      distanceMeters: 35,
      kind: "accessible-path",
      stepFree: true,
      widthMeters: 5,
      quietScore: 95,
      baselineCrowd: 0.12,
      status: "open",
      accessibilityObstructed: false,
      zoneIds: ["test"],
    },
    {
      id: "long-quiet-2",
      from: "quiet",
      to: "finish",
      bidirectional: true,
      distanceMeters: 35,
      kind: "accessible-path",
      stepFree: true,
      widthMeters: 5,
      quietScore: 95,
      baselineCrowd: 0.12,
      status: "open",
      accessibilityObstructed: false,
      zoneIds: ["test"],
    },
  ],
};

const equalCostGraph: StadiumGraph = {
  ...preferenceGraph,
  edges: preferenceGraph.edges.map((edge) => ({
    ...edge,
    distanceMeters: 20,
    baselineCrowd: 0.2,
  })),
};

describe("stadium graph and routing", () => {
  it("contains only valid node, edge, and zone references", () => {
    expect(validateStadiumGraph(STADIUM_GRAPH)).toEqual({ valid: true, errors: [] });
  });

  it("looks up stadium graph entities by their stable identifiers", () => {
    expect(getStadiumNode("gate-a")?.name).toBe("Gate A");
    expect(getStadiumEdge("gate-a--north")?.from).toBe("gate-a");
    expect(getZone("north-entry")?.name).toBe("North Entry Plaza");
    expect(getStadiumNode("missing")).toBeUndefined();
  });

  it("chooses the physically shortest route by default", () => {
    const route = successfulRoute(
      findRoute(STADIUM_GRAPH, {
        originId: "gate-a",
        destinationId: "section-214",
      }),
    );

    expect(route.edgeIds).toContain("stairs-north--upper-north");
    expect(route.totalDistanceMeters).toBe(148);
  });

  it("provides the shortest-route facade with dynamic conditions", () => {
    const route = successfulRoute(
      getShortestRoute(STADIUM_GRAPH, "gate-a", "section-214", {
        closedEdgeIds: ["stairs-north--upper-north"],
      }),
    );

    expect(route.edgeIds).not.toContain("stairs-north--upper-north");
    expect(route.destinationId).toBe("section-214");
  });

  it("excludes stairs for a step-free route", () => {
    const route = successfulRoute(getAccessibleRoute(STADIUM_GRAPH, "gate-a", "section-214"));

    expect(route.isStepFree).toBe(true);
    expect(route.steps.every((step) => step.stepFree)).toBe(true);
    expect(route.edgeIds).not.toContain("stairs-north--upper-north");
  });

  it("uses crowd weighting to select a longer low-crowd path", () => {
    const shortest = successfulRoute(
      findRoute(preferenceGraph, { originId: "start", destinationId: "finish" }),
    );
    const lowCrowd = successfulRoute(
      findRoute(preferenceGraph, {
        originId: "start",
        destinationId: "finish",
        preferences: { avoidCrowds: true },
      }),
    );

    expect(shortest.nodeIds).toContain("noisy");
    expect(lowCrowd.nodeIds).toContain("quiet");
    expect(lowCrowd.totalDistanceMeters).toBeGreaterThan(shortest.totalDistanceMeters);
  });

  it("uses quiet weighting to avoid the noisy shortcut", () => {
    const route = successfulRoute(
      findRoute(preferenceGraph, {
        originId: "start",
        destinationId: "finish",
        preferences: { preferQuiet: true },
      }),
    );

    expect(route.nodeIds).toEqual(["start", "quiet", "finish"]);
  });

  it("avoids a dynamically closed path", () => {
    const route = successfulRoute(
      findRoute(STADIUM_GRAPH, {
        originId: "gate-a",
        destinationId: "section-214",
        preferences: { stepFree: true },
        conditions: { closedEdgeIds: ["lift-north--upper-north"] },
      }),
    );

    expect(route.edgeIds).not.toContain("lift-north--upper-north");
    expect(route.edgeIds).toContain("ramp-north--upper-north");
  });

  it("avoids a reported accessibility obstruction", () => {
    const route = successfulRoute(
      findRoute(STADIUM_GRAPH, {
        originId: "gate-a",
        destinationId: "section-214",
        preferences: { stepFree: true, avoidAccessibilityObstructions: true },
        conditions: { obstructedEdgeIds: ["lift-north--upper-north"] },
      }),
    );

    expect(route.edgeIds).toContain("ramp-north--upper-north");
  });

  it("preserves exact deterministic paths across routing conditions", () => {
    const cases = [
      {
        request: { originId: "gate-a", destinationId: "section-214" },
        expectedEdges: [
          "gate-a--north",
          "north--stairs-north",
          "stairs-north--upper-north",
          "upper-north--section-214",
        ],
      },
      {
        request: {
          originId: "gate-a",
          destinationId: "section-214",
          preferences: { stepFree: true },
        },
        expectedEdges: [
          "gate-a--north",
          "north--lift-north",
          "lift-north--upper-north",
          "upper-north--section-214",
        ],
      },
      {
        request: {
          originId: "gate-a",
          destinationId: "section-214",
          preferences: { stepFree: true },
          conditions: { closedEdgeIds: ["lift-north--upper-north"] },
        },
        expectedEdges: [
          "gate-a--north",
          "north--ramp-north",
          "ramp-north--upper-north",
          "upper-north--section-214",
        ],
      },
      {
        request: {
          originId: "gate-a",
          destinationId: "section-214",
          preferences: { stepFree: true, avoidAccessibilityObstructions: true },
          conditions: { obstructedEdgeIds: ["lift-north--upper-north"] },
        },
        expectedEdges: [
          "gate-a--north",
          "north--ramp-north",
          "ramp-north--upper-north",
          "upper-north--section-214",
        ],
      },
    ] as const;

    for (const routeCase of cases) {
      expect(successfulRoute(findRoute(STADIUM_GRAPH, routeCase.request)).edgeIds).toEqual(
        routeCase.expectedEdges,
      );
    }
  });

  it("uses stable node and edge tie-breaking for equal-cost paths", () => {
    const route = successfulRoute(
      findRoute(equalCostGraph, { originId: "start", destinationId: "finish" }),
    );

    expect(route.nodeIds).toEqual(["start", "quiet", "finish"]);
    expect(route.edgeIds).toEqual(["long-quiet-1", "long-quiet-2"]);
  });

  it("processes a repeated indexed routing batch deterministically", () => {
    const requests = [
      { originId: "gate-a", destinationId: "section-214" },
      { originId: "gate-d", destinationId: "section-305" },
      {
        originId: "gate-a",
        destinationId: "section-214",
        preferences: { stepFree: true, avoidCrowds: true },
      },
      {
        originId: "gate-a",
        destinationId: "section-214",
        preferences: { stepFree: true },
        conditions: { closedEdgeIds: ["lift-north--upper-north"] },
      },
      {
        originId: "gate-b",
        destinationId: "medical-east",
        conditions: { closedNodeIds: ["concourse-south"] },
      },
    ] as const;
    const expectedSignatures = requests.map((request) => {
      const result = findRoute(STADIUM_GRAPH, request);
      return result.found ? result.route.edgeIds.join("|") : result.reason;
    });
    let completedRoutes = 0;

    for (let repetition = 0; repetition < 200; repetition += 1) {
      requests.forEach((request, index) => {
        const result = findRoute(STADIUM_GRAPH, request);
        const signature = result.found ? result.route.edgeIds.join("|") : result.reason;
        expect(signature).toBe(expectedSignatures[index]);
        completedRoutes += 1;
      });
    }

    expect(completedRoutes).toBe(1_000);
  });

  it("returns a typed no-route result when every step-free ascent is unavailable", () => {
    const result = findRoute(STADIUM_GRAPH, {
      originId: "gate-a",
      destinationId: "section-214",
      preferences: { stepFree: true },
      conditions: {
        closedEdgeIds: [
          "lift-north--upper-north",
          "ramp-north--upper-north",
          "lift-west--upper-west",
        ],
      },
    });

    expect(result).toMatchObject({ found: false, reason: "no-route", simulated: true });
  });

  it("returns a typed failure for an unknown origin", () => {
    expect(
      findRoute(STADIUM_GRAPH, {
        originId: "missing",
        destinationId: "section-214",
      }),
    ).toMatchObject({ found: false, reason: "unknown-origin" });
  });

  it("estimates longer walking time in high crowd conditions", () => {
    const quietSeconds = calculateWalkingTime(130, { crowdLevel: "low" });
    const crowdedSeconds = calculateWalkingTime(130, { crowdLevel: "high" });

    expect(quietSeconds).toBe(100);
    expect(crowdedSeconds).toBeGreaterThan(quietSeconds);
  });

  it("adds lift boarding time to walking-time estimates", () => {
    expect(calculateWalkingTime(13, { pathKind: "lift", speedMetersPerSecond: 1 })).toBe(38);
  });

  it("rejects invalid walking speeds", () => {
    expect(() => calculateWalkingTime(100, { speedMetersPerSecond: 0 })).toThrow(RangeError);
  });

  it("finds accessible facilities adjacent to a route", () => {
    const facilities = findNearbyFacilities(["gate-a", "concourse-north"]);

    expect(facilities.map((facility) => facility.id)).toEqual(
      expect.arrayContaining(["assistance-gate-a", "accessible-toilet-north", "medical-north"]),
    );
    expect(facilities.every((facility) => facility.distanceFromRouteMeters <= 35)).toBe(true);
  });
});
