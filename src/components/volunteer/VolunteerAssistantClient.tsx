"use client";

import { useState } from "react";
import type {
  SuccessEnvelope,
  VolunteerAssistanceResponse,
  VolunteerRequest,
} from "@/lib/ai/schemas";
import type { SupportedLanguage } from "@/lib/content/languageOptions";
import { createVolunteerFallback } from "@/lib/content/volunteerFallback";
import { postJson, type PostJsonFailure, type RuntimeSchema } from "@/lib/http/postJson";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SopResponse, type VolunteerResponseState } from "./SopResponse";
import { VolunteerForm } from "./VolunteerForm";
import { Badge } from "@/components/ui/Badge";
import { scenarioOptions } from "@/lib/content/scenarioOptions";
import { useSharedScenario } from "@/components/layout/useSharedScenario";

const initialQuestion =
  "A family speaking Arabic is looking for the nearest accessible entrance. What should I do?";

async function loadVolunteerEnvelopeSchema(): Promise<
  RuntimeSchema<SuccessEnvelope<VolunteerAssistanceResponse>>
> {
  const { successEnvelopeSchema, volunteerAssistanceResponseSchema } =
    await import("@/lib/ai/schemas");
  return successEnvelopeSchema(volunteerAssistanceResponseSchema);
}

function volunteerFailureReason(failure: PostJsonFailure): string {
  if (failure.kind === "http-error" && failure.status === 429) {
    return "The live assistant request limit was reached.";
  }
  if (failure.kind === "timeout") {
    return "The request was safely cancelled after 14 seconds.";
  }
  if (failure.kind === "invalid-response") {
    return "The live response could not be validated, so trusted local guidance is shown.";
  }
  if (failure.kind === "network-error") {
    return typeof navigator !== "undefined" && !navigator.onLine
      ? "This device appears to be offline."
      : "The venue service could not be reached.";
  }
  return "Gemini is temporarily unavailable.";
}

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

interface VolunteerAssistantViewProps {
  readonly scenario: VolunteerRequest["scenario"];
  readonly activeScenario: string;
  readonly role: VolunteerRequest["role"];
  readonly topic: VolunteerRequest["topic"];
  readonly question: string;
  readonly language: SupportedLanguage;
  readonly validationError: string | undefined;
  readonly responseState: VolunteerResponseState;
  readonly onRoleChange: (role: VolunteerRequest["role"]) => void;
  readonly onTopicChange: (topic: VolunteerRequest["topic"]) => void;
  readonly onQuestionChange: (question: string) => void;
  readonly onLanguageChange: (language: SupportedLanguage) => void;
  readonly onSubmit: () => void;
}

function VolunteerAssistantView(props: VolunteerAssistantViewProps) {
  const isLoading = props.responseState.status === "loading";
  return (
    <div className="stack">
      <div className="shared-scenario">
        <Badge tone={props.scenario === "normal" ? "positive" : "warning"}>
          Shared scenario: {props.activeScenario}
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
              role={props.role}
              topic={props.topic}
              question={props.question}
              language={props.language}
              isLoading={isLoading}
              validationError={props.validationError}
              onRoleChange={props.onRoleChange}
              onTopicChange={props.onTopicChange}
              onQuestionChange={props.onQuestionChange}
              onLanguageChange={props.onLanguageChange}
              onSubmit={props.onSubmit}
            />
          </Card>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {responseAnnouncement(props.responseState)}
        </p>
        <div aria-busy={isLoading}>
          <SopResponse state={props.responseState} onRetry={props.onSubmit} />
        </div>
      </div>
    </div>
  );
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

    const result = await postJson({
      url: "/api/ai/volunteer",
      body: request,
      responseSchema: loadVolunteerEnvelopeSchema,
    });
    if (result.ok) {
      setResponseState({
        status: "ready",
        response: result.data.data,
        mode: result.data.meta.mode,
      });
      return;
    }

    setResponseState({
      status: "fallback",
      response: createVolunteerFallback(request.language, request.topic, request.scenario),
      reason: volunteerFailureReason(result),
    });
  }

  function submit(): void {
    void getGuidance();
  }

  const activeScenario =
    scenarioOptions.find((option) => option.id === scenario)?.label ?? scenario;

  return (
    <VolunteerAssistantView
      scenario={scenario}
      activeScenario={activeScenario}
      role={role}
      topic={topic}
      question={question}
      language={language}
      validationError={validationError}
      responseState={responseState}
      onRoleChange={setRole}
      onTopicChange={setTopic}
      onQuestionChange={setQuestion}
      onLanguageChange={setLanguage}
      onSubmit={submit}
    />
  );
}
