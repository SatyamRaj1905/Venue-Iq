import { BusFront, Droplets, Leaf, Recycle, Zap } from "lucide-react";
import type { SustainabilitySnapshot } from "@/lib/domain";
import { Badge } from "@/components/ui/Badge";

interface SustainabilityPanelProps {
  sustainability: SustainabilitySnapshot;
}

export function SustainabilityPanel({ sustainability }: SustainabilityPanelProps) {
  const metrics = [
    {
      label: "Public transport",
      value: `${Math.round(sustainability.publicTransportUsagePercentage)}%`,
      icon: BusFront,
    },
    {
      label: "Water refilled",
      value: `${sustainability.waterRefillLiters.toLocaleString()} L`,
      icon: Droplets,
    },
    {
      label: "Waste capacity",
      value: `${Math.round(sustainability.wasteBinUtilizationPercentage)}%`,
      icon: Recycle,
    },
    { label: "Energy trend", value: sustainability.energyTrend, icon: Zap },
  ];

  return (
    <section
      className="dashboard-panel sustainability-panel"
      aria-labelledby="sustainability-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Resource pulse</p>
          <h2 id="sustainability-title">Sustainability snapshot</h2>
        </div>
        <Badge tone={sustainability.status === "action-required" ? "critical" : "positive"}>
          {sustainability.status.replaceAll("-", " ")}
        </Badge>
      </div>
      <div className="sustainability-panel__hero">
        <span>
          <Leaf size={22} aria-hidden="true" />
        </span>
        <div>
          <strong>
            {Math.round(sustainability.estimatedEmissionsAvoidedKilograms).toLocaleString()} kg
          </strong>
          <p>estimated emissions avoided</p>
        </div>
      </div>
      <dl className="sustainability-list">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <dt>
              <Icon size={15} aria-hidden="true" /> {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="simulated-label">Seeded demonstration estimate</p>
    </section>
  );
}
