import { findNearbyFacilities } from "./stadiumGraph";
import { RoutePriorityQueue } from "./routePriorityQueue";
import {
  calculateWalkingTime,
  classifyRouteCrowd,
  DEFAULT_WALKING_SPEED_METERS_PER_SECOND,
} from "./routeTiming";
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
} from "./types";

const DEFAULT_ACCESSIBLE_SPEED_METERS_PER_SECOND = 1;

export { calculateWalkingTime, classifyRouteCrowd } from "./routeTiming";

interface Traversal {
  readonly edge: StadiumEdge;
  readonly toNodeId: NodeId;
}

interface PreviousTraversal {
  readonly fromNodeId: NodeId;
  readonly edgeId: EdgeId;
}

interface GraphIndex {
  readonly adjacency: ReadonlyMap<NodeId, readonly Traversal[]>;
  readonly edgeById: ReadonlyMap<EdgeId, StadiumEdge>;
  readonly nodeById: ReadonlyMap<NodeId, StadiumNode>;
}

interface PreparedConditions {
  readonly closedEdgeIds: ReadonlySet<EdgeId>;
  readonly closedNodeIds: ReadonlySet<NodeId>;
  readonly crowdByZone: RouteConditions["crowdByZone"];
  readonly obstructedEdgeIds: ReadonlySet<EdgeId>;
}

interface RouteSearchState {
  readonly distanceByNode: Map<NodeId, number>;
  readonly previous: Map<NodeId, PreviousTraversal>;
  readonly queue: RoutePriorityQueue;
  readonly visited: Set<NodeId>;
}

const graphIndexCache = new WeakMap<StadiumGraph, GraphIndex>();

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimalPlaces = 1): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

