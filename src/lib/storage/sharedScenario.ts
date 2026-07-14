import { isScenarioId, type ScenarioId } from "@/lib/domain/constants";

export const SHARED_SCENARIO_STORAGE_KEY = "venueiq:shared-scenario:v1";
export const SHARED_SCENARIO_EVENT = "venueiq:shared-scenario-changed";
export const defaultSharedScenario: ScenarioId = "normal";

export function loadSharedScenario(storage?: Pick<Storage, "getItem"> | null): ScenarioId {
  if (!storage) return defaultSharedScenario;
  try {
    const stored = storage.getItem(SHARED_SCENARIO_STORAGE_KEY);
    if (!stored) return defaultSharedScenario;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return defaultSharedScenario;
    const scenario = (parsed as Record<string, unknown>).scenario;
    return isScenarioId(scenario) ? scenario : defaultSharedScenario;
  } catch {
    return defaultSharedScenario;
  }
}

export function saveSharedScenario(
  scenario: ScenarioId,
  storage?: Pick<Storage, "setItem"> | null,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SHARED_SCENARIO_STORAGE_KEY, JSON.stringify({ version: 1, scenario }));
    return true;
  } catch {
    return false;
  }
}
