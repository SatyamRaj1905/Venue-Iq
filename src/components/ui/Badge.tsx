import type { ReactNode } from "react";
import { Circle, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/utils/classNames";

export type BadgeTone = "neutral" | "info" | "positive" | "warning" | "critical";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  showIcon?: boolean;
  className?: string;
}

const icons = {
  neutral: Circle,
  info: Info,
  positive: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
} satisfies Record<BadgeTone, typeof Circle>;

export function Badge({ children, tone = "neutral", showIcon = true, className }: BadgeProps) {
  const Icon = icons[tone];

  return (
    <span className={cx("badge", `badge--${tone}`, className)}>
      {showIcon ? <Icon size={13} aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
