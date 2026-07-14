"use client";

import { useState } from "react";
import type { FanAssistanceResponse, FanAssistRequest, SuccessEnvelope } from "@/lib/ai/schemas";
import { createFanFallback } from "@/lib/content/fanFallback";
import type { SupportedLanguage } from "@/lib/content/languageOptions";
import { postJson, type PostJsonFailure, type RuntimeSchema } from "@/lib/http/postJson";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { scenarioOptions } from "@/lib/content/scenarioOptions";
import { useSharedScenario } from "@/components/layout/useSharedScenario";
import { AssistanceForm } from "./AssistanceForm";
import { FanResponsePanel, type FanResponseState } from "./FanResponsePanel";

type FanPreferences = FanAssistRequest["preferences"];

const initialMessage =
  "I am near Gate A. I use a wheelchair and need the safest low-crowd route to Section 214. Please answer in Spanish.";

const initialPreferences: FanPreferences = {
  stepFree: true,
  avoidCrowds: true,
  preferQuiet: false,
  avoidAccessibilityObstructions: true,
};

async function loadFanEnvelopeSchema(): Promise<
  RuntimeSchema<SuccessEnvelope<FanAssistanceResponse>>
> {
  const { fanAssistanceResponseSchema, successEnvelopeSchema } = await import("@/lib/ai/schemas");
  return successEnvelopeSchema(fanAssistanceResponseSchema);
}

function fallbackMessage(failure: PostJsonFailure): { title: string; detail: string } {
  if (failure.kind === "http-error" && failure.status === 429) {
    return {
      title: "Request limit reached",
      detail: "The live assistant is taking a short pause.",
    };
  }
  if (failure.kind === "http-error" && failure.status >= 500) {
    return {
      title: "Gemini is temporarily unavailable",
      detail: "The grounded routing tools are still available.",
    };
  }
  if (failure.kind === "timeout") {
    return {
      title: "The assistant took too long",
      detail: "The request was safely cancelled after 14 seconds.",
    };
  }
  if (failure.kind === "network-error") {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    return isOffline
      ? { title: "You appear to be offline", detail: "Reconnect to refresh live context." }
      : {
          title: "Network connection interrupted",
          detail: "Live venue guidance could not be reached.",
        };
  }
  return {
    title: "The live response could not be validated",
    detail: "The request was not used to generate guidance.",
  };
}

function responseAnnouncement(state: FanResponseState): string {
  switch (state.status) {
    case "idle":
      return "";
    case "loading":
      return "Finding grounded venue guidance.";
    case "success":
      return `Venue guidance is ready in ${state.response.language}.`;
    case "fallback":
      return `The live assistant is unavailable. Safe deterministic guidance is ready in ${state.response.language}.`;
  }
}

interface FanCompanionViewProps {
  readonly scenario: FanAssistRequest["scenario"];
  readonly activeScenario: string;
  readonly currentLocation: string;
  readonly destination: string;
  readonly language: SupportedLanguage;
  readonly message: string;
  readonly preferences: FanPreferences;
  readonly validationError: string | undefined;
  readonly responseState: FanResponseState;
  readonly onCurrentLocationChange: (value: string) => void;
  readonly onDestinationChange: (value: string) => void;
  readonly onLanguageChange: (value: SupportedLanguage) => void;
  readonly onMessageChange: (value: string) => void;
  readonly onPreferencesChange: (value: FanPreferences) => void;
  readonly onSubmit: () => void;
  readonly onFollowUp: (question: string) => void;
}

function FanCompanionView(props: FanCompanionViewProps) {
  const isLoading = props.responseState.status === "loading";
  return (
    <div className="stack">
      <div className="shared-scenario">
        <Badge tone={props.scenario === "normal" ? "positive" : "warning"}>
          Shared scenario: {props.activeScenario}
        </Badge>
        <span>Synced with Operations Command Center</span>
      </div>
      <div className="fan-workspace">
        <Card className="fan-form-card" padding="large">
          <AssistanceForm
            currentLocation={props.currentLocation}
            destination={props.destination}
            language={props.language}
            message={props.message}
            preferences={props.preferences}
            isLoading={isLoading}
            validationError={props.validationError}
            onCurrentLocationChange={props.onCurrentLocationChange}
            onDestinationChange={props.onDestinationChange}
            onLanguageChange={props.onLanguageChange}
            onMessageChange={props.onMessageChange}
            onPreferencesChange={props.onPreferencesChange}
            onSubmit={props.onSubmit}
          />
        </Card>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {responseAnnouncement(props.responseState)}
        </p>
        <div className="fan-results" aria-busy={isLoading}>
          <FanResponsePanel
            state={props.responseState}
            onRetry={props.onSubmit}
            onFollowUp={props.onFollowUp}
          />
        </div>
      </div>
    </div>
  );
}

export function FanCompanionClient() {
  const [scenario] = useSharedScenario();
  const [currentLocation, setCurrentLocation] = useState("gate-a");
  const [destination, setDestination] = useState("section-214");
  const [language, setLanguage] = useState<SupportedLanguage>("es");
  const [message, setMessage] = useState(initialMessage);
  const [preferences, setPreferences] = useState<FanPreferences>(initialPreferences);
  const [validationError, setValidationError] = useState<string>();
  const [responseState, setResponseState] = useState<FanResponseState>({ status: "idle" });

  function buildRequest(): FanAssistRequest {
    return {
      message: message.trim(),
      language,
      currentLocation,
      destination,
      preferences,
      scenario,
    };
  }

  async function requestAssistance(): Promise<void> {
    if (message.trim().length < 3) {
      setValidationError("Add a short question or describe the support you need.");
      return;
    }

    setValidationError(undefined);
    setResponseState({ status: "loading" });
    const request = buildRequest();

    const result = await postJson({
      url: "/api/ai/assist",
      body: request,
      responseSchema: loadFanEnvelopeSchema,
    });
    if (result.ok) {
      setResponseState({
        status: "success",
        response: result.data.data,
        mode: result.data.meta.mode,
      });
      return;
    }

    const copy = fallbackMessage(result);
    setResponseState({
      status: "fallback",
      response: createFanFallback(request),
      reasonTitle: copy.title,
      reason: copy.detail,
    });
  }

  function submit(): void {
    void requestAssistance();
  }

  function handleFollowUp(question: string): void {
    setMessage(question);
    window.setTimeout(() => document.getElementById("fan-message")?.focus(), 0);
  }

  const activeScenario =
    scenarioOptions.find((option) => option.id === scenario)?.label ?? scenario;

  return (
    <FanCompanionView
      scenario={scenario}
      activeScenario={activeScenario}
      currentLocation={currentLocation}
      destination={destination}
      language={language}
      message={message}
      preferences={preferences}
      validationError={validationError}
      responseState={responseState}
      onCurrentLocationChange={setCurrentLocation}
      onDestinationChange={setDestination}
      onLanguageChange={setLanguage}
      onMessageChange={setMessage}
      onPreferencesChange={setPreferences}
      onSubmit={submit}
      onFollowUp={handleFollowUp}
    />
  );
}
