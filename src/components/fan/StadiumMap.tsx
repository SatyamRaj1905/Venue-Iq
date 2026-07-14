import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { STADIUM_EDGES, STADIUM_NODES } from "@/lib/domain/stadiumGraph";

type FanRoute = NonNullable<FanAssistanceResponse["route"]>;

interface StadiumMapProps {
  route: FanRoute;
}

const fallbackPosition = { x: 50, y: 50 };
const nodesById = new Map(STADIUM_NODES.map((node) => [node.id, node]));
const edgesById = new Map(STADIUM_EDGES.map((edge) => [edge.id, edge]));

function getPosition(nodeId: string) {
  return nodesById.get(nodeId)?.position ?? fallbackPosition;
}

function getName(nodeId: string): string {
  return nodesById.get(nodeId)?.name ?? nodeId;
}

/** Resolve the ordered, deterministic graph edges without drawing an invented shortcut. */
function getRouteNodeIds(route: FanRoute): readonly string[] {
  const nodeIds = [route.originId];
  let currentNodeId = route.originId;

  for (const step of route.steps) {
    const edge = edgesById.get(step.id);
    if (edge === undefined) {
      break;
    }

    const nextNodeId =
      edge.from === currentNodeId
        ? edge.to
        : edge.bidirectional && edge.to === currentNodeId
          ? edge.from
          : undefined;
    if (nextNodeId === undefined) {
      break;
    }

    nodeIds.push(nextNodeId);
    currentNodeId = nextNodeId;
  }

  return nodeIds;
}

export function StadiumMap({ route }: StadiumMapProps) {
  const routeNodeIds = getRouteNodeIds(route);
  const routePositions = routeNodeIds.map(getPosition);
  const routePoints = routePositions.map(({ x, y }) => `${x},${y}`).join(" ");
  const origin = getPosition(route.originId);
  const destination = getPosition(route.destinationId);
  const originName = getName(route.originId);
  const destinationName = getName(route.destinationId);
  const pathNames = routeNodeIds.map(getName);
  const completeRoute = routeNodeIds.at(-1) === route.destinationId;

  return (
    <figure className="stadium-map">
      <div className="stadium-map__canvas">
        <svg viewBox="0 0 100 100" role="img" aria-labelledby="fan-map-title fan-map-description">
          <title id="fan-map-title">
            Route from {originName} to {destinationName}
          </title>
          <desc id="fan-map-description">
            A schematic stadium map. The mapped route follows {pathNames.join(", then ")}.
            {completeRoute
              ? " The start is a circle and the destination is a diamond."
              : " Only verified route segments are shown because the complete path could not be mapped."}
            {" The ordered text directions directly below provide the complete equivalent route."}
          </desc>
          <defs>
            <filter id="routeGlow">
              <feGaussianBlur stdDeviation="1.15" result="blur" />
            </filter>
          </defs>
          <ellipse className="fan-map__ring fan-map__ring--outer" cx="50" cy="50" rx="44" ry="38" />
          <ellipse className="fan-map__ring" cx="50" cy="50" rx="34" ry="27" />
          <ellipse className="fan-map__ring fan-map__ring--inner" cx="50" cy="50" rx="21" ry="14" />
          <rect className="fan-map__pitch" x="39" y="43" width="22" height="14" rx="1.5" />
          <path className="fan-map__aisle" d="M50 12v24M50 64v24M10 50h26M64 50h26" />
          <polyline className="fan-map__route-glow" points={routePoints} filter="url(#routeGlow)" />
          <polyline className="fan-map__route" points={routePoints} />
          {STADIUM_NODES.filter((node) => ["gate", "section", "lift"].includes(node.kind)).map(
            (node) => (
              <circle
                className={`fan-map__node fan-map__node--${node.kind}`}
                cx={node.position.x}
                cy={node.position.y}
                key={node.id}
                r={node.kind === "gate" ? 1.8 : 1.2}
              />
            ),
          )}
          {routePositions.slice(1, -1).map((position, index) => (
            <circle
              aria-hidden="true"
              className="fan-map__route-waypoint"
              cx={position.x}
              cy={position.y}
              key={`${routeNodeIds[index + 1]}-${index}`}
              r="1.35"
            />
          ))}
          <circle
            aria-hidden="true"
            className="fan-map__marker fan-map__marker--origin"
            cx={origin.x}
            cy={origin.y}
            r="3"
          />
          <rect
            aria-hidden="true"
            className="fan-map__marker fan-map__marker--destination"
            height="5.4"
            transform={`rotate(45 ${destination.x} ${destination.y})`}
            width="5.4"
            x={destination.x - 2.7}
            y={destination.y - 2.7}
          />
        </svg>
        <span className="stadium-map__north" aria-hidden="true">
          N
        </span>
        <div className="stadium-map__legend" aria-hidden="true">
          <span>
            <i className="legend-dot legend-dot--start" /> Start
          </span>
          <span>
            <i className="legend-dot legend-dot--end" /> Destination
          </span>
          <span>
            <i className="legend-line" /> Route
          </span>
        </div>
      </div>
      <figcaption>Schematic venue map · Not to scale · Simulated data</figcaption>
    </figure>
  );
}
