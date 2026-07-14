import { describe, expect, it } from "vitest";

import {
  findNearbyFacilities,
  getStadiumEdge,
  getStadiumNode,
  getZone,
} from "@/lib/domain/stadiumGraph";
import type { StadiumEdge, StadiumGraph, StadiumNode, StadiumZone } from "@/lib/domain/types";

const zone: StadiumZone = {
  id: "test-zone",
  name: "Test Zone",
  capacity: 1_000,
  areaSquareMeters: 800,
  level: 0,
};

function node(
  id: string,
  name: string,
  kind: StadiumNode["kind"],
  x: number,
  y: number,
): StadiumNode {
  return {
    id,
    name,
    kind,
    zoneId: zone.id,
    level: 0,
    position: { x, y },
    accessible: true,
    quietScore: 70,
    description: name,
  };
}

function edge(id: string, from: string, to: string, distanceMeters: number): StadiumEdge {
  return {
    id,
    from,
    to,
    bidirectional: true,
    distanceMeters,
    kind: "accessible-path",
    stepFree: true,
    widthMeters: 4,
    quietScore: 70,
    baselineCrowd: 0.2,
    status: "open",
    accessibilityObstructed: false,
    zoneIds: [zone.id],
  };
}

const routeNode = node("route", "Route", "concourse", 0, 0);
const alphaMedical = node("medical-alpha", "Alpha Medical", "medical", 50, 50);
const betaMedical = node("medical-beta", "Beta Medical", "medical", 60, 60);
const water = node("water", "Water", "water-refill", 3, 4);
const lift = node("lift", "Route Lift", "lift", 10, 0);
const alphaEdge = edge("route--medical-alpha", routeNode.id, alphaMedical.id, 12);
const betaEdge = edge("route--medical-beta", routeNode.id, betaMedical.id, 12);

const queryGraph: StadiumGraph = {
  nodes: [routeNode, betaMedical, water, alphaMedical, lift],
  edges: [betaEdge, alphaEdge],
  zones: [zone],
};

function countedArray<T>(values: readonly T[], onIteration: () => void): readonly T[] {
  return new Proxy([...values], {
    get(target, property, receiver) {
      if (property === Symbol.iterator) {
        onIteration();
      }
      return Reflect.get(target, property, receiver) as unknown;
    },
  });
}

describe("stadium graph query index", () => {
  it("supports indexed entity lookup on a custom graph", () => {
    expect(getStadiumNode(alphaMedical.id, queryGraph)).toBe(alphaMedical);
    expect(getStadiumEdge(alphaEdge.id, queryGraph)).toBe(alphaEdge);
    expect(getZone(zone.id, queryGraph)).toBe(zone);
    expect(getStadiumNode("missing", queryGraph)).toBeUndefined();
    expect(getStadiumEdge("missing", queryGraph)).toBeUndefined();
    expect(getZone("missing", queryGraph)).toBeUndefined();
  });

  it("preserves edge, geometric, kind-filter and deterministic sorting rules", () => {
    expect(
      findNearbyFacilities([routeNode.id], {
        graph: queryGraph,
        maximumDistanceMeters: 25,
      }),
    ).toEqual([
      {
        id: alphaMedical.id,
        name: alphaMedical.name,
        kind: "medical",
        zoneId: zone.id,
        accessible: true,
        distanceFromRouteMeters: 12,
      },
      {
        id: betaMedical.id,
        name: betaMedical.name,
        kind: "medical",
        zoneId: zone.id,
        accessible: true,
        distanceFromRouteMeters: 12,
      },
      {
        id: water.id,
        name: water.name,
        kind: "water-refill",
        zoneId: zone.id,
        accessible: true,
        distanceFromRouteMeters: 25,
      },
    ]);

    expect(
      findNearbyFacilities([routeNode.id], {
        graph: queryGraph,
        maximumDistanceMeters: 25,
        kinds: ["medical"],
      }).map((facility) => facility.id),
    ).toEqual([alphaMedical.id, betaMedical.id]);
    expect(
      findNearbyFacilities([lift.id], { graph: queryGraph, maximumDistanceMeters: 0 }),
    ).toMatchObject([{ id: lift.id, distanceFromRouteMeters: 0 }]);
  });

  it("reuses one graph scan across a repeated query batch", () => {
    const iterations = { nodes: 0, edges: 0, zones: 0 };
    const countedGraph: StadiumGraph = {
      nodes: countedArray(queryGraph.nodes, () => {
        iterations.nodes += 1;
      }),
      edges: countedArray(queryGraph.edges, () => {
        iterations.edges += 1;
      }),
      zones: countedArray(queryGraph.zones, () => {
        iterations.zones += 1;
      }),
    };

    for (let index = 0; index < 250; index += 1) {
      expect(getStadiumNode(alphaMedical.id, countedGraph)).toBe(alphaMedical);
      expect(getStadiumEdge(alphaEdge.id, countedGraph)).toBe(alphaEdge);
      expect(getZone(zone.id, countedGraph)).toBe(zone);
      expect(
        findNearbyFacilities([routeNode.id], { graph: countedGraph, kinds: ["medical"] }),
      ).toHaveLength(2);
    }

    expect(iterations).toEqual({ nodes: 1, edges: 1, zones: 1 });
  });
});
