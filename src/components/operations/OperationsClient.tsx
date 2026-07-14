"use client";

import { useMemo, useState } from "react";
import { Activity, Clock3, Lock } from "lucide-react";
import type { OperationsBrief, SuccessEnvelope } from "@/lib/ai/schemas";
import { getScenarioState, type ScenarioId, type SimulationState } from "@/lib/domain";
import { createOperationsFallback } from "@/lib/content/operationsFallback";
import { formatUpdatedAt } from "@/lib/utils/formatters";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { CrowdZoneGrid } from "./CrowdZoneGrid";
import { EventTimeline } from "./EventTimeline";
import { GateThroughput } from "./GateThroughput";
import { IncidentQueue } from "./IncidentQueue";
import { OperationsBriefPanel, type BriefState } from "./OperationsBriefPanel";
import { OperationsOverview } from "./OperationsOverview";
import { ScenarioControls } from "./ScenarioControls";
import { SustainabilityPanel } from "./SustainabilityPanel";
import { useSharedScenario } from "@/components/layout/useSharedScenario";

export function OperationsClient() {
  const [scenario, setScenario] = useSharedScenario();
  const [tick, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [briefState, setBriefState] = useState<BriefState | null>(null);
  const snapshot = useMemo(
    () => getScenarioState(scenario, { tick, paused: isPaused }),
    [scenario, tick, isPaused],
  );
  const currentBriefState: BriefState =
    briefState?.brief.scenario === scenario
      ? briefState
      : { status: "ready", brief: createOperationsFallback(snapshot), mode: "demo" };

  async function loadBrief(nextScenario: ScenarioId, nextSnapshot: SimulationState): Promise<void> {
    const safeBrief = createOperationsFallback(nextSnapshot);
    setBriefState({ status: "loading", brief: safeBrief });

    try {
      const response = await fetch("/api/ai/operations-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: nextScenario, language: "en" }),
      });
      if (!response.ok) {
        setBriefState({
          status: "fallback",
          brief: safeBrief,
          reason:
            response.status === 429
              ? "The briefing limit was reached; seeded evidence remains available."
              : "The model briefing is unavailable; this summary comes from trusted simulation data.",
        });
        return;
      }
      const payload = (await response.json()) as SuccessEnvelope<OperationsBrief>;
      setBriefState({ status: "ready", brief: payload.data, mode: payload.meta.mode });
    } catch {
      setBriefState({
        status: "fallback",
        brief: safeBrief,
        reason: "The network could not reach Gemini. No operational action was taken.",
      });
    }
  }

  function activateScenario(nextScenario: ScenarioId): void {
    if (isPaused) return;
    const nextTick = tick + 1;
    setScenario(nextScenario);
    setTick(nextTick);
    const nextSnapshot = getScenarioState(nextScenario, { tick: nextTick, paused: isPaused });
    void loadBrief(nextScenario, nextSnapshot);
  }

  function retryBrief(): void {
    void loadBrief(scenario, snapshot);
  }

  return (
    <div className="operations-workspace">
      <div className="operations-statusbar">
        <div>
          <Badge tone={isPaused ? "warning" : "positive"}>
            {isPaused ? (
              <Lock size={13} aria-hidden="true" />
            ) : (
              <Activity size={13} aria-hidden="true" />
            )}{" "}
            {isPaused ? "Snapshot locked" : "Scenario controls active"}
          </Badge>
          <span>Seed {snapshot.seed.toLocaleString()}</span>
        </div>
        <p>
          <Clock3 size={14} aria-hidden="true" /> Last updated{" "}
          {formatUpdatedAt(new Date(snapshot.lastUpdatedIso), "en-GB")} UTC
        </p>
      </div>

      {isPaused ? (
        <Alert title="Snapshot locked" tone="warning">
          Crowd, incident and briefing values remain unchanged. Unlock the snapshot to activate a
          different scenario.
        </Alert>
      ) : null}
      <ScenarioControls
        activeScenario={scenario}
        isPaused={isPaused}
        isLoading={currentBriefState.status === "loading"}
        onSelect={activateScenario}
        onPauseChange={setIsPaused}
      />
      <OperationsOverview snapshot={snapshot} />
      <div className="operations-grid operations-grid--primary">
        <CrowdZoneGrid snapshot={snapshot} />
        <OperationsBriefPanel
          key={`${scenario}-${tick}`}
          state={currentBriefState}
          onRetry={retryBrief}
        />
      </div>
      <div className="operations-grid operations-grid--secondary">
        <GateThroughput gates={snapshot.gates} />
        <IncidentQueue incidents={snapshot.incidents} />
        <SustainabilityPanel sustainability={snapshot.sustainability} />
      </div>
      <EventTimeline events={snapshot.timeline} />
    </div>
  );
}
