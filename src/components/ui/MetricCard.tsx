import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { Badge, type BadgeTone } from "./Badge";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  trend?: "up" | "down" | "steady";
  trendLabel?: string;
}

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  steady: Minus,
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "info",
  trend = "steady",
  trendLabel,
}: MetricCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <Card className="metric-card" padding="small">
      <div className="metric-card__top">
        <span className="metric-card__icon">
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="metric-card__label">{label}</span>
      </div>
      <p className="metric-card__value">{value}</p>
      <div className="metric-card__footer">
        <span>{detail}</span>
        {trendLabel ? (
          <Badge tone={tone} showIcon={false}>
            <TrendIcon size={12} aria-hidden="true" /> {trendLabel}
          </Badge>
        ) : null}
      </div>
    </Card>
  );
}
