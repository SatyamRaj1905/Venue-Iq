import { describe, expect, it } from "vitest";
import {
  defaultSharedScenario,
  loadSharedScenario,
  saveSharedScenario,
  SHARED_SCENARIO_STORAGE_KEY,
} from "@/lib/storage/sharedScenario";

function memoryStorage(initial?: string): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(SHARED_SCENARIO_STORAGE_KEY, initial);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("shared scenario storage", () => {
  it("round-trips a valid shared scenario", () => {
    const storage = memoryStorage();
    expect(saveSharedScenario("gate-closure", storage)).toBe(true);
    expect(loadSharedScenario(storage)).toBe("gate-closure");
  });

  it("uses normal operations for corrupt storage", () => {
    expect(loadSharedScenario(memoryStorage("not-json"))).toBe(defaultSharedScenario);
  });

  it("rejects an unsupported stored scenario", () => {
    const storage = memoryStorage(JSON.stringify({ version: 1, scenario: "invented-emergency" }));
    expect(loadSharedScenario(storage)).toBe("normal");
  });
});
