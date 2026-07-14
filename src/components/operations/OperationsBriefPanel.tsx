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

export function OperationsBriefPanel({ state, onRetry }: OperationsBriefPanelProps) {
  const [approvedActions, setApprovedActions] = useState<ReadonlySet<string>>(new Set());
  const brief = state.brief;
  const responseMode = state.status === "ready" ? state.mode : state.status;
  const responseModeLabel = {
    demo: "Demo briefing",
    fallback: "Safe fallback",
    gemini: "Gemini + venue tools",
    loading: "Refreshing",
  }[responseMode];

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
        Operational briefing status: {responseModeLabel}.
      </p>
      <div className="operations-brief__hero">
        <span className="operations-brief__icon">
          {state.status === "loading" ? (
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
          <Badge
            tone={
              brief.riskLevel === "low"
                ? "positive"
                : brief.riskLevel === "moderate"
                  ? "warning"
                  : "critical"
            }
          >
            {brief.riskLevel} risk
          </Badge>
          <Badge tone={responseMode === "gemini" ? "positive" : "neutral"}>
            {responseModeLabel}
          </Badge>
          <span>{Math.round(brief.confidence * 100)}% confidence</span>
        </div>
      </div>

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

      <p className="operations-brief__summary">{brief.summary}</p>
      <div
        className="confidence-track"
        role="progressbar"
        aria-label={`${Math.round(brief.confidence * 100)} percent briefing confidence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(brief.confidence * 100)}
      >
        <span style={{ width: `${Math.round(brief.confidence * 100)}%` }} />
      </div>

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
        {brief.priorityActions.map((action) => {
          const isApproved = approvedActions.has(action.id);
          return (
            <OperationsRecommendation
              key={action.id}
              action={action}
              isApproved={isApproved}
              onApprove={markApproved}
            />
          );
        })}
      </ol>

      <Alert title="Decision support only" tone="info">
        Venue personnel remain responsible for all operational and emergency actions. Approval never
        executes an action automatically.
      </Alert>
    </section>
  );
}
