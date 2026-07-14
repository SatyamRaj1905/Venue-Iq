import { findNearbyFacilities } from "./stadiumGraph";
import type {
  CrowdLevel,
  EdgeId,
  NodeId,
  RouteConditions,
  RoutePreferences,
  RouteRequest,
  RouteResult,
  RouteSearchResult,
  RouteStep,
  StadiumEdge,
  StadiumGraph,
  StadiumNode,
  StadiumPathKind,
} from "./types";

const DEFAULT_WALKING_SPEED_METERS_PER_SECOND = 1.3;
const DEFAULT_ACCESSIBLE_SPEED_METERS_PER_SECOND = 1;

interface Traversal {
  readonly edge: StadiumEdge;
  readonly toNodeId: NodeId;
}

interface PreviousTraversal {
  readonly fromNodeId: NodeId;
  readonly edgeId: EdgeId;
}

interface WalkingTimeOptions {
  readonly speedMetersPerSecond?: number;
  readonly crowdLevel?: CrowdLevel;
  readonly pathKind?: StadiumPathKind;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimalPlaces = 1): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

export function classifyRouteCrowd(occupancyPercentage: number): CrowdLevel {
  if (occupancyPercentage >= 100) {
    return "critical";
  }
  if (occupancyPercentage >= 80) {
    return "high";
  }
  if (occupancyPercentage >= 55) {
    return "moderate";
  }
  return "low";
}

export function calculateWalkingTime(
  distanceMeters: number,
  options: WalkingTimeOptions = {},
): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new RangeError("Distance must be a finite, non-negative number.");
  }

  const speed = options.speedMetersPerSecond ?? DEFAULT_WALKING_SPEED_METERS_PER_SECOND;
  if (!Number.isFinite(speed) || speed <= 0 || speed > 3) {
    throw new RangeError("Walking speed must be greater than 0 and at most 3 m/s.");
  }

  const crowdFactor: Readonly<Record<CrowdLevel, number>> = {
    low: 1,
    moderate: 0.88,
    high: 0.7,
    critical: 0.5,
  };
  const pathFactor: Readonly<Record<StadiumPathKind, number>> = {
    walkway: 1,
    "accessible-path": 1,
    ramp: 0.82,
    lift: 0.72,
    stairs: 0.75,
  };
  const crowd = crowdFactor[options.crowdLevel ?? "low"];
  const path = pathFactor[options.pathKind ?? "walkway"];
  const liftWaitSeconds = options.pathKind === "lift" && distanceMeters > 0 ? 20 : 0;

  return Math.round(distanceMeters / (speed * crowd * path) + liftWaitSeconds);
}

function buildAdjacency(graph: StadiumGraph): ReadonlyMap<NodeId, readonly Traversal[]> {
  const mutable = new Map<NodeId, Traversal[]>();
  for (const node of graph.nodes) {
    mutable.set(node.id, []);
  }

  for (const edge of graph.edges) {
    mutable.get(edge.from)?.push({ edge, toNodeId: edge.to });
    if (edge.bidirectional) {
      mutable.get(edge.to)?.push({ edge, toNodeId: edge.from });
    }
  }

  for (const traversals of mutable.values()) {
    traversals.sort(
      (left, right) =>
        left.edge.id.localeCompare(right.edge.id) || left.toNodeId.localeCompare(right.toNodeId),
    );
  }
  return mutable;
}

function edgeCrowdPercentage(edge: StadiumEdge, conditions: RouteConditions | undefined): number {
  const zoneCrowd = edge.zoneIds
    .map((zoneId) => conditions?.crowdByZone?.[zoneId])
    .filter((value): value is number => value !== undefined && Number.isFinite(value));

  if (zoneCrowd.length === 0) {
    return clamp(edge.baselineCrowd * 100, 0, 150);
  }
  return clamp(Math.max(...zoneCrowd), 0, 150);
}

function edgeIsAvailable(
  edge: StadiumEdge,
  toNode: StadiumNode,
  preferences: RoutePreferences,
  conditions: RouteConditions | undefined,
): boolean {
  const closedEdges = new Set(conditions?.closedEdgeIds ?? []);
  const closedNodes = new Set(conditions?.closedNodeIds ?? []);
  const obstructions = new Set(conditions?.obstructedEdgeIds ?? []);
  const avoidObstructions = preferences.avoidAccessibilityObstructions ?? true;

  if (edge.status === "closed" || closedEdges.has(edge.id) || closedNodes.has(toNode.id)) {
    return false;
  }
  if (preferences.stepFree === true && (!edge.stepFree || !toNode.accessible)) {
    return false;
  }
  if (avoidObstructions && (edge.accessibilityObstructed || obstructions.has(edge.id))) {
    return false;
  }
  return true;
}

function edgeWeight(
  edge: StadiumEdge,
  preferences: RoutePreferences,
  conditions: RouteConditions | undefined,
): number {
  let multiplier = edge.status === "restricted" ? 1.5 : 1;
  if (preferences.avoidCrowds === true) {
    const crowdRatio = edgeCrowdPercentage(edge, conditions) / 100;
    multiplier *= 1 + 12 * crowdRatio ** 3;
  }
  if (preferences.preferQuiet === true) {
    const noiseRatio = (100 - edge.quietScore) / 100;
    multiplier *= 1 + 3 * noiseRatio ** 2;
  }
  return edge.distanceMeters * multiplier;
}

