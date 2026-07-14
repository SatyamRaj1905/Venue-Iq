import { describe, expect, it, vi } from "vitest";

import {
  applyPreferences,
  defaultPreferences,
  loadPreferences,
  savePreferences,
} from "@/lib/storage/preferences";

describe("interface preference storage", () => {
  it("loads a valid saved state", () => {
    const getItem = vi.fn(() =>
      JSON.stringify({ largeText: true, highContrast: false, reduceMotion: true }),
    );

    expect(loadPreferences({ getItem })).toEqual({
      largeText: true,
      highContrast: false,
      reduceMotion: true,
    });
  });

  it("uses defaults for corrupted or structurally invalid storage", () => {
    expect(loadPreferences({ getItem: () => "not-json" })).toEqual(defaultPreferences);
    expect(loadPreferences({ getItem: () => JSON.stringify({ largeText: true }) })).toEqual(
      defaultPreferences,
    );
  });

  it("falls back when storage is unsupported or throws", () => {
    expect(loadPreferences(null)).toEqual(defaultPreferences);
    expect(
      loadPreferences({
        getItem: () => {
          throw new DOMException("Blocked", "SecurityError");
        },
      }),
    ).toEqual(defaultPreferences);
    expect(savePreferences(defaultPreferences, null)).toBe(false);
    expect(
      savePreferences(defaultPreferences, {
        setItem: () => {
          throw new DOMException("Full", "QuotaExceededError");
        },
      }),
    ).toBe(false);
  });

  it("saves valid state and applies it to the document root", () => {
    const setItem = vi.fn();
    const preferences = { largeText: true, highContrast: true, reduceMotion: false };

    expect(savePreferences(preferences, { setItem })).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "venueiq:interface-preferences:v1",
      JSON.stringify(preferences),
    );

    applyPreferences(preferences, document.documentElement);
    expect(document.documentElement.dataset).toMatchObject({
      largeText: "true",
      highContrast: "true",
      reduceMotion: "false",
    });
  });
});
