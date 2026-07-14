"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Accessibility, Contrast, Text, ZapOff } from "lucide-react";
import {
  applyPreferences,
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type InterfacePreferences,
} from "@/lib/storage/preferences";
import { Toggle } from "@/components/ui/Toggle";

type PreferenceKey = keyof InterfacePreferences;
const preferenceEvent = "venueiq:preferences-changed";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferenceEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferenceEvent, onStoreChange);
  };
}

function encodePreferences(preferences: InterfacePreferences): string {
  return `${preferences.largeText ? "1" : "0"}${preferences.highContrast ? "1" : "0"}${preferences.reduceMotion ? "1" : "0"}`;
}

function getSnapshot(): string {
  return encodePreferences(loadPreferences(window.localStorage));
}

function decodePreferences(snapshot: string): InterfacePreferences {
  return {
    largeText: snapshot[0] === "1",
    highContrast: snapshot[1] === "1",
    reduceMotion: snapshot[2] === "1",
  };
}

export function AccessibilityControls() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () =>
    encodePreferences(defaultPreferences),
  );
  const preferences = decodePreferences(snapshot);

  useEffect(() => {
    applyPreferences(decodePreferences(snapshot), document.documentElement);
  }, [snapshot]);

  function updatePreference(key: PreferenceKey, value: boolean): void {
    const next = { ...preferences, [key]: value };
    applyPreferences(next, document.documentElement);
    savePreferences(next, window.localStorage);
    window.dispatchEvent(new Event(preferenceEvent));
  }

  return (
    <details className="accessibility-menu">
      <summary className="icon-button" aria-label="Open display accessibility preferences">
        <Accessibility size={19} aria-hidden="true" />
      </summary>
      <div className="accessibility-menu__panel">
        <div className="accessibility-menu__heading">
          <div>
            <p className="eyebrow">Display preferences</p>
            <p className="accessibility-menu__title">Make VenueIQ yours</p>
          </div>
          <span className="key-hint" aria-hidden="true">
            A11y
          </span>
        </div>
        <Toggle
          checked={preferences.largeText}
          onChange={(checked) => updatePreference("largeText", checked)}
          label="Larger text"
          description="Increase interface text and spacing."
          icon={<Text size={17} />}
          compact
        />
        <Toggle
          checked={preferences.highContrast}
          onChange={(checked) => updatePreference("highContrast", checked)}
          label="High contrast"
          description="Strengthen borders and foreground colors."
          icon={<Contrast size={17} />}
          compact
        />
        <Toggle
          checked={preferences.reduceMotion}
          onChange={(checked) => updatePreference("reduceMotion", checked)}
          label="Reduce motion"
          description="Pause decorative movement."
          icon={<ZapOff size={17} />}
          compact
        />
      </div>
    </details>
  );
}
