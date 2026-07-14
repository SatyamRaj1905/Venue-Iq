import { Bot, CheckCircle2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import type { FanAssistanceResponse, SuccessEnvelope } from "@/lib/ai/schemas";
import { getLanguageDirection } from "@/lib/content/languageOptions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AccessibleMapList } from "./AccessibleMapList";
import { FanAlerts } from "./FanAlerts";
import { NearbyFacilities } from "./NearbyFacilities";
import { RouteSteps } from "./RouteSteps";
import { RouteSummary } from "./RouteSummary";
import { StadiumMap } from "./StadiumMap";
import { TransportOptions } from "./TransportOptions";

export type FanResponseState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      response: FanAssistanceResponse;
      mode: SuccessEnvelope<never>["meta"]["mode"];
    }
  | { status: "fallback"; response: FanAssistanceResponse; reason: string; reasonTitle: string };

interface FanResponsePanelProps {
  state: FanResponseState;
  onRetry: () => void;
  onFollowUp: (question: string) => void;
}

function ResponseContent({
  response,
  mode,
  onFollowUp,
}: {
  response: FanAssistanceResponse;
  mode: "gemini" | "demo" | "fallback";
  onFollowUp: (question: string) => void;
}) {
  return (
    <div
      className="fan-response"
      dir={getLanguageDirection(response.language)}
      lang={response.language}
    >
      <Card className="ai-answer" tone="cyan">
        <div className="ai-answer__heading">
          <span className="ai-answer__icon">
            <Bot size={21} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">VenueIQ guidance</p>
            <h2>
              {response.intent === "transport"
                ? "Your grounded transport options"
                : response.intent === "facility"
                  ? "Your grounded facility guidance"
                  : "Your grounded route"}
            </h2>
          </div>
          <div className="ai-answer__status">
            <Badge tone={mode === "gemini" ? "info" : "warning"}>
              {mode === "gemini"
                ? "Gemini + tools"
                : mode === "demo"
                  ? "Demo response"
                  : "Safe fallback"}
            </Badge>
            <span>{Math.round(response.confidence * 100)}% confidence</span>
          </div>
        </div>
        <p className="ai-answer__summary">{response.summary}</p>
        {response.accessibilityNotes.length > 0 ? (
          <ul className="ai-answer__notes" aria-label="Accessibility notes">
            {response.accessibilityNotes.map((note) => (
              <li key={note}>
                <CheckCircle2 size={15} aria-hidden="true" /> {note}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {response.route ? (
        <>
          <RouteSummary route={response.route} />
          <div className="fan-map-layout">
            <Card padding="small">
              <StadiumMap route={response.route} />
              <AccessibleMapList route={response.route} />
            </Card>
            <Card padding="small">
              <RouteSteps route={response.route} />
            </Card>
          </div>
          <div className="fan-detail-grid">
            <Card padding="small">
              <NearbyFacilities facilities={response.route.nearbyFacilities} />
            </Card>
            <Card padding="small">
              <FanAlerts alerts={response.alerts} />
            </Card>
          </div>
        </>
      ) : (
        <Alert title="No route was needed" tone="info">
          The response contains general venue guidance only.
        </Alert>
      )}

      {response.transportOptions && response.transportOptions.length > 0 ? (
        <Card padding="small">
          <TransportOptions options={response.transportOptions} />
        </Card>
      ) : null}

      <Card className="follow-up" padding="small">
        <div>
          <Sparkles size={18} aria-hidden="true" />
          <strong>Continue with a trusted follow-up</strong>
        </div>
        <div className="suggestion-chips">
          {response.nextSteps.map((question) => (
            <button type="button" key={question} onClick={() => onFollowUp(question)}>
              {question}
            </button>
          ))}
        </div>
      </Card>
      {response.handoffRequired ? (
        <Alert title="Venue staff handoff recommended" tone="warning">
          Ask the nearest assistance host to confirm the next step before continuing.
        </Alert>
      ) : null}
    </div>
  );
}

export function FanResponsePanel({ state, onRetry, onFollowUp }: FanResponsePanelProps) {
  if (state.status === "idle") {
    return (
      <Card className="fan-empty-card">
        <EmptyState
          title="Your route will appear here"
          description="Choose your location, destination and preferences. VenueIQ will explain a route grounded in the simulated venue map."
          icon={ShieldCheck}
        />
      </Card>
    );
  }

  if (state.status === "loading") {
    return (
      <Card className="fan-loading-card">
        <div className="loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <LoadingSkeleton label="Finding a grounded stadium route" lines={5} announce={false} />
        <p className="loading-caption">Checking access, crowd and route conditions…</p>
      </Card>
    );
  }

  if (state.status === "fallback") {
    return (
      <div className="stack">
        <Alert
          title={state.reasonTitle}
          tone="warning"
          actions={
            <Button size="small" variant="secondary" onClick={onRetry}>
              <RefreshCw size={15} aria-hidden="true" /> Retry
            </Button>
          }
        >
          {state.reason} VenueIQ is showing a deterministic route so you can keep moving safely.
        </Alert>
        <ResponseContent response={state.response} mode="fallback" onFollowUp={onFollowUp} />
      </div>
    );
  }

  return <ResponseContent response={state.response} mode={state.mode} onFollowUp={onFollowUp} />;
}
