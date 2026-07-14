"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock3, Lock } from "lucide-react";
import type { OperationsBrief, SuccessEnvelope } from "@/lib/ai/schemas";
import {
  getScenarioState,
  setSimulationPaused,
  type ScenarioId,
  type SimulationState,
} from "@/lib/domain";
import { createOperationsFallback } from "@/lib/content/operationsFallback";
import { postJson, type PostJsonFailure, type RuntimeSchema } from "@/lib/http/postJson";
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

async function loadOperationsEnvelopeSchema(): Promise<
  RuntimeSchema<SuccessEnvelope<OperationsBrief>>
> {
  const { operationsBriefSchema, successEnvelopeSchema } = await import("@/lib/ai/schemas");
  return successEnvelopeSchema(operationsBriefSchema);
}

function briefFailureReason(failure: PostJsonFailure): string {
  if (failure.kind === "http-error" && failure.status === 429) {
    return "The briefing limit was reached; seeded evidence remains available.";
  }
  if (failure.kind === "timeout") {
    return "The model briefing took too long; seeded evidence remains available.";
  }
  if (failure.kind === "invalid-response") {
    return "The model response failed validation; this summary comes from trusted simulation data.";
  }
  if (failure.kind === "network-error") {
    return "The network could not reach Gemini. No operational action was taken.";
  }
  return "The model briefing is unavailable; this summary comes from trusted simulation data.";
}

function OperationsStatusBar({
  isPaused,
  snapshot,
}: Readonly<{ isPaused: boolean; snapshot: SimulationState }>) {
  return (
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
  );
}

interface OperationsWorkspaceProps {
  readonly scenario: ScenarioId;
  readonly tick: number;
  readonly isPaused: boolean;
  readonly snapshot: SimulationState;
  readonly briefState: BriefState;
  readonly onScenarioSelect: (scenario: ScenarioId) => void;
  readonly onPauseChange: (paused: boolean) => void;
  readonly onRetryBrief: () => void;
}

function OperationsWorkspace(props: OperationsWorkspaceProps) {
  return (
    <div className="operations-workspace">
      <OperationsStatusBar isPaused={props.isPaused} snapshot={props.snapshot} />
      {props.isPaused ? (
        <Alert title="Snapshot locked" tone="warning">
          Crowd, incident and briefing values remain unchanged. Unlock the snapshot to activate a
          different scenario.
        </Alert>
      ) : null}
      <ScenarioControls
        activeScenario={props.scenario}
        isPaused={props.isPaused}
        isLoading={props.briefState.status === "loading"}
        onSelect={props.onScenarioSelect}
        onPauseChange={props.onPauseChange}
      />
      <OperationsOverview snapshot={props.snapshot} />
      <div className="operations-grid operations-grid--primary">
        <CrowdZoneGrid snapshot={props.snapshot} />
        <OperationsBriefPanel
          key={`${props.scenario}-${props.tick}`}
          state={props.briefState}
          onRetry={props.onRetryBrief}
        />
      </div>
      <div className="operations-grid operations-grid--secondary">
        <GateThroughput gates={props.snapshot.gates} />
        <IncidentQueue incidents={props.snapshot.incidents} />
        <SustainabilityPanel sustainability={props.snapshot.sustainability} />
      </div>
      <EventTimeline events={props.snapshot.timeline} />
    </div>
  );
}

function useOperationsSnapshot(scenario: ScenarioId, tick: number, isPaused: boolean) {
  const liveSnapshot = useMemo(() => getScenarioState(scenario, { tick }), [scenario, tick]);
  const snapshot = useMemo(
    () => setSimulationPaused(liveSnapshot, isPaused),
    [liveSnapshot, isPaused],
  );
  const safeBrief = useMemo(() => createOperationsFallback(liveSnapshot), [liveSnapshot]);
  return { snapshot, safeBrief };
}

function resolveBriefState(
  briefState: BriefState | null,
  scenario: ScenarioId,
  safeBrief: OperationsBrief,
): BriefState {
  return briefState?.brief.scenario === scenario
    ? briefState
    : { status: "ready", brief: safeBrief, mode: "demo" };
}

export function OperationsClient() {
  const [scenario, setScenario] = useSharedScenario();
  const [tick, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [briefState, setBriefState] = useState<BriefState | null>(null);
  const activeBriefController = useRef<AbortController | null>(null);
  const latestBriefRequest = useRef(0);
  const pendingBrief = useRef(false);
  const { snapshot, safeBrief } = useOperationsSnapshot(scenario, tick, isPaused);
  const currentBriefState = resolveBriefState(briefState, scenario, safeBrief);

  useEffect(
    () => () => {
      latestBriefRequest.current += 1;
      activeBriefController.current?.abort();
    },
    [],
  );

  const loadBrief = useCallback(async (nextSnapshot: SimulationState): Promise<void> => {
    const safeBrief = createOperationsFallback(nextSnapshot);
    const requestId = latestBriefRequest.current + 1;
    latestBriefRequest.current = requestId;
    activeBriefController.current?.abort();
    const controller = new AbortController();
    activeBriefController.current = controller;
    setBriefState({ status: "loading", brief: safeBrief });

    const result = await postJson({
      url: "/api/ai/operations-brief",
      body: {
        scenario: nextSnapshot.scenarioId,
        language: "en",
        seed: nextSnapshot.seed,
        tick: nextSnapshot.tick,
      },
      responseSchema: loadOperationsEnvelopeSchema,
      signal: controller.signal,
    });

    if (requestId !== latestBriefRequest.current) {
      return;
    }
    activeBriefController.current = null;

    if (result.ok) {
      setBriefState({ status: "ready", brief: result.data.data, mode: result.data.meta.mode });
      return;
    }

    setBriefState({
      status: "fallback",
      brief: safeBrief,
      reason: briefFailureReason(result),
    });
  }, []);

  useEffect(() => {
    if (!pendingBrief.current) {
      return;
    }
    pendingBrief.current = false;
    void loadBrief(snapshot);
  }, [loadBrief, snapshot]);

  function activateScenario(nextScenario: ScenarioId): void {
    if (isPaused) return;
    pendingBrief.current = true;
    setBriefState(null);
    setScenario(nextScenario);
    setTick((currentTick) => currentTick + 1);
  }

  function retryBrief(): void {
    void loadBrief(snapshot);
  }

  return (
    <OperationsWorkspace
      scenario={scenario}
      tick={tick}
      isPaused={isPaused}
      snapshot={snapshot}
      briefState={currentBriefState}
      onScenarioSelect={activateScenario}
      onPauseChange={setIsPaused}
      onRetryBrief={retryBrief}
    />
  );
}
