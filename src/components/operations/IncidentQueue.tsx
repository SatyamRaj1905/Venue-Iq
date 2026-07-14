import { CircleAlert, RadioTower } from "lucide-react";
import type { IncidentSeverity, OperationalIncident } from "@/lib/domain";
import { STADIUM_ZONES } from "@/lib/domain";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

interface IncidentQueueProps {
  incidents: readonly OperationalIncident[];
}

function tone(severity: IncidentSeverity): BadgeTone {
  if (severity === "low") return "info";
  if (severity === "moderate") return "warning";
  return "critical";
}

function zones(ids: readonly string[]): string {
  return ids.map((id) => STADIUM_ZONES.find((zone) => zone.id === id)?.name ?? id).join(", ");
}

export function IncidentQueue({ incidents }: IncidentQueueProps) {
  return (
    <section className="dashboard-panel" aria-labelledby="incident-queue-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Triage</p>
          <h2 id="incident-queue-title">Active incident queue</h2>
        </div>
        <Badge tone={incidents.length > 0 ? "warning" : "positive"}>{incidents.length} open</Badge>
      </div>
      {incidents.length > 0 ? (
        <ol className="incident-list">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <span className="incident-list__icon">
                <CircleAlert size={18} aria-hidden="true" />
              </span>
              <div className="incident-list__copy">
                <div>
                  <strong>{incident.title}</strong>
                  <Badge tone={tone(incident.severity)}>{incident.severity}</Badge>
                </div>
                <p>{zones(incident.zoneIds)}</p>
                <span>
                  <RadioTower size={13} aria-hidden="true" />{" "}
                  {incident.escalationRole.replaceAll("-", " ")} · priority {incident.priorityScore}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="inline-empty">
          <span>
            <RadioTower size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>No active incidents</strong>
            <p>Routine venue monitoring remains active.</p>
          </div>
        </div>
      )}
    </section>
  );
}
