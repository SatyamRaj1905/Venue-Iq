import { describe, expect, it } from "vitest";

import {
  localizeAccessibilityNote,
  localizeAlert,
  localizeFacilityType,
  localizeRouteExplanations,
  localizeRouteInstruction,
  localizeSopTitle,
} from "@/lib/ai/localization";
import type { SupportedLanguage } from "@/lib/ai/schemas";

describe("safe deterministic localization", () => {
  it.each<[SupportedLanguage, string]>([
    ["en", "Take the lift"],
    ["es", "Tome el ascensor"],
    ["fr", "Prenez l’ascenseur"],
    ["pt", "Pegue o elevador"],
    ["ar", "استخدم المصعد"],
    ["hi", "लिफ़्ट लें"],
  ])("localizes route instructions for %s without altering the destination", (language, phrase) => {
    const instruction = localizeRouteInstruction(language, "lift", "Section 214");
    expect(instruction).toContain(phrase);
    expect(instruction).toContain("Section 214");
  });

  it("localizes accessibility facts and facility categories", () => {
    expect(localizeAccessibilityNote("es", "ramp", true)).toContain("Rampa");
    expect(localizeAccessibilityNote("ar", "stairs", false)).toContain("درج");
    expect(localizeFacilityType("hi", "accessible-toilet")).toBe("सुगम शौचालय");
  });

  it("generates localized route rationale only from deterministic preferences", () => {
    const explanations = localizeRouteExplanations(
      "es",
      {
        stepFree: true,
        avoidCrowds: true,
        preferQuiet: true,
        avoidAccessibilityObstructions: true,
      },
      "low",
    );
    expect(explanations).toHaveLength(5);
    expect(explanations.join(" ")).toContain("sin escalones");
    expect(explanations.join(" ")).toContain("obstáculos");
  });

  it("localizes simulated alerts while retaining trusted zone identifiers", () => {
    const alert = localizeAlert(
      {
        id: "alert-gate-c",
        title: "Gate C is closed",
        message: "Follow staff directions.",
        severity: "critical",
        zoneIds: ["south-concourse"],
        simulated: true,
      },
      "gate-closure",
      "ar",
      "critical",
    );
    expect(alert.title).toContain("إغلاق");
    expect(alert.message).toContain("south-concourse");
    expect(alert.simulated).toBe(true);
  });

  it("localizes trusted SOP titles", () => {
    expect(localizeSopTitle("ar", "accessible-entry")).toBe("مساعدة الدخول الميسّر");
    expect(localizeSopTitle("es", "medical")).toBe("Asistencia médica");
  });
});
