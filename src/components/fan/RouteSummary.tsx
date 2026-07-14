import { Accessibility, Clock3, Gauge, Route } from "lucide-react";
import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { formatDistance, formatDuration } from "@/lib/utils/formatters";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

type FanRoute = NonNullable<FanAssistanceResponse["route"]>;

interface RouteSummaryProps {
  route: FanRoute;
}

function crowdTone(level: FanRoute["crowdLevel"]): BadgeTone {
  if (level === "low") return "positive";
  if (level === "moderate") return "warning";
  return "critical";
}

export function RouteSummary({ route }: RouteSummaryProps) {
  return (
    <div className="route-summary" aria-label="Route summary">
      <div>
        <Clock3 size={18} aria-hidden="true" />
        <span>Walking time</span>
        <strong>{formatDuration(route.estimatedWalkingMinutes)}</strong>
      </div>
      <div>
        <Route size={18} aria-hidden="true" />
        <span>Distance</span>
        <strong>{formatDistance(route.totalDistanceMeters)}</strong>
      </div>
      <div>
        <Gauge size={18} aria-hidden="true" />
        <span>Crowd level</span>
        <Badge tone={crowdTone(route.crowdLevel)}>{route.crowdLevel}</Badge>
      </div>
      <div>
        <Accessibility size={18} aria-hidden="true" />
        <span>Access</span>
        <Badge tone={route.stepFree ? "positive" : "warning"}>
          {route.stepFree ? "Step-free" : "Includes steps"}
        </Badge>
      </div>
    </div>
  );
}
