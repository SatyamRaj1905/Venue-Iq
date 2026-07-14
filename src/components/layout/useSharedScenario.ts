"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ScenarioId } from "@/lib/content/scenarioOptions";
import {
  defaultSharedScenario,
  loadSharedScenario,
  saveSharedScenario,
  SHARED_SCENARIO_EVENT,
} from "@/lib/storage/sharedScenario";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SHARED_SCENARIO_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SHARED_SCENARIO_EVENT, onStoreChange);
  };
}

function getSnapshot(): ScenarioId {
  return loadSharedScenario(window.localStorage);
}

export function useSharedScenario(): readonly [ScenarioId, (scenario: ScenarioId) => void] {
  const scenario = useSyncExternalStore(subscribe, getSnapshot, () => defaultSharedScenario);
  const setScenario = useCallback((nextScenario: ScenarioId) => {
    saveSharedScenario(nextScenario, window.localStorage);
    window.dispatchEvent(new Event(SHARED_SCENARIO_EVENT));
  }, []);
  return [scenario, setScenario] as const;
}
