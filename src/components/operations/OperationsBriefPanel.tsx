"use client";

import { useState } from "react";
import { Bot, LoaderCircle, RefreshCw, ShieldAlert } from "lucide-react";
import type { OperationsBrief, SuccessEnvelope } from "@/lib/ai/schemas";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OperationsRecommendation } from "./OperationsRecommendation";

export type BriefState =
  | { status: "ready"; brief: OperationsBrief; mode: SuccessEnvelope<never>["meta"]["mode"] }
  | { status: "loading"; brief: OperationsBrief }
  | { status: "fallback"; brief: OperationsBrief; reason: string };

interface OperationsBriefPanelProps {
  state: BriefState;
  onRetry: () => void;
}

type BriefResponseMode = SuccessEnvelope<never>["meta"]["mode"] | "loading";

const responseModeLabels: Readonly<Record<BriefResponseMode, string>> = {
  demo: "Demo briefing",
  fallback: "Safe fallback",
  gemini: "Gemini + venue tools",
  loading: "Refreshing",
};

function getResponseMode(state: BriefState): BriefResponseMode {
  return state.status === "ready" ? state.mode : state.status;
}

function BriefHero({
  brief,
  isLoading,
  responseMode,
}: {
  brief: OperationsBrief;
  isLoading: boolean;
  responseMode: BriefResponseMode;
}) {
  const riskTone =
    brief.riskLevel === "low"
      ? "positive"
      : brief.riskLevel === "moderate"
        ? "warning"
        : "critical";
  return (
    <div className="operations-brief__hero">
      <span className="operations-brief__icon">
        {isLoading ? (
          <LoaderCircle className="spin" size={23} aria-hidden="true" />
        ) : (
          <Bot size={23} aria-hidden="true" />
        )}
      </span>
      <div>
        <p className="eyebrow">Grounded operational intelligence</p>
        <h2 id="brief-title">AI operational briefing</h2>
      </div>
      <div className="operations-brief__meta">
        <Badge tone={riskTone}>{brief.riskLevel} risk</Badge>
        <Badge tone={responseMode === "gemini" ? "positive" : "neutral"}>
          {responseModeLabels[responseMode]}
        </Badge>
        <span>{Math.round(brief.confidence * 100)}% confidence</span>
      </div>
    </div>
  );
}

function BriefFallbackNotices({ state, onRetry }: OperationsBriefPanelProps) {
  return (
    <>
      {state.status === "fallback" ? (
        <Alert
          title="Using deterministic briefing"
          tone="warning"
          actions={
            <Button size="small" variant="secondary" onClick={onRetry}>
              <RefreshCw size={14} aria-hidden="true" /> Retry
            </Button>
          }
        >
          {state.reason}
        </Alert>
      ) : null}
      {state.status === "ready" && state.mode === "fallback" ? (
        <Alert title="Using deterministic briefing" tone="warning">
          The AI service was unavailable, so this briefing was generated from trusted venue rules
          and live simulation data.
        </Alert>
      ) : null}
    </>
  );
}

function ConfidenceTrack({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  return (
    <div
      className="confidence-track"
      role="progressbar"
      aria-label={`${percentage} percent briefing confidence`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

function RecommendedActions({
  brief,
  approvedActions,
  onApprove,
}: {
  brief: OperationsBrief;
  approvedActions: ReadonlySet<string>;
  onApprove: (actionId: string) => void;
}) {
  return (
    <>
      <div className="panel-heading operations-brief__actions-heading">
        <div>
          <p className="eyebrow">Prioritized for review</p>
          <h3>Recommended actions</h3>
        </div>
        <Badge tone="warning">
          <ShieldAlert size={13} aria-hidden="true" /> Human approval required
        </Badge>
      </div>
      <ol className="recommendation-list">
        {brief.priorityActions.map((action) => (
          <OperationsRecommendation
            key={action.id}
            action={action}
            isApproved={approvedActions.has(action.id)}
            onApprove={onApprove}
          />
        ))}
      </ol>
    </>
  );
}

export function OperationsBriefPanel({ state, onRetry }: OperationsBriefPanelProps) {
  const [approvedActions, setApprovedActions] = useState<ReadonlySet<string>>(new Set());
  const brief = state.brief;
  const responseMode = getResponseMode(state);

  function markApproved(actionId: string): void {
    setApprovedActions((current) => new Set([...current, actionId]));
  }

  return (
    <section
      className="dashboard-panel operations-brief"
      aria-labelledby="brief-title"
      aria-busy={state.status === "loading"}
    >
      <p className="sr-only" aria-live="polite">
        Operational briefing status: {responseModeLabels[responseMode]}.
      </p>
      <BriefHero brief={brief} isLoading={state.status === "loading"} responseMode={responseMode} />
      <BriefFallbackNotices state={state} onRetry={onRetry} />

      <p className="operations-brief__summary">{brief.summary}</p>
      <ConfidenceTrack confidence={brief.confidence} />
      <RecommendedActions
        brief={brief}
        approvedActions={approvedActions}
        onApprove={markApproved}
      />

      <Alert title="Decision support only" tone="info">
        Venue personnel remain responsible for all operational and emergency actions. Approval never
        executes an action automatically.
      </Alert>
    </section>
  );
}
