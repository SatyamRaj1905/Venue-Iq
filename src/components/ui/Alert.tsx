import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/utils/classNames";

type AlertTone = "info" | "positive" | "warning" | "critical";

interface AlertProps {
  title: string;
  children?: ReactNode;
  tone?: AlertTone;
  className?: string;
  live?: boolean;
  actions?: ReactNode;
}

const icons = {
  info: Info,
  positive: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
} satisfies Record<AlertTone, typeof Info>;

export function Alert({
  title,
  children,
  tone = "info",
  className,
  live = false,
  actions,
}: AlertProps) {
  const Icon = icons[tone];

  return (
    <div
      className={cx("alert", `alert--${tone}`, className)}
      role={tone === "critical" ? "alert" : undefined}
      aria-live={live && tone !== "critical" ? "polite" : undefined}
    >
      <Icon className="alert__icon" size={19} aria-hidden="true" />
      <div className="alert__body">
        <p className="alert__title">{title}</p>
        {children ? <div className="alert__copy">{children}</div> : null}
      </div>
      {actions ? <div className="alert__actions">{actions}</div> : null}
    </div>
  );
}
