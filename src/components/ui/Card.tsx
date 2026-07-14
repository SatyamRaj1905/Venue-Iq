import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils/classNames";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: "default" | "cyan" | "lime" | "amber" | "critical";
  padding?: "none" | "small" | "medium" | "large";
}

export function Card({
  children,
  className,
  tone = "default",
  padding = "medium",
  ...props
}: CardProps) {
  return (
    <div className={cx("card", `card--${tone}`, `card--padding-${padding}`, className)} {...props}>
      {children}
    </div>
  );
}
