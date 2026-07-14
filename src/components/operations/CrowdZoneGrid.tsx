import { ArrowRight, TriangleAlert, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import type { SimulationState, ZoneStatus } from "@/lib/domain";
import { STADIUM_ZONES } from "@/lib/domain";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

interface CrowdZoneGridProps {
  snapshot: SimulationState;
}

function statusTone(status: ZoneStatus): BadgeTone {
  if (status === "normal") return "positive";
  if (status === "busy") return "warning";
  return "critical";
}

function zoneName(zoneId: string): string {
  return STADIUM_ZONES.find((zone) => zone.id === zoneId)?.name ?? zoneId;
}

export function CrowdZoneGrid({ snapshot }: CrowdZoneGridProps) {
  const affectedZoneIds = new Set(snapshot.affectedZoneIds);

  return (
    <section className="dashboard-panel crowd-zones" aria-labelledby="crowd-zones-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Digital twin</p>
          <h2 id="crowd-zones-title">Zone crowd status</h2>
        </div>
        <Badge tone="info">{snapshot.zones.length} zones</Badge>
      </div>
      <div className="zone-map" role="region" aria-label="Crowd zone cards" tabIndex={0}>
        {snapshot.zones.map((zone) => {
          const isAffected = affectedZoneIds.has(zone.zoneId);
          return (
            <div
              className={`zone-tile zone-tile--${zone.status}${isAffected ? " zone-tile--affected" : ""}`}
              key={zone.zoneId}
              style={
                { "--zone-level": `${Math.min(100, zone.occupancyPercentage)}%` } as CSSProperties
              }
            >
              <span className="zone-tile__fill" aria-hidden="true" />
              <div>
                <strong>{zoneName(zone.zoneId)}</strong>
                <span>{Math.round(zone.occupancyPercentage)}% occupied</span>
                {isAffected ? (
                  <span className="zone-tile__impact">
                    <TriangleAlert size={12} aria-hidden="true" /> Scenario affected
                  </span>
                ) : null}
              </div>
              <Badge tone={statusTone(zone.status)}>{zone.status}</Badge>
            </div>
          );
        })}
      </div>
      <div className="table-scroll" role="region" aria-label="Detailed crowd metrics" tabIndex={0}>
        <table className="data-table">
          <caption className="sr-only">
            Accessible table of crowd conditions by stadium zone
          </caption>
          <thead>
            <tr>
              <th scope="col">Zone</th>
              <th scope="col">Occupancy</th>
              <th scope="col">Queue</th>
              <th scope="col">Risk</th>
              <th scope="col">Status</th>
              <th scope="col">Scenario impact</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.zones.map((zone) => {
              const isAffected = affectedZoneIds.has(zone.zoneId);
              return (
                <tr key={zone.zoneId}>
                  <th scope="row">
                    <UsersRound size={15} aria-hidden="true" /> {zoneName(zone.zoneId)}
                  </th>
                  <td>{Math.round(zone.occupancyPercentage)}%</td>
                  <td>{Math.round(zone.queueMinutes)} min</td>
                  <td>
                    {zone.riskScore} <ArrowRight size={13} aria-hidden="true" />
                  </td>
                  <td>
                    <Badge tone={statusTone(zone.status)}>{zone.status}</Badge>
                  </td>
                  <td>
                    {isAffected ? (
                      <span className="data-table__impact">
                        <TriangleAlert size={13} aria-hidden="true" /> Affected
                      </span>
                    ) : (
                      "Baseline"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