function buildGraphIndex(graph: StadiumGraph): GraphIndex {
  const mutable = new Map<NodeId, Traversal[]>();
  const nodeById = new Map<NodeId, StadiumNode>();
  const edgeById = new Map<EdgeId, StadiumEdge>();
  for (const node of graph.nodes) {
    mutable.set(node.id, []);
    nodeById.set(node.id, node);
  }

  for (const edge of graph.edges) {
    edgeById.set(edge.id, edge);
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
  return { adjacency: mutable, edgeById, nodeById };
}

function getGraphIndex(graph: StadiumGraph): GraphIndex {
  const cached = graphIndexCache.get(graph);
  if (cached !== undefined) {
    return cached;
  }
  const index = buildGraphIndex(graph);
  graphIndexCache.set(graph, index);
  return index;
}

function prepareConditions(conditions: RouteConditions | undefined): PreparedConditions {
  return {
    closedEdgeIds: new Set(conditions?.closedEdgeIds ?? []),
    closedNodeIds: new Set(conditions?.closedNodeIds ?? []),
    crowdByZone: conditions?.crowdByZone,
    obstructedEdgeIds: new Set(conditions?.obstructedEdgeIds ?? []),
  };
}

function edgeCrowdPercentage(edge: StadiumEdge, conditions: PreparedConditions): number {
  const zoneCrowd = edge.zoneIds
    .map((zoneId) => conditions.crowdByZone?.[zoneId])
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
  conditions: PreparedConditions,
): boolean {
  const avoidObstructions = preferences.avoidAccessibilityObstructions ?? true;

  if (
    edge.status === "closed" ||
    conditions.closedEdgeIds.has(edge.id) ||
    conditions.closedNodeIds.has(toNode.id)
  ) {
    return false;
  }
  if (preferences.stepFree === true && (!edge.stepFree || !toNode.accessible)) {
    return false;
  }
  if (
    avoidObstructions &&
    (edge.accessibilityObstructed || conditions.obstructedEdgeIds.has(edge.id))
  ) {
    return false;
  }
  return true;
}

function edgeWeight(
  edge: StadiumEdge,
  preferences: RoutePreferences,
  conditions: PreparedConditions,
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

function reconstructPath(
  originId: NodeId,
  destinationId: NodeId,
  previous: ReadonlyMap<NodeId, PreviousTraversal>,
): { readonly nodeIds: readonly NodeId[]; readonly edgeIds: readonly EdgeId[] } {
  const reverseNodeIds: NodeId[] = [destinationId];
  const reverseEdgeIds: EdgeId[] = [];
  let current = destinationId;

  while (current !== originId) {
    const traversal = previous.get(current);
    if (traversal === undefined) {
      return { nodeIds: [], edgeIds: [] };
    }
    reverseEdgeIds.push(traversal.edgeId);
    reverseNodeIds.push(traversal.fromNodeId);
    current = traversal.fromNodeId;
  }
  reverseNodeIds.reverse();
  reverseEdgeIds.reverse();
  return { nodeIds: reverseNodeIds, edgeIds: reverseEdgeIds };
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
  graphIndex: GraphIndex,
  nodeIds: readonly NodeId[],
  edgeIds: readonly EdgeId[],
  preferences: RoutePreferences,
  conditions: PreparedConditions,
): readonly RouteStep[] {
  const speed =
    preferences.walkingSpeedMetersPerSecond ??
    (preferences.stepFree === true
      ? DEFAULT_ACCESSIBLE_SPEED_METERS_PER_SECOND
      : DEFAULT_WALKING_SPEED_METERS_PER_SECOND);

  return edgeIds.map((edgeId, stepIndex) => {
    const edge = graphIndex.edgeById.get(edgeId);
    const fromId = nodeIds[stepIndex];
    const toId = nodeIds[stepIndex + 1];
    const fromNode = fromId === undefined ? undefined : graphIndex.nodeById.get(fromId);
    const toNode = toId === undefined ? undefined : graphIndex.nodeById.get(toId);
    if (edge === undefined || fromNode === undefined || toNode === undefined) {
      throw new Error("Route reconstruction encountered invalid graph data.");
    }
    const crowdLevel = classifyRouteCrowd(edgeCrowdPercentage(edge, conditions));
    return {
      index: stepIndex + 1,
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

function relaxTraversal(
  traversal: Traversal,
  currentNodeId: NodeId,
  currentDistance: number,
  index: GraphIndex,
  preferences: RoutePreferences,
  conditions: PreparedConditions,
  state: RouteSearchState,
): void {
  const toNode = index.nodeById.get(traversal.toNodeId);
  if (
    toNode === undefined ||
    state.visited.has(toNode.id) ||
    !edgeIsAvailable(traversal.edge, toNode, preferences, conditions)
  ) {
    return;
  }

  const candidate = currentDistance + edgeWeight(traversal.edge, preferences, conditions);
  const known = state.distanceByNode.get(toNode.id) ?? Number.POSITIVE_INFINITY;
  const previousEdgeId = state.previous.get(toNode.id)?.edgeId;
  const improvesDistance = candidate < known;
  const improvesTie =
    candidate === known && (previousEdgeId === undefined || traversal.edge.id < previousEdgeId);
  if (!improvesDistance && !improvesTie) {
    return;
  }

  state.distanceByNode.set(toNode.id, candidate);
  state.previous.set(toNode.id, {
    fromNodeId: currentNodeId,
    edgeId: traversal.edge.id,
  });
  state.queue.push({ distance: candidate, nodeId: toNode.id });
}

function searchGraph(
  index: GraphIndex,
  originId: NodeId,
  destinationId: NodeId,
  preferences: RoutePreferences,
  conditions: PreparedConditions,
): Readonly<{
  distanceByNode: ReadonlyMap<NodeId, number>;
  previous: ReadonlyMap<NodeId, PreviousTraversal>;
}> {
  const state: RouteSearchState = {
    distanceByNode: new Map<NodeId, number>([[originId, 0]]),
    previous: new Map<NodeId, PreviousTraversal>(),
    queue: new RoutePriorityQueue(),
    visited: new Set<NodeId>(),
  };
  state.queue.push({ distance: 0, nodeId: originId });

  for (let current = state.queue.pop(); current !== undefined; current = state.queue.pop()) {
    if (
      state.visited.has(current.nodeId) ||
      state.distanceByNode.get(current.nodeId) !== current.distance
    ) {
      continue;
    }
    if (current.nodeId === destinationId) {
      break;
    }
    state.visited.add(current.nodeId);

    for (const traversal of index.adjacency.get(current.nodeId) ?? []) {
      relaxTraversal(
        traversal,
        current.nodeId,
        current.distance,
        index,
        preferences,
        conditions,
        state,
      );
    }
  }

  return { distanceByNode: state.distanceByNode, previous: state.previous };
}

export function findRoute(graph: StadiumGraph, request: RouteRequest): RouteSearchResult {
  const index = getGraphIndex(graph);
  if (!index.nodeById.has(request.originId)) {
    return {
      found: false,
      reason: "unknown-origin",
      message: `Unknown origin node: ${request.originId}`,
      simulated: true,
    };
  }
  if (!index.nodeById.has(request.destinationId)) {
    return {
      found: false,
      reason: "unknown-destination",
      message: `Unknown destination node: ${request.destinationId}`,
      simulated: true,
    };
  }

  const preferences = request.preferences ?? {};
  const conditions = prepareConditions(request.conditions);
  const { distanceByNode, previous } = searchGraph(
    index,
    request.originId,
    request.destinationId,
    preferences,
    conditions,
  );

  const path = reconstructPath(request.originId, request.destinationId, previous);
  if (path.nodeIds.length === 0) {
    return {
      found: false,
      reason: "no-route",
      message: "No safe route satisfies the selected constraints.",
      simulated: true,
    };
  }

  const steps = createSteps(index, path.nodeIds, path.edgeIds, preferences, conditions);
  const totalDistanceMeters = steps.reduce((total, step) => total + step.distanceMeters, 0);
  const estimatedWalkingSeconds = steps.reduce((total, step) => total + step.estimatedSeconds, 0);
  const highestCrowdPercentage = path.edgeIds.reduce((highest, edgeId) => {
    const edge = index.edgeById.get(edgeId);
    return edge === undefined ? highest : Math.max(highest, edgeCrowdPercentage(edge, conditions));
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
