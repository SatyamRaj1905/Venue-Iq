import { Check, ChevronRight, ClipboardCheck } from "lucide-react";
import type { OperationsAction } from "@/lib/ai/schemas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OperationsRecommendationProps {
  action: OperationsAction;
  isApproved: boolean;
  onApprove: (actionId: string) => void;
}

export function OperationsRecommendation({
  action,
  isApproved,
  onApprove,
}: OperationsRecommendationProps) {
  return (
    <li>
      <span className="recommendation-list__priority">P{action.priority}</span>
      <div className="recommendation-list__content">
        <div className="recommendation-list__title">
          <h4>{action.title}</h4>
          <Badge tone={isApproved ? "positive" : "warning"}>
            {isApproved ? "Reviewed" : "Pending"}
          </Badge>
        </div>
        <p>{action.description}</p>
        <div className="recommendation-list__owner">
          <ClipboardCheck size={14} aria-hidden="true" /> Suggested team:{" "}
          <strong>{action.ownerTeam}</strong> · Zone: <strong>{action.affectedZone}</strong> ·{" "}
          {Math.round(action.confidence * 100)}% action confidence
        </div>
        <details>
          <summary>
            Evidence and rationale <ChevronRight size={14} aria-hidden="true" />
          </summary>
          <div>
            <p>{action.rationale}</p>
            <strong>Supporting metrics</strong>
            <ul>
              {action.supportingMetrics.map((metric) => (
                <li key={metric}>{metric}</li>
              ))}
            </ul>
            <strong>Evidence</strong>
            <ul>
              {action.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>
      <Button
        size="small"
        variant={isApproved ? "quiet" : "secondary"}
        disabled={isApproved}
        onClick={() => onApprove(action.id)}
        aria-label={`Mark ${action.title} as reviewed and approved`}
      >
        <Check size={14} aria-hidden="true" /> {isApproved ? "Reviewed" : "Approve"}
      </Button>
    </li>
  );
}
