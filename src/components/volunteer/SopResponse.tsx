import { Bot, BookOpenCheck, RefreshCw, ShieldCheck } from "lucide-react";
import type { SuccessEnvelope, VolunteerAssistanceResponse } from "@/lib/ai/schemas";
import { getLanguageDirection } from "@/lib/content/languageOptions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ActionChecklist } from "./ActionChecklist";
import { EscalationCard } from "./EscalationCard";

export type VolunteerResponseState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      response: VolunteerAssistanceResponse;
      mode: SuccessEnvelope<never>["meta"]["mode"];
    }
  | { status: "fallback"; response: VolunteerAssistanceResponse; reason: string };

interface SopResponseProps {
  state: VolunteerResponseState;
  onRetry: () => void;
}

export function SopResponse({ state, onRetry }: SopResponseProps) {
  if (state.status === "idle") {
    return (
      <Card className="volunteer-empty">
        <EmptyState
          title="Trusted steps will appear here"
          description="Describe the situation to retrieve a concise checklist from the selected venue SOP."
          icon={BookOpenCheck}
        />
      </Card>
    );
  }

  if (state.status === "loading") {
    return (
      <Card className="volunteer-loading">
        <LoadingSkeleton label="Retrieving trusted venue procedure" lines={5} announce={false} />
        <p className="loading-caption">Matching your role, topic and language…</p>
      </Card>
    );
  }

  const { response } = state;
  const mode = state.status === "fallback" ? "fallback" : state.mode;

  return (
    <div
      className="volunteer-response stack"
      dir={getLanguageDirection(response.language)}
      lang={response.language}
    >
      {state.status === "fallback" ? (
        <Alert
          title="Offline-safe procedure"
          tone="warning"
          actions={
            <Button size="small" variant="secondary" onClick={onRetry}>
              <RefreshCw size={14} aria-hidden="true" /> Retry
            </Button>
          }
        >
          {state.reason} This response is from the trusted local SOP fixture.
        </Alert>
      ) : null}
      <Card className="sop-answer" tone="cyan">
        <div className="sop-answer__heading">
          <span>
            <Bot size={21} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Grounded venue SOP</p>
            <h2>{response.sopTitle}</h2>
          </div>
          <Badge tone={mode === "gemini" ? "info" : "warning"}>
            {mode === "gemini" ? "Gemini + SOP" : mode === "demo" ? "Demo mode" : "Fallback"}
          </Badge>
        </div>
        <p>{response.summary}</p>
        <div className="sop-answer__confidence">
          <ShieldCheck size={15} aria-hidden="true" /> {Math.round(response.confidence * 100)}%
          confidence · simulated venue content
        </div>
      </Card>
      <div className="volunteer-response__grid">
        <Card padding="small">
          <ActionChecklist key={response.summary} items={response.checklist} />
        </Card>
        <Card padding="small">
          <EscalationCard response={response} />
        </Card>
      </div>
    </div>
  );
}
