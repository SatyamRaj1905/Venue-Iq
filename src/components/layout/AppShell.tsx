import type { ReactNode } from "react";
import { cx } from "@/lib/utils/classNames";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
}

export function AppShell({ children, className, width = "default" }: AppShellProps) {
  return <div className={cx("app-shell", `app-shell--${width}`, className)}>{children}</div>;
}
