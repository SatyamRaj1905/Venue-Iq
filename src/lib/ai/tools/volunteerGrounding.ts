import { getVolunteerFallback } from "@/lib/content/volunteerSops";

import type { ScenarioId, VolunteerRequest, VolunteerTopic } from "../types";

export interface VenueSop {
  readonly title: string;
  readonly steps: readonly string[];
  readonly escalationRequired: boolean;
  readonly escalationReason: string;
  readonly contactRole: string;
  readonly authorityBoundary: string;
}

export interface VolunteerGrounding {
  readonly sop: VenueSop;
  readonly localizedFallback: Readonly<{
    summary: string;
    checklist: readonly string[];
    escalation: string;
    contactRole: string;
  }>;
  readonly scenarioContext: Readonly<{
    scenario: ScenarioId;
    alerts: readonly string[];
  }>;
}

const SOPS: Readonly<Record<VolunteerTopic, VenueSop>> = {
  "accessible-entry": {
    title: "Accessible entrance assistance",
    steps: [
      "Ask what mobility or sensory support the guest needs without requesting a diagnosis.",
      "Use the signed east-plaza step-free route to the Gate B assistance desk.",
      "Offer to contact the trained accessibility host.",
      "Use only a route confirmed open by venue control.",
    ],
    escalationRequired: false,
    escalationReason:
      "Escalate if the signed route is blocked, the guest is distressed, or medical help is requested.",
    contactRole: "Gate B accessibility host",
    authorityBoundary:
      "Volunteers may guide guests on approved routes but may not create a diversion or provide physical assistance without consent and training.",
  },
  "lost-person": {
    title: "Lost person or separated family",
    steps: [
      "Keep the reporting guest at the nearest staffed assistance point.",
      "Record only the minimum description needed by venue control.",
      "Contact the guest-services supervisor using the approved radio channel.",
      "Do not broadcast personal details publicly.",
    ],
    escalationRequired: true,
    escalationReason:
      "All lost-person reports must be handed to the trained guest-services and security teams.",
    contactRole: "Guest-services supervisor",
    authorityBoundary:
      "Volunteers must not independently search restricted areas or share personal information.",
  },
  medical: {
    title: "Medical assistance",
    steps: [
      "Contact medical command immediately through the approved channel.",
      "State the signed location marker and visible hazards.",
      "Keep access clear and follow the medical commander's instructions.",
      "Do not diagnose, move, or treat the guest unless specifically trained and directed.",
    ],
    escalationRequired: true,
    escalationReason:
      "Medical concerns are outside standard volunteer authority and require trained responders.",
    contactRole: "Medical command",
    authorityBoundary:
      "Do not improvise treatment or move a person in distress unless the area is immediately unsafe and trained staff direct you.",
  },
  transport: {
    title: "Transport disruption assistance",
    steps: [
      "Check the approved transport status bulletin.",
      "Share only the listed accessible alternatives and estimated times.",
      "Direct guests to the transport liaison desk for individual support.",
    ],
    escalationRequired: false,
    escalationReason:
      "Escalate when no approved accessible option is listed or a guest may miss essential assistance.",
    contactRole: "Transport liaison",
    authorityBoundary:
      "Volunteers may relay approved updates but cannot promise departures, capacity, refunds, or unlisted transport.",
  },
  crowd: {
    title: "Crowd concern",
    steps: [
      "Report the signed location and observable concern to crowd control.",
      "Keep emergency and step-free paths clear.",
      "Follow approved steward instructions and avoid creating a counter-flow.",
    ],
    escalationRequired: true,
    escalationReason:
      "Crowd interventions require the trained crowd-safety team and human approval.",
    contactRole: "Crowd safety lead",
    authorityBoundary:
      "Volunteers must not open barriers, redirect a crowd, or make emergency announcements without authorization.",
  },
};

export interface VolunteerScenarioFacts {
  readonly accessRouteUnavailable: boolean;
  readonly alerts: readonly string[];
}

export function buildVolunteerGrounding(
  request: VolunteerRequest,
  scenario: VolunteerScenarioFacts,
): VolunteerGrounding {
  const accessRouteUnavailable =
    request.topic === "accessible-entry" && scenario.accessRouteUnavailable;
  const baseSop = SOPS[request.topic];
  const sop: VenueSop = accessRouteUnavailable
    ? {
        ...baseSop,
        steps: [
          "Keep the guest at the nearest staffed assistance point.",
          "Contact the accessibility lead through the approved channel.",
          "Wait for venue control to confirm a signed step-free alternative.",
          "Do not improvise or communicate an unverified diversion.",
        ],
        escalationRequired: true,
        escalationReason:
          "The shared simulation reports an accessible-route obstruction that requires venue-control confirmation.",
        contactRole: "Accessibility lead and venue control",
      }
    : baseSop;

  return {
    sop,
    localizedFallback: getVolunteerFallback(
      request.language,
      request.topic,
      accessRouteUnavailable,
    ),
    scenarioContext: {
      scenario: request.scenario,
      alerts: scenario.alerts,
    },
  };
}

/** Builds the canonical offline grounding without loading the simulation engine. */
export function getVolunteerFallbackGrounding(request: VolunteerRequest): VolunteerGrounding {
  return buildVolunteerGrounding(request, {
    accessRouteUnavailable: request.scenario === "accessibility-obstruction",
    alerts: [],
  });
}
