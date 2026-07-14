import type { FanAssistRequest, FanAssistanceResponse } from "./schemas";
import type { FacilityKind } from "@/lib/domain";

export type FanIntent = FanAssistanceResponse["intent"];

export type FanToolName = "getAccessibleRoute" | "getNearbyFacilities" | "getTransportOptions";

interface FanPolicyResult {
  readonly intent: FanIntent;
  readonly selectedTool: FanToolName;
  readonly facilityKinds?: readonly FacilityKind[];
  readonly request: FanAssistRequest;
}

const ACCESSIBILITY_TERMS = [
  "wheelchair",
  "wheel chair",
  "step-free",
  "step free",
  "accessible",
  "accessibility",
  "mobility",
  "silla de ruedas",
  "sin escalones",
  "accesible",
  "fauteuil roulant",
  "sans marches",
  "accessibilité",
  "cadeira de rodas",
  "sem degraus",
  "acessível",
  "كرسي متحرك",
  "دون درج",
  "ميسر",
  "ميسّر",
  "व्हीलचेयर",
  "सीढ़ी रहित",
  "सीढ़ी-रहित",
  "सुगम",
] as const;

const TRANSPORT_TERMS = [
  "train",
  "rail",
  "metro",
  "bus",
  "shuttle",
  "taxi",
  "station",
  "transport",
  "tren",
  "autobús",
  "transporte",
  "métro",
  "transportation",
  "trem",
  "ônibus",
  "metrô",
  "قطار",
  "حافلة",
  "مترو",
  "نقل",
  "ट्रेन",
  "बस",
  "मेट्रो",
  "परिवहन",
] as const;

const FACILITY_TERMS = [
  "toilet",
  "restroom",
  "bathroom",
  "medical point",
  "first aid",
  "water refill",
  "assistance desk",
  "food area",
  "baño",
  "puesto médico",
  "toilettes",
  "point médical",
  "banheiro",
  "posto médico",
  "دورة مياه",
  "نقطة طبية",
  "शौचालय",
  "चिकित्सा केंद्र",
] as const;

const NAVIGATION_TERMS = [
  "route",
  "directions",
  "find my way",
  "section",
  "gate",
  "ruta",
  "sección",
  "puerta",
  "itinéraire",
  "section",
  "porte",
  "rota",
  "seção",
  "portão",
  "مسار",
  "بوابة",
  "قسم",
  "मार्ग",
  "सेक्शन",
  "गेट",
] as const;

const QUIET_TERMS = [
  "quiet",
  "sensory",
  "tranquilo",
  "sensorial",
  "calme",
  "sensoriel",
  "silencioso",
  "هادئ",
  "حسي",
  "शांत",
  "संवेदी",
] as const;

const CROWD_AVOIDANCE_TERMS = [
  "low-crowd",
  "low crowd",
  "avoid crowds",
  "safest",
  "menos concurrida",
  "evitar multitudes",
  "moins fréquenté",
  "éviter la foule",
  "menos lotada",
  "evitar multidões",
  "أقل ازدحام",
  "تجنب الازدحام",
  "कम भीड़",
  "भीड़ से बच",
] as const;

function normalize(input: string): string {
  return ` ${input
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function includesAny(normalized: string, terms: readonly string[]): boolean {
  return terms.some((term) => normalized.includes(` ${normalize(term).trim()} `));
}

export function inferFanIntent(message: string): FanIntent {
  const normalized = normalize(message);
  if (includesAny(normalized, TRANSPORT_TERMS)) return "transport";
  if (includesAny(normalized, FACILITY_TERMS)) return "facility";
  if (includesAny(normalized, ACCESSIBILITY_TERMS)) return "accessibility";
  if (includesAny(normalized, NAVIGATION_TERMS)) return "navigation";
  return "general";
}

function toolForIntent(intent: FanIntent): FanToolName {
  if (intent === "transport") return "getTransportOptions";
  if (intent === "facility") return "getNearbyFacilities";
  return "getAccessibleRoute";
}

function requestedFacilityKinds(normalized: string): readonly FacilityKind[] | undefined {
  if (
    includesAny(normalized, [
      "toilet",
      "restroom",
      "bathroom",
      "baño",
      "toilettes",
      "banheiro",
      "دورة مياه",
      "शौचालय",
    ])
  ) {
    return includesAny(normalized, ACCESSIBILITY_TERMS)
      ? ["accessible-toilet"]
      : ["accessible-toilet", "toilet"];
  }
  if (
    includesAny(normalized, [
      "medical point",
      "first aid",
      "puesto médico",
      "point médical",
      "posto médico",
      "نقطة طبية",
      "चिकित्सा केंद्र",
    ])
  ) {
    return ["medical"];
  }
  if (
    includesAny(normalized, [
      "water refill",
      "recarga de agua",
      "point d eau",
      "água",
      "مياه",
      "पानी",
    ])
  ) {
    return ["water-refill"];
  }
  if (
    includesAny(normalized, [
      "assistance desk",
      "puesto de asistencia",
      "point d assistance",
      "balcão de assistência",
      "مكتب مساعدة",
      "सहायता डेस्क",
    ])
  ) {
    return ["assistance-desk"];
  }
  if (
    includesAny(normalized, ["food area", "comida", "restauration", "alimentação", "طعام", "भोजन"])
  ) {
    return ["food"];
  }
  return undefined;
}

/** Applies safety-relevant natural-language signals before any deterministic tool runs. */
export function applyFanRequestPolicy(request: FanAssistRequest): FanPolicyResult {
  const normalized = normalize(request.message);
  const intent = inferFanIntent(request.message);
  const facilityKinds = intent === "facility" ? requestedFacilityKinds(normalized) : undefined;
  const requestsAccessibleRoute = includesAny(normalized, ACCESSIBILITY_TERMS);
  const requestsQuietRoute = includesAny(normalized, QUIET_TERMS);
  const requestsLowCrowdRoute = includesAny(normalized, CROWD_AVOIDANCE_TERMS);

  return {
    intent,
    selectedTool: toolForIntent(intent),
    ...(facilityKinds === undefined ? {} : { facilityKinds }),
    request: {
      ...request,
      preferences: {
        ...request.preferences,
        stepFree: request.preferences.stepFree || requestsAccessibleRoute,
        avoidCrowds: request.preferences.avoidCrowds || requestsLowCrowdRoute,
        preferQuiet: request.preferences.preferQuiet || requestsQuietRoute,
        avoidAccessibilityObstructions:
          request.preferences.avoidAccessibilityObstructions || requestsAccessibleRoute,
      },
    },
  };
}
