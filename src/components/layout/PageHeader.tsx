import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  statusTone?: BadgeTone;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  status,
  statusTone = "info",
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        <div className="page-header__eyebrow-row">
          <p className="eyebrow">{eyebrow}</p>
          {status ? <Badge tone={statusTone}>{status}</Badge> : null}
        </div>
        <h1>{title}</h1>
        <p className="page-header__description">{description}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
