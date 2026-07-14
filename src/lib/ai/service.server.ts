import "server-only";

import { getServerEnvironment } from "@/lib/config/env.server";

import { generateValidatedJson } from "./client.server";
import { createFanFallback, createOperationsFallback, createVolunteerFallback } from "./fallback";
import {
  buildFanPrompt,
  buildOperationsPrompt,
  buildVolunteerPrompt,
  FAN_NARRATIVE_JSON_SCHEMA,
  FAN_SYSTEM_INSTRUCTION,
  OPERATIONS_NARRATIVE_JSON_SCHEMA,
  OPERATIONS_SYSTEM_INSTRUCTION,
  VOLUNTEER_NARRATIVE_JSON_SCHEMA,
  VOLUNTEER_SYSTEM_INSTRUCTION,
} from "./prompts";
import {
  fanAssistanceResponseSchema,
  fanNarrativeSchema,
  operationsBriefSchema,
  operationsNarrativeSchema,
  volunteerAssistanceResponseSchema,
  volunteerNarrativeSchema,
  type FanAssistRequest,
  type FanAssistanceResponse,
  type OperationsAction,
  type OperationsBrief,
  type OperationsBriefRequest,
  type VolunteerAssistanceResponse,
  type VolunteerRequest,
} from "./schemas";
import {
  getAccessibleRoute,
  getOperationsSnapshot,
  getVenueSop,
  type GroundedAction,
  type OperationsGrounding,
} from "./tools";

export interface AiServiceResult<T> {
  readonly data: T;
  readonly mode: "gemini" | "demo" | "fallback";
}

function offlineMode(): "demo" | "fallback" | undefined {
  const environment = getServerEnvironment();
  if (environment.aiDemoMode) {
    return "demo";
  }
  if (environment.geminiApiKey === undefined) {
    return environment.nodeEnv === "production" ? "fallback" : "demo";
  }
  return undefined;
}

function trustedEvidence(grounding: OperationsGrounding, index: number): string[] {
  return [
    grounding.evidence[index % grounding.evidence.length] ?? "Trusted simulated venue snapshot.",
  ];
}

function affectedZone(grounding: OperationsGrounding, index: number): string {
  return grounding.affectedZones[index % grounding.affectedZones.length] ?? "venue-wide";
}

function supportingMetrics(grounding: OperationsGrounding, index: number): string[] {
  const first = grounding.evidence[index % grounding.evidence.length];
  const occupancy = grounding.evidence[0];
  return [...new Set([first, occupancy].filter((value): value is string => value !== undefined))];
}

function composeAction(
  grounded: GroundedAction,
  grounding: OperationsGrounding,
  index: number,
): OperationsAction {
  return {
    id: `action-${index + 1}`,
    priority: Math.min(5, index + 1),
    title: grounded.title,
    description: grounded.description,
    ownerTeam: grounded.ownerTeam,
    affectedZone: affectedZone(grounding, index),
    rationale: grounded.rationale,
    supportingMetrics: supportingMetrics(grounding, index),
    evidence: trustedEvidence(grounding, index),
    confidence: 0.95,
    requiresHumanApproval: true,
    approvalStatus: "pending",
  };
}

export async function assistFan(
  request: FanAssistRequest,
): Promise<AiServiceResult<FanAssistanceResponse>> {
  const grounding = getAccessibleRoute(request);
  const fallback = createFanFallback(request, grounding);
  const mode = offlineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  try {
    const narrative = await generateValidatedJson({
      systemInstruction: FAN_SYSTEM_INSTRUCTION,
      prompt: buildFanPrompt(request, grounding),
      responseJsonSchema: FAN_NARRATIVE_JSON_SCHEMA,
      schema: fanNarrativeSchema,
    });
    return {
      data: fanAssistanceResponseSchema.parse({
        ...fallback,
        summary: narrative.summary,
        confidence: narrative.confidence,
        fallbackUsed: false,
      }),
      mode: "gemini",
    };
  } catch {
    return { data: fallback, mode: "fallback" };
  }
}

export async function createOperationsBrief(
  request: OperationsBriefRequest,
): Promise<AiServiceResult<OperationsBrief>> {
  const grounding = getOperationsSnapshot(request);
  const fallback = createOperationsFallback(request, grounding);
  const mode = offlineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  try {
    const narrative = await generateValidatedJson({
      systemInstruction: OPERATIONS_SYSTEM_INSTRUCTION,
      prompt: buildOperationsPrompt(request, grounding),
      responseJsonSchema: OPERATIONS_NARRATIVE_JSON_SCHEMA,
      schema: operationsNarrativeSchema,
    });
    const actions = grounding.recommendedActions.map((action, index) =>
      composeAction(action, grounding, index),
    );
    return {
      data: operationsBriefSchema.parse({
        ...fallback,
        summary: narrative.summary,
        priorityActions: actions,
        confidence: narrative.confidence,
        fallbackUsed: false,
      }),
      mode: "gemini",
    };
  } catch {
    return { data: fallback, mode: "fallback" };
  }
}

export async function assistVolunteer(
  request: VolunteerRequest,
): Promise<AiServiceResult<VolunteerAssistanceResponse>> {
  const grounding = getVenueSop(request);
  const fallback = createVolunteerFallback(request, grounding);
  const mode = offlineMode();
  if (mode !== undefined) {
    return { data: fallback, mode };
  }

  try {
    const narrative = await generateValidatedJson({
      systemInstruction: VOLUNTEER_SYSTEM_INSTRUCTION,
      prompt: buildVolunteerPrompt(request, grounding),
      responseJsonSchema: VOLUNTEER_NARRATIVE_JSON_SCHEMA,
      schema: volunteerNarrativeSchema,
    });
    return {
      data: volunteerAssistanceResponseSchema.parse({
        ...fallback,
        summary: narrative.summary,
        confidence: narrative.confidence,
        fallbackUsed: false,
      }),
      mode: "gemini",
    };
  } catch {
    return { data: fallback, mode: "fallback" };
  }
}
