import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { Accessibility, ArrowDown, CheckCircle2, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatDuration } from "@/lib/utils/formatters";

type FanRoute = NonNullable<FanAssistanceResponse["route"]>;

interface RouteStepsProps {
  route: FanRoute;
}

export function RouteSteps({ route }: RouteStepsProps) {
  const alreadyAtDestination = route.steps.length === 0;

  return (
    <section className="route-steps" aria-labelledby="route-steps-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Turn by turn</p>
          <h3 id="route-steps-title">Your route</h3>
        </div>
        <Badge tone={alreadyAtDestination ? "positive" : "info"}>
          {alreadyAtDestination ? "Already there" : `${route.steps.length} steps`}
        </Badge>
      </div>
      {alreadyAtDestination ? (
        <div className="route-steps__arrived" role="status">
          <CheckCircle2 aria-hidden="true" size={24} />
          <div>
            <strong>You’re already at your destination.</strong>
            <p>No walking directions are needed.</p>
          </div>
        </div>
      ) : (
        <ol>
          {route.steps.map((step, index) => (
            <li key={step.id}>
              <div className="route-step__rail" aria-hidden="true">
                <span>{index + 1}</span>
                {index < route.steps.length - 1 ? (
                  <i>
                    <ArrowDown size={13} />
                  </i>
                ) : null}
              </div>
              <div className="route-step__content">
                <p>{step.instruction}</p>
                <div className="route-step__meta">
                  <span>
                    <Footprints size={14} aria-hidden="true" />{" "}
                    {formatDistance(step.distanceMeters)}
                  </span>
                  <span>{formatDuration(step.estimatedMinutes)}</span>
                  <Badge tone={step.crowdLevel === "low" ? "positive" : "warning"}>
                    {step.crowdLevel} crowd
                  </Badge>
                </div>
                {step.accessibilityNotes.map((note) => (
                  <p className="route-step__note" key={note}>
                    <Accessibility size={14} aria-hidden="true" /> {note}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