function selectNextNode(
  graph: StadiumGraph,
  distanceByNode: ReadonlyMap<NodeId, number>,
  visited: ReadonlySet<NodeId>,
): NodeId | undefined {
  let selected: NodeId | undefined;
  let selectedDistance = Number.POSITIVE_INFINITY;

  for (const node of graph.nodes) {
    if (visited.has(node.id)) {
      continue;
    }
    const distance = distanceByNode.get(node.id) ?? Number.POSITIVE_INFINITY;
    if (
      distance < selectedDistance ||
      (distance === selectedDistance && selected !== undefined && node.id < selected)
    ) {
      selected = node.id;
      selectedDistance = distance;
    }
  }

  return selectedDistance === Number.POSITIVE_INFINITY ? undefined : selected;
}

function reconstructPath(
  originId: NodeId,
  destinationId: NodeId,
  previous: ReadonlyMap<NodeId, PreviousTraversal>,
): { readonly nodeIds: readonly NodeId[]; readonly edgeIds: readonly EdgeId[] } {
  const nodeIds: NodeId[] = [destinationId];
  const edgeIds: EdgeId[] = [];
  let current = destinationId;

  while (current !== originId) {
    const traversal = previous.get(current);
    if (traversal === undefined) {
      return { nodeIds: [], edgeIds: [] };
    }
    edgeIds.unshift(traversal.edgeId);
    nodeIds.unshift(traversal.fromNodeId);
    current = traversal.fromNodeId;
  }
  return { nodeIds, edgeIds };
}

function instructionForEdge(edge: StadiumEdge, toNode: StadiumNode): string {
  switch (edge.kind) {
    case "lift":
      return `Take the lift to ${toNode.name}.`;
    case "ramp":
      return `Follow the step-free ramp to ${toNode.name}.`;
    case "stairs":
      return `Use the stairs to ${toNode.name}.`;
    case "accessible-path":
      return `Follow the accessible path to ${toNode.name}.`;
    case "walkway":
      return `Continue along the concourse to ${toNode.name}.`;
  }
}

function accessibilityNote(edge: StadiumEdge): string {
  if (!edge.stepFree) {
    return "This step contains stairs and is not step-free.";
  }
  if (edge.kind === "lift") {
    return "Step-free lift; allow time to board and exit.";
  }
  if (edge.kind === "ramp") {
    return "Step-free ramp with a gradual incline.";
  }
  return "Step-free segment.";
}

function createSteps(
  graph: StadiumGraph,
  nodeIds: readonly NodeId[],
  edgeIds: readonly EdgeId[],
  preferences: RoutePreferences,
  conditions: RouteConditions | undefined,
): readonly RouteStep[] {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const speed =
    preferences.walkingSpeedMetersPerSecond ??
    (preferences.stepFree === true
      ? DEFAULT_ACCESSIBLE_SPEED_METERS_PER_SECOND
      : DEFAULT_WALKING_SPEED_METERS_PER_SECOND);

  return edgeIds.map((edgeId, index) => {
    const edge = edges.get(edgeId);
    const fromId = nodeIds[index];
    const toId = nodeIds[index + 1];
    const fromNode = fromId === undefined ? undefined : nodes.get(fromId);
    const toNode = toId === undefined ? undefined : nodes.get(toId);
    if (edge === undefined || fromNode === undefined || toNode === undefined) {
      throw new Error("Route reconstruction encountered invalid graph data.");
    }
    const crowdLevel = classifyRouteCrowd(edgeCrowdPercentage(edge, conditions));
    return {
      index: index + 1,
      fromNodeId: fromNode.id,
      fromName: fromNode.name,
      toNodeId: toNode.id,
      toName: toNode.name,
      edgeId: edge.id,
      instruction: instructionForEdge(edge, toNode),
      distanceMeters: edge.distanceMeters,
      estimatedSeconds: calculateWalkingTime(edge.distanceMeters, {
        speedMetersPerSecond: speed,
        crowdLevel,
        pathKind: edge.kind,
      }),
      pathKind: edge.kind,
      zoneIds: edge.zoneIds,
      stepFree: edge.stepFree,
      crowdLevel,
      accessibilityNote: accessibilityNote(edge),
    } satisfies RouteStep;
  });
}

function createExplanations(
  preferences: RoutePreferences,
  routeIsStepFree: boolean,
  crowdLevel: CrowdLevel,
): readonly string[] {
  const explanations: string[] = ["Calculated from the trusted simulated stadium graph."];
  if (preferences.stepFree === true) {
    explanations.push(
      routeIsStepFree ? "Every segment is step-free." : "No fully step-free route was available.",
    );
  }
  if (preferences.avoidCrowds === true) {
    explanations.push(
      `Crowd weighting was applied; the busiest selected segment is ${crowdLevel}.`,
    );
  }
  if (preferences.preferQuiet === true) {
    explanations.push("Quieter paths received a lower routing cost.");
  }
  if (preferences.avoidAccessibilityObstructions ?? true) {
    explanations.push("Closed and accessibility-obstructed paths were excluded.");
  } else {
    explanations.push("Closed paths were excluded.");
  }
  return explanations;
}

