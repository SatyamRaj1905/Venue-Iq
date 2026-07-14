import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

interface FanAlertsProps {
  alerts: FanAssistanceResponse["alerts"];
}

function alertTone(severity: FanAssistanceResponse["alerts"][number]["severity"]): BadgeTone {
  if (severity === "low") return "positive";
  if (severity === "moderate") return "warning";
  return "critical";
}

export function FanAlerts({ alerts }: FanAlertsProps) {
  return (
    <section className="fan-alerts" aria-labelledby="fan-alerts-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live context</p>
          <h3 id="fan-alerts-title">Active alerts</h3>
        </div>
        <Badge tone={alerts.length > 0 ? "warning" : "positive"}>{alerts.length} active</Badge>
      </div>
      {alerts.length > 0 ? (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Badge tone={alertTone(alert.severity)}>{alert.severity}</Badge>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              <span className="simulated-label">Simulated</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-copy">No active alerts affect this route.</p>
      )}
    </section>
  );
}
