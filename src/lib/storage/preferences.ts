export interface InterfacePreferences {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
}

export const defaultPreferences: InterfacePreferences = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
};

const STORAGE_KEY = "venueiq:interface-preferences:v1";

function isPreferences(value: unknown): value is InterfacePreferences {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.largeText === "boolean" &&
    typeof candidate.highContrast === "boolean" &&
    typeof candidate.reduceMotion === "boolean"
  );
}

export function loadPreferences(storage?: Pick<Storage, "getItem"> | null): InterfacePreferences {
  if (!storage) {
    return { ...defaultPreferences };
  }

  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) {
      return { ...defaultPreferences };
    }

    const parsed: unknown = JSON.parse(saved);
    return isPreferences(parsed) ? parsed : { ...defaultPreferences };
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePreferences(
  preferences: InterfacePreferences,
  storage?: Pick<Storage, "setItem"> | null,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export function applyPreferences(preferences: InterfacePreferences, root: HTMLElement): void {
  root.dataset.largeText = String(preferences.largeText);
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.reduceMotion = String(preferences.reduceMotion);
}
