"use client";

import { useState } from "react";
import type { FanAssistanceResponse, FanAssistRequest, SuccessEnvelope } from "@/lib/ai/schemas";
import { createFanFallback } from "@/lib/content/fanFallback";
import type { SupportedLanguage } from "@/lib/content/languageOptions";
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

function fallbackMessage(status: number): { title: string; detail: string } {
  if (status === 429) {
    return {
      title: "Request limit reached",
      detail: "The live assistant is taking a short pause.",
    };
  }
  if (status >= 500) {
    return {
      title: "Gemini is temporarily unavailable",
      detail: "The grounded routing tools are still available.",
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
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 14_000);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const copy = fallbackMessage(response.status);
        setResponseState({
          status: "fallback",
          response: createFanFallback(request),
          reasonTitle: copy.title,
          reason: copy.detail,
        });
        return;
      }

      const payload = (await response.json()) as SuccessEnvelope<FanAssistanceResponse>;
      setResponseState({ status: "success", response: payload.data, mode: payload.meta.mode });
    } catch (error: unknown) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setResponseState({
        status: "fallback",
        response: createFanFallback(request),
        reasonTitle: isOffline
          ? "You appear to be offline"
          : isTimeout
            ? "The assistant took too long"
            : "Network connection interrupted",
        reason: isOffline
          ? "Reconnect to refresh live context."
          : isTimeout
            ? "The request was safely cancelled after 14 seconds."
            : "Live venue guidance could not be reached.",
      });
    } finally {
      window.clearTimeout(timeout);
    }
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
    <div className="stack">
      <div className="shared-scenario">
        <Badge tone={scenario === "normal" ? "positive" : "warning"}>
          Shared scenario: {activeScenario}
        </Badge>
        <span>Synced with Operations Command Center</span>
      </div>
      <div className="fan-workspace">
        <Card className="fan-form-card" padding="large">
          <AssistanceForm
            currentLocation={currentLocation}
            destination={destination}
            language={language}
            message={message}
            preferences={preferences}
            isLoading={responseState.status === "loading"}
            validationError={validationError}
            onCurrentLocationChange={setCurrentLocation}
            onDestinationChange={setDestination}
            onLanguageChange={setLanguage}
            onMessageChange={setMessage}
            onPreferencesChange={setPreferences}
            onSubmit={submit}
          />
        </Card>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {responseAnnouncement(responseState)}
        </p>
        <div className="fan-results" aria-busy={responseState.status === "loading"}>
          <FanResponsePanel state={responseState} onRetry={submit} onFollowUp={handleFollowUp} />
        </div>
      </div>
    </div>
  );
}
