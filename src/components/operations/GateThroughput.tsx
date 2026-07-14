import { DoorOpen } from "lucide-react";
import type { SimulationState, ZoneStatus } from "@/lib/domain";
import { STADIUM_NODES } from "@/lib/domain";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

interface GateThroughputProps {
  gates: SimulationState["gates"];
}

function gateName(nodeId: string): string {
  return STADIUM_NODES.find((node) => node.id === nodeId)?.name ?? nodeId;
}

function tone(status: ZoneStatus): BadgeTone {
  if (status === "normal") return "positive";
  if (status === "busy") return "warning";
  return "critical";
}

export function GateThroughput({ gates }: GateThroughputProps) {
  const maximum = Math.max(...gates.map((gate) => gate.throughputPerHour), 1);

  return (
    <section className="dashboard-panel" aria-labelledby="gate-throughput-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Entry flow</p>
          <h2 id="gate-throughput-title">Gate throughput</h2>
        </div>
        <DoorOpen size={19} aria-hidden="true" />
      </div>
      <ul className="throughput-list">
        {gates.map((gate) => (
          <li key={gate.gateNodeId}>
            <div className="throughput-list__heading">
              <strong>{gateName(gate.gateNodeId)}</strong>
              <Badge tone={tone(gate.status)}>
                {Math.round(gate.estimatedQueueMinutes)} min queue
              </Badge>
            </div>
            <div
              className="throughput-bar"
              role="progressbar"
              aria-label={`${Math.round(gate.throughputPerHour)} people per hour`}
              aria-valuemin={0}
              aria-valuemax={Math.round(maximum)}
              aria-valuenow={Math.round(gate.throughputPerHour)}
            >
              <span style={{ width: `${Math.round((gate.throughputPerHour / maximum) * 100)}%` }} />
            </div>
            <span>{Math.round(gate.throughputPerHour).toLocaleString()} people / hour</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
