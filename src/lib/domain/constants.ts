/** Canonical identifiers shared by domain logic, API contracts, content, and storage. */
export const SUPPORTED_LANGUAGE_IDS = ["en", "es", "fr", "pt", "ar", "hi"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGE_IDS)[number];

export const SCENARIO_IDS = [
  "normal",
  "arrival-surge",
  "gate-closure",
  "train-disruption",
  "heat-alert",
  "medical-response",
  "accessibility-obstruction",
  "waste-overflow",
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const VOLUNTEER_ROLE_IDS = [
  "wayfinding",
  "accessibility",
  "guest-services",
  "transport",
] as const;

export type VolunteerRole = (typeof VOLUNTEER_ROLE_IDS)[number];

export const VOLUNTEER_TOPIC_IDS = [
  "accessible-entry",
  "lost-person",
  "medical",
  "transport",
  "crowd",
] as const;

export type VolunteerTopic = (typeof VOLUNTEER_TOPIC_IDS)[number];

const supportedLanguageIds: ReadonlySet<string> = new Set(SUPPORTED_LANGUAGE_IDS);
const scenarioIds: ReadonlySet<string> = new Set(SCENARIO_IDS);

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && supportedLanguageIds.has(value);
}

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && scenarioIds.has(value);
}
