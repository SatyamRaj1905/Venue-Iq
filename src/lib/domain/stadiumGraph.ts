import type {
  FacilityKind,
  NearbyFacility,
  NodeId,
  StadiumEdge,
  StadiumGraph,
  StadiumNode,
  StadiumZone,
} from "./types";

import { STADIUM_EDGES } from "./stadiumEdges.data";
import { STADIUM_NODES, STADIUM_NODE_IDS } from "./stadiumNodes.data";
import { STADIUM_ZONES } from "./stadiumZones.data";

export { STADIUM_EDGES, STADIUM_NODES, STADIUM_NODE_IDS, STADIUM_ZONES };

export const STADIUM_GRAPH: StadiumGraph = {
  nodes: STADIUM_NODES,
  edges: STADIUM_EDGES,
  zones: STADIUM_ZONES,
};

const FACILITY_KINDS: ReadonlySet<string> = new Set([
  "lift",
  "toilet",
  "accessible-toilet",
  "medical",
  "water-refill",
  "assistance-desk",
  "food",
  "transport-pickup",
]);

export function isFacilityKind(kind: string): kind is FacilityKind {
  return FACILITY_KINDS.has(kind);
}

type FacilityNode = StadiumNode & Readonly<{ kind: FacilityKind }>;

function isFacilityNode(node: StadiumNode): node is FacilityNode {
  return isFacilityKind(node.kind);
}

interface GraphQueryIndex {
  readonly connectingEdgesByNode: ReadonlyMap<NodeId, readonly StadiumEdge[]>;
  readonly edgeById: ReadonlyMap<string, StadiumEdge>;
  readonly facilityNodes: readonly FacilityNode[];
  readonly nodeById: ReadonlyMap<NodeId, StadiumNode>;
  readonly nodesById: ReadonlyMap<NodeId, readonly StadiumNode[]>;
  readonly zoneById: ReadonlyMap<string, StadiumZone>;
}

const graphQueryIndexCache = new WeakMap<StadiumGraph, GraphQueryIndex>();

function setFirst<TKey, TValue>(map: Map<TKey, TValue>, key: TKey, value: TValue): void {
  if (!map.has(key)) {
    map.set(key, value);
  }
}

function buildGraphQueryIndex(graph: StadiumGraph): GraphQueryIndex {
  const nodeById = new Map<NodeId, StadiumNode>();
  const nodesById = new Map<NodeId, StadiumNode[]>();
  const edgeById = new Map<string, StadiumEdge>();
  const zoneById = new Map<string, StadiumZone>();
  const connectingEdgesByNode = new Map<NodeId, StadiumEdge[]>();
  const facilityNodes: FacilityNode[] = [];

  for (const node of graph.nodes) {
    setFirst(nodeById, node.id, node);
    const matchingNodes = nodesById.get(node.id) ?? [];
    matchingNodes.push(node);
    nodesById.set(node.id, matchingNodes);
    if (!connectingEdgesByNode.has(node.id)) {
      connectingEdgesByNode.set(node.id, []);
    }
    if (isFacilityNode(node)) {
      facilityNodes.push(node);
    }
  }
  for (const edge of graph.edges) {
    setFirst(edgeById, edge.id, edge);
    connectingEdgesByNode.get(edge.from)?.push(edge);
    if (edge.to !== edge.from) {
      connectingEdgesByNode.get(edge.to)?.push(edge);
    }
  }
  for (const zone of graph.zones) {
    setFirst(zoneById, zone.id, zone);
  }

  return { connectingEdgesByNode, edgeById, facilityNodes, nodeById, nodesById, zoneById };
}

function getGraphQueryIndex(graph: StadiumGraph): GraphQueryIndex {
  const cached = graphQueryIndexCache.get(graph);
  if (cached !== undefined) {
    return cached;
  }
  const index = buildGraphQueryIndex(graph);
  graphQueryIndexCache.set(graph, index);
  return index;
}

