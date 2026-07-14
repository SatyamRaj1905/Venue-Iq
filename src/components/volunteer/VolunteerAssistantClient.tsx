"use client";

import { useState } from "react";
import type {
  SuccessEnvelope,
  VolunteerAssistanceResponse,
  VolunteerRequest,
} from "@/lib/ai/schemas";
import type { SupportedLanguage } from "@/lib/content/languageOptions";
import { createVolunteerFallback } from "@/lib/content/volunteerFallback";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SopResponse, type VolunteerResponseState } from "./SopResponse";
import { VolunteerForm } from "./VolunteerForm";
import { Badge } from "@/components/ui/Badge";
import { scenarioOptions } from "@/lib/content/scenarioOptions";
import { useSharedScenario } from "@/components/layout/useSharedScenario";

const initialQuestion =
  "A family speaking Arabic is looking for the nearest accessible entrance. What should I do?";

function responseAnnouncement(state: VolunteerResponseState): string {
  switch (state.status) {
    case "idle":
      return "";
    case "loading":
      return "Retrieving the trusted venue procedure.";
    case "ready":
      return `Volunteer guidance is ready in ${state.response.language}.`;
    case "fallback":
      return `The live assistant is unavailable. Trusted fallback guidance is ready in ${state.response.language}.`;
  }
}

export function VolunteerAssistantClient() {
  const [scenario] = useSharedScenario();
  const [role, setRole] = useState<VolunteerRequest["role"]>("wayfinding");
  const [topic, setTopic] = useState<VolunteerRequest["topic"]>("accessible-entry");
  const [question, setQuestion] = useState(initialQuestion);
  const [language, setLanguage] = useState<SupportedLanguage>("ar");
  const [validationError, setValidationError] = useState<string>();
  const [responseState, setResponseState] = useState<VolunteerResponseState>({ status: "idle" });

  async function getGuidance(): Promise<void> {
    if (question.trim().length < 5) {
      setValidationError("Describe the situation in at least a few words.");
      return;
    }
    setValidationError(undefined);
    setResponseState({ status: "loading" });
    const request: VolunteerRequest = {
      question: question.trim(),
      language,
      role,
      topic,
      scenario,
    };
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 14_000);

    try {
      const response = await fetch("/api/ai/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) {
        setResponseState({
          status: "fallback",
          response: createVolunteerFallback(request.language, request.topic, request.scenario),
          reason:
            response.status === 429
              ? "The live assistant request limit was reached."
              : "Gemini is temporarily unavailable.",
        });
        return;
      }
      const payload = (await response.json()) as SuccessEnvelope<VolunteerAssistanceResponse>;
      setResponseState({ status: "ready", response: payload.data, mode: payload.meta.mode });
    } catch (error: unknown) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setResponseState({
        status: "fallback",
        response: createVolunteerFallback(request.language, request.topic, request.scenario),
        reason: isOffline
          ? "This device appears to be offline."
          : isTimeout
            ? "The request was safely cancelled after 14 seconds."
            : "The venue service could not be reached.",
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function submit(): void {
    void getGuidance();
  }

  const activeScenario =
    scenarioOptions.find((option) => option.id === scenario)?.label ?? scenario;

  return (
    <div className="stack">
      <div className="shared-scenario">
        <Badge tone={scenario === "normal" ? "positive" : "warning"}>
          Shared scenario: {activeScenario}
        </Badge>
        <span>Use current venue alerts when guiding guests</span>
      </div>
      <div className="volunteer-workspace">
        <div className="stack">
          <Alert title="Do not improvise during emergencies" tone="critical">
            Contact the venue emergency team immediately. This assistant supports procedure recall
            and translation; it does not replace emergency command.
          </Alert>
          <Card padding="large">
            <VolunteerForm
              role={role}
              topic={topic}
              question={question}
              language={language}
              isLoading={responseState.status === "loading"}
              validationError={validationError}
              onRoleChange={setRole}
              onTopicChange={setTopic}
              onQuestionChange={setQuestion}
              onLanguageChange={setLanguage}
              onSubmit={submit}
            />
          </Card>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {responseAnnouncement(responseState)}
        </p>
        <div aria-busy={responseState.status === "loading"}>
          <SopResponse state={responseState} onRetry={submit} />
        </div>
      </div>
    </div>
  );
}
