import { ArrowUpRight, Radio, ShieldAlert, UserRoundCheck } from "lucide-react";
import type { VolunteerAssistanceResponse } from "@/lib/ai/schemas";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

interface EscalationCardProps {
  response: VolunteerAssistanceResponse;
}

export function EscalationCard({ response }: EscalationCardProps) {
  return (
    <section className="escalation-card" aria-labelledby="escalation-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Safe handoff</p>
          <h3 id="escalation-title">Escalation</h3>
        </div>
        <Badge tone={response.escalationRequired ? "warning" : "positive"}>
          {response.escalationRequired ? "Required" : "Monitor"}
        </Badge>
      </div>
      <div className="contact-role">
        <span>
          <UserRoundCheck size={21} aria-hidden="true" />
        </span>
        <div>
          <small>Contact role</small>
          <strong>{response.contactRole}</strong>
        </div>
        <ArrowUpRight size={18} aria-hidden="true" />
      </div>
      <p className="escalation-card__reason">
        <Radio size={16} aria-hidden="true" /> {response.escalationReason}
      </p>
      <Alert title="Your authority boundary" tone="warning">
        <ShieldAlert size={14} aria-hidden="true" /> {response.authorityBoundary}
      </Alert>
    </section>
  );
}