export function getStadiumNode(
  nodeId: NodeId,
  graph: StadiumGraph = STADIUM_GRAPH,
): StadiumNode | undefined {
  return getGraphQueryIndex(graph).nodeById.get(nodeId);
}

export function getStadiumEdge(
  edgeId: string,
  graph: StadiumGraph = STADIUM_GRAPH,
): StadiumEdge | undefined {
  return getGraphQueryIndex(graph).edgeById.get(edgeId);
}

export function getZone(
  zoneId: string,
  graph: StadiumGraph = STADIUM_GRAPH,
): StadiumZone | undefined {
  return getGraphQueryIndex(graph).zoneById.get(zoneId);
}

function directDistanceToRoute(
  facility: StadiumNode,
  routeNodeIds: ReadonlySet<NodeId>,
  index: GraphQueryIndex,
): number {
  if (routeNodeIds.has(facility.id)) {
    return 0;
  }

  let hasConnectingEdge = false;
  let connectingDistance = Number.POSITIVE_INFINITY;
  for (const edge of index.connectingEdgesByNode.get(facility.id) ?? []) {
    if (
      (edge.from === facility.id && routeNodeIds.has(edge.to)) ||
      (edge.to === facility.id && routeNodeIds.has(edge.from))
    ) {
      hasConnectingEdge = true;
      connectingDistance = Math.min(connectingDistance, edge.distanceMeters);
    }
  }
  if (hasConnectingEdge) {
    return connectingDistance;
  }

  let directDistance = Number.POSITIVE_INFINITY;
  for (const routeNodeId of routeNodeIds) {
    for (const node of index.nodesById.get(routeNodeId) ?? []) {
      const xDistance = node.position.x - facility.position.x;
      const yDistance = node.position.y - facility.position.y;
      directDistance = Math.min(directDistance, Math.round(Math.hypot(xDistance, yDistance) * 5));
    }
  }
  return directDistance;
}

export function findNearbyFacilities(
  routeNodeIds: readonly NodeId[],
  options: {
    readonly graph?: StadiumGraph;
    readonly maximumDistanceMeters?: number;
    readonly kinds?: readonly FacilityKind[];
  } = {},
): readonly NearbyFacility[] {
  const graph = options.graph ?? STADIUM_GRAPH;
  const index = getGraphQueryIndex(graph);
  const maximumDistanceMeters = options.maximumDistanceMeters ?? 35;
  const routeIds = new Set(routeNodeIds);
  const allowedKinds = options.kinds === undefined ? undefined : new Set(options.kinds);

  return index.facilityNodes
    .filter((node) => allowedKinds === undefined || allowedKinds.has(node.kind))
    .map((node) => ({
      id: node.id,
      name: node.name,
      kind: node.kind,
      zoneId: node.zoneId,
      accessible: node.accessible,
      distanceFromRouteMeters: directDistanceToRoute(node, routeIds, index),
    }))
    .filter((facility) => facility.distanceFromRouteMeters <= maximumDistanceMeters)
    .sort(
      (left, right) =>
        left.distanceFromRouteMeters - right.distanceFromRouteMeters ||
        left.name.localeCompare(right.name),
    );
}

export interface GraphIntegrityReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateStadiumGraph(graph: StadiumGraph): GraphIntegrityReport {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const zoneIds = new Set(graph.zones.map((zone) => zone.id));

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
    if (!zoneIds.has(node.zoneId)) {
      errors.push(`Node ${node.id} references unknown zone ${node.zoneId}`);
    }
  }

  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge id: ${edge.id}`);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      errors.push(`Edge ${edge.id} references an unknown node`);
    }
    if (edge.distanceMeters <= 0) {
      errors.push(`Edge ${edge.id} must have a positive distance`);
    }
    for (const zoneId of edge.zoneIds) {
      if (!zoneIds.has(zoneId)) {
        errors.push(`Edge ${edge.id} references unknown zone ${zoneId}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
