import type { LucideIcon } from "lucide-react";
import { Compass } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Compass, actions }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h2 className="empty-state__title">{title}</h2>
      <p>{description}</p>
      {actions ? <div className="empty-state__actions">{actions}</div> : null}
    </div>
  );
}
