import type { FanAssistanceResponse } from "@/lib/ai/schemas";
import { Accessibility, CircleHelp, HeartPulse, Info, Toilet, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type Facility = NonNullable<FanAssistanceResponse["route"]>["nearbyFacilities"][number];

interface NearbyFacilitiesProps {
  facilities: Facility[];
}

function facilityIcon(type: string): LucideIcon {
  const lower = type.toLowerCase();
  if (lower.includes("toilet")) return Toilet;
  if (lower.includes("medical")) return HeartPulse;
  if (lower.includes("assist")) return CircleHelp;
  return Info;
}

export function NearbyFacilities({ facilities }: NearbyFacilitiesProps) {
  return (
    <section className="facility-panel" aria-labelledby="facilities-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Along the way</p>
          <h3 id="facilities-title">Nearby facilities</h3>
        </div>
        <span className="panel-heading__count">{facilities.length}</span>
      </div>
      {facilities.length > 0 ? (
        <ul className="facility-list">
          {facilities.map((facility) => {
            const Icon = facilityIcon(facility.type);
            return (
              <li key={facility.id}>
                <span className="facility-list__icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>{facility.name}</strong>
                  <span>{facility.type}</span>
                </div>
                {facility.accessible ? (
                  <Badge tone="positive">
                    <Accessibility size={12} aria-hidden="true" /> Accessible
                  </Badge>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted-copy">No facilities are listed on this route.</p>
      )}
    </section>
  );
}
