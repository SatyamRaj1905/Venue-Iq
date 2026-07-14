import { Accessibility, Clock3, TrainFront } from "lucide-react";

import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { Badge } from "@/components/ui/Badge";

interface TransportOptionsProps {
  options: NonNullable<FanAssistanceResponse["transportOptions"]>;
}

export function TransportOptions({ options }: TransportOptionsProps) {
  return (
    <section className="transport-options" aria-labelledby="transport-options-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Trusted transport data</p>
          <h3 id="transport-options-title">Transport options</h3>
        </div>
        <Badge tone="info">Simulated</Badge>
      </div>
      <ol>
        {options.map((option) => (
          <li key={option.id}>
            <span className="transport-options__icon" aria-hidden="true">
              <TrainFront size={17} />
            </span>
            <div>
              <div className="transport-options__heading">
                <strong>{option.name}</strong>
                <Badge tone={option.status === "on-time" ? "positive" : "warning"}>
                  {option.status.replaceAll("-", " ")}
                </Badge>
              </div>
              <p>{option.note}</p>
              <span>
                <Clock3 size={13} aria-hidden="true" /> {option.totalJourneyMinutes} min total ·{" "}
                {option.waitMinutes} min wait
              </span>
              {option.accessible ? (
                <span>
                  <Accessibility size={13} aria-hidden="true" /> Step-free service
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
