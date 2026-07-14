import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { MapPinned } from "lucide-react";
import { STADIUM_NODES } from "@/lib/domain/stadiumGraph";

type FanRoute = NonNullable<FanAssistanceResponse["route"]>;

interface AccessibleMapListProps {
  route: FanRoute;
}

function getName(nodeId: string): string {
  return STADIUM_NODES.find((node) => node.id === nodeId)?.name ?? nodeId;
}

export function AccessibleMapList({ route }: AccessibleMapListProps) {
  return (
    <details className="map-alternative">
      <summary>
        <MapPinned size={17} aria-hidden="true" /> Text alternative to the map
      </summary>
      <div className="map-alternative__body">
        <p>
          From <strong>{getName(route.originId)}</strong> to{" "}
          <strong>{getName(route.destinationId)}</strong>. The route is{" "}
          {route.stepFree ? "step-free" : "not fully step-free"} with a {route.crowdLevel} crowd
          level.
        </p>
        <ol>
          {route.steps.map((step) => (
            <li key={step.id}>{step.instruction}</li>
          ))}
        </ol>
      </div>
    </details>
  );
}