export function findRoute(graph: StadiumGraph, request: RouteRequest): RouteSearchResult {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodeById.has(request.originId)) {
    return {
      found: false,
      reason: "unknown-origin",
      message: `Unknown origin node: ${request.originId}`,
      simulated: true,
    };
  }
  if (!nodeById.has(request.destinationId)) {
    return {
      found: false,
      reason: "unknown-destination",
      message: `Unknown destination node: ${request.destinationId}`,
      simulated: true,
    };
  }

  const preferences = request.preferences ?? {};
  const adjacency = buildAdjacency(graph);
  const distanceByNode = new Map<NodeId, number>();
  const previous = new Map<NodeId, PreviousTraversal>();
  const visited = new Set<NodeId>();
  for (const node of graph.nodes) {
    distanceByNode.set(node.id, Number.POSITIVE_INFINITY);
  }
  distanceByNode.set(request.originId, 0);

  while (visited.size < graph.nodes.length) {
    const currentId = selectNextNode(graph, distanceByNode, visited);
    if (currentId === undefined || currentId === request.destinationId) {
      break;
    }
    visited.add(currentId);
    const currentDistance = distanceByNode.get(currentId) ?? Number.POSITIVE_INFINITY;

    for (const traversal of adjacency.get(currentId) ?? []) {
      const toNode = nodeById.get(traversal.toNodeId);
      if (
        toNode === undefined ||
        visited.has(toNode.id) ||
        !edgeIsAvailable(traversal.edge, toNode, preferences, request.conditions)
      ) {
        continue;
      }
      const candidate =
        currentDistance + edgeWeight(traversal.edge, preferences, request.conditions);
      const known = distanceByNode.get(toNode.id) ?? Number.POSITIVE_INFINITY;
      const previousEdgeId = previous.get(toNode.id)?.edgeId;
      if (
        candidate < known ||
        (candidate === known &&
          (previousEdgeId === undefined || traversal.edge.id < previousEdgeId))
      ) {
        distanceByNode.set(toNode.id, candidate);
        previous.set(toNode.id, {
          fromNodeId: currentId,
          edgeId: traversal.edge.id,
        });
      }
    }
  }

  const path = reconstructPath(request.originId, request.destinationId, previous);
  if (path.nodeIds.length === 0) {
    return {
      found: false,
      reason: "no-route",
      message: "No safe route satisfies the selected constraints.",
      simulated: true,
    };
  }

  const steps = createSteps(graph, path.nodeIds, path.edgeIds, preferences, request.conditions);
  const totalDistanceMeters = steps.reduce((total, step) => total + step.distanceMeters, 0);
  const estimatedWalkingSeconds = steps.reduce((total, step) => total + step.estimatedSeconds, 0);
  const highestCrowdPercentage = path.edgeIds.reduce((highest, edgeId) => {
    const edge = graph.edges.find((candidate) => candidate.id === edgeId);
    return edge === undefined
      ? highest
      : Math.max(highest, edgeCrowdPercentage(edge, request.conditions));
  }, 0);
  const crowdLevel = classifyRouteCrowd(highestCrowdPercentage);
  const routeIsStepFree = steps.every((step) => step.stepFree);
  const route: RouteResult = {
    originId: request.originId,
    destinationId: request.destinationId,
    nodeIds: path.nodeIds,
    edgeIds: path.edgeIds,
    steps,
    totalDistanceMeters,
    estimatedWalkingSeconds,
    estimatedWalkingMinutes: Math.max(0, round(estimatedWalkingSeconds / 60)),
    scoreMeters: round(distanceByNode.get(request.destinationId) ?? totalDistanceMeters, 2),
    crowdLevel,
    isStepFree: routeIsStepFree,
    explanations: createExplanations(preferences, routeIsStepFree, crowdLevel),
    nearbyFacilities: findNearbyFacilities(path.nodeIds, { graph }),
    simulated: true,
  };
  return { found: true, route };
}

export function getShortestRoute(
  graph: StadiumGraph,
  originId: NodeId,
  destinationId: NodeId,
  conditions?: RouteConditions,
): RouteSearchResult {
  const request: RouteRequest =
    conditions === undefined
      ? { originId, destinationId }
      : { originId, destinationId, conditions };
  return findRoute(graph, request);
}

export function getAccessibleRoute(
  graph: StadiumGraph,
  originId: NodeId,
  destinationId: NodeId,
  conditions?: RouteConditions,
): RouteSearchResult {
  const request: RouteRequest = {
    originId,
    destinationId,
    preferences: {
      stepFree: true,
      avoidCrowds: true,
      avoidAccessibilityObstructions: true,
    },
    ...(conditions === undefined ? {} : { conditions }),
  };
  return findRoute(graph, request);
}
