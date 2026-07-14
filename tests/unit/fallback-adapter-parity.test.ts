import { describe, expect, it } from "vitest";

import { createFanFallback as createCanonicalFanFallback } from "@/lib/ai/fallback/fan";
import { createOperationsFallback as createCanonicalOperationsFallback } from "@/lib/ai/fallback/operations";
import { createVolunteerFallback as createCanonicalVolunteerFallback } from "@/lib/ai/fallback/volunteer";
import type { FanAssistRequest, OperationsBriefRequest, VolunteerRequest } from "@/lib/ai/schemas";
import { getAccessibleRoute } from "@/lib/ai/tools/fan";
import { getOperationsGroundingFromState, getOperationsSnapshot } from "@/lib/ai/tools/operations";
import { getVenueSop } from "@/lib/ai/tools/volunteer";
import { createFanFallback as createFanAdapter } from "@/lib/content/fanFallback";
import { createOperationsFallback as createOperationsAdapter } from "@/lib/content/operationsFallback";
import { createVolunteerFallback as createVolunteerAdapter } from "@/lib/content/volunteerFallback";
import { getScenarioState, type SimulationState } from "@/lib/domain";

const FAN_CASES = [
  {
    message: "Necesito una ruta accesible.",
    language: "es",
    currentLocation: "gate-a",
    destination: "section-214",
    preferences: {
      stepFree: true,
      avoidCrowds: true,
      preferQuiet: false,
      avoidAccessibilityObstructions: true,
    },
    scenario: "normal",
  },
  {
    message: "أحتاج إلى مسار دون عوائق.",
    language: "ar",
    currentLocation: "gate-a",
    destination: "section-214",
    preferences: {
      stepFree: true,
      avoidCrowds: true,
      preferQuiet: true,
      avoidAccessibilityObstructions: true,
    },
    scenario: "accessibility-obstruction",
  },
] as const satisfies readonly FanAssistRequest[];

function volunteerRequest(
  language: VolunteerRequest["language"],
  topic: VolunteerRequest["topic"],
  scenario: VolunteerRequest["scenario"],
): VolunteerRequest {
  return {
    question: "What trusted venue SOP should I follow?",
    language,
    role: "guest-services",
    topic,
    scenario,
  };
}

describe("content fallback adapters", () => {
  it.each(FAN_CASES)("matches the canonical fan fallback for $language in $scenario", (request) => {
    expect(createFanAdapter(request)).toEqual(
      createCanonicalFanFallback(request, getAccessibleRoute(request)),
    );
  });

  it.each([
    ["en", "medical", "normal"],
    ["ar", "accessible-entry", "accessibility-obstruction"],
    ["hi", "transport", "train-disruption"],
  ] as const)(
    "matches the canonical volunteer fallback for %s/%s/%s",
    (language, topic, scenario) => {
      const request = volunteerRequest(language, topic, scenario);

      expect(createVolunteerAdapter(language, topic, scenario)).toEqual(
        createCanonicalVolunteerFallback(request, getVenueSop(request)),
      );
    },
  );

  it("uses the supplied ticked operations state without regenerating it", () => {
    const request: OperationsBriefRequest = {
      scenario: "arrival-surge",
      language: "en",
      seed: 4_204,
      tick: 7,
    };
    const deterministicState = getScenarioState(request.scenario, {
      seed: 4_204,
      tick: 7,
    });
    const suppliedState: SimulationState = {
      ...deterministicState,
      occupancyPercentage: 12.345,
    };
    const grounding = getOperationsGroundingFromState(suppliedState);

    expect(createOperationsAdapter(suppliedState)).toEqual(
      createCanonicalOperationsFallback(request, grounding),
    );
    expect(createOperationsAdapter(suppliedState).evidence[0]).toContain("12.3%");
    expect(getOperationsSnapshot(request)).toEqual(
      getOperationsGroundingFromState(deterministicState),
    );
  });
});
