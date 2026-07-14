import { Clock3 } from "lucide-react";
import type { SimulationTimelineEvent } from "@/lib/domain";
import { Badge } from "@/components/ui/Badge";

interface EventTimelineProps {
  events: readonly SimulationTimelineEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <section className="dashboard-panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Event history</p>
          <h2 id="timeline-title">Operations timeline</h2>
        </div>
        <Clock3 size={19} aria-hidden="true" />
      </div>
      <div
        className="event-timeline-scroll"
        role="region"
        aria-label="Operations event history"
        tabIndex={0}
      >
        <ol className="event-timeline">
          {events.map((event, index) => (
            <li key={event.id}>
              <div className="event-timeline__rail" aria-hidden="true">
                <span />
                {index < events.length - 1 ? <i /> : null}
              </div>
              <time>{event.minute === 0 ? "T±00" : `T+${event.minute}m`}</time>
              <div>
                <strong>{event.label}</strong>
                <p>{event.detail}</p>
              </div>
              <Badge
                tone={
                  event.severity === "critical"
                    ? "critical"
                    : event.severity === "warning"
                      ? "warning"
                      : "info"
                }
              >
                {event.severity}
              </Badge>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
