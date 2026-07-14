import { z } from "zod";
import {
  SCENARIO_IDS,
  SUPPORTED_LANGUAGE_IDS,
  VOLUNTEER_ROLE_IDS,
  VOLUNTEER_TOPIC_IDS,
} from "@/lib/domain/constants";

export type {
  ScenarioId,
  SupportedLanguage,
  VolunteerRole,
  VolunteerTopic,
} from "@/lib/domain/constants";

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGE_IDS);

export const scenarioSchema = z.enum(SCENARIO_IDS);

const safeIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/);

export const fanPreferencesSchema = z
  .object({
    stepFree: z.boolean().default(false),
    avoidCrowds: z.boolean().default(true),
    preferQuiet: z.boolean().default(false),
    avoidAccessibilityObstructions: z.boolean().default(true),
  })
  .strict();

export const fanAssistRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(600),
    language: supportedLanguageSchema.default("en"),
    currentLocation: safeIdentifierSchema,
    destination: safeIdentifierSchema,
    preferences: fanPreferencesSchema.default({
      stepFree: false,
      avoidCrowds: true,
      preferQuiet: false,
      avoidAccessibilityObstructions: true,
    }),
    scenario: scenarioSchema.default("normal"),
  })
  .strict();
export type FanAssistRequest = z.infer<typeof fanAssistRequestSchema>;

export const crowdLevelSchema = z.enum(["low", "moderate", "high", "critical"]);

export const routeStepSchema = z
  .object({
    id: z.string().min(1).max(120),
    instruction: z.string().min(1).max(500),
    distanceMeters: z.number().nonnegative().max(10_000),
    estimatedMinutes: z.number().nonnegative().max(180),
    crowdLevel: crowdLevelSchema,
    accessibilityNotes: z.array(z.string().min(1).max(240)).max(5),
  })
  .strict();

export const nearbyFacilitySchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(160),
    type: z.string().min(1).max(80),
    locationId: z.string().min(1).max(100),
    accessible: z.boolean(),
  })
  .strict();

export const routeResultSchema = z
  .object({
    originId: z.string().min(1).max(100),
    destinationId: z.string().min(1).max(100),
    totalDistanceMeters: z.number().nonnegative().max(25_000),
    estimatedWalkingMinutes: z.number().nonnegative().max(240),
    stepFree: z.boolean(),
    crowdLevel: crowdLevelSchema,
    // A zero-step route is valid when the fan is already at the destination.
    steps: z.array(routeStepSchema).max(30),
    nearbyFacilities: z.array(nearbyFacilitySchema).max(12),
  })
  .strict();
export type RouteResult = z.infer<typeof routeResultSchema>;

export const alertSummarySchema = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(160),
    message: z.string().min(1).max(400),
    severity: crowdLevelSchema,
    zoneId: z.string().min(1).max(100).optional(),
    simulated: z.literal(true),
  })
  .strict();
export type AlertSummary = z.infer<typeof alertSummarySchema>;

export const fanTransportOptionSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(160),
    mode: z.enum(["train", "metro", "bus", "shuttle", "taxi", "rideshare", "walk", "cycle"]),
    status: z.enum(["on-time", "minor-delay", "major-delay", "suspended", "crowded"]),
    waitMinutes: z.number().nonnegative().max(240),
    totalJourneyMinutes: z.number().nonnegative().max(480),
    accessible: z.boolean(),
    destinationNodeId: z.string().min(1).max(100),
    note: z.string().min(1).max(300),
    simulated: z.literal(true),
  })
  .strict();
export type FanTransportOption = z.infer<typeof fanTransportOptionSchema>;

export const fanAssistanceResponseSchema = z
  .object({
    intent: z.enum(["navigation", "facility", "transport", "accessibility", "general"]),
    language: supportedLanguageSchema,
    summary: z.string().min(1).max(1_500),
    route: routeResultSchema.optional(),
    transportOptions: z.array(fanTransportOptionSchema).max(8).optional(),
    alerts: z.array(alertSummarySchema).max(10),
    accessibilityNotes: z.array(z.string().min(1).max(400)).max(10),
    nextSteps: z.array(z.string().min(1).max(400)).min(1).max(8),
    confidence: z.number().min(0).max(1),
    handoffRequired: z.boolean(),
    fallbackUsed: z.boolean(),
    simulated: z.literal(true),
  })
  .strict();
export type FanAssistanceResponse = z.infer<typeof fanAssistanceResponseSchema>;

export const operationsBriefRequestSchema = z
  .object({
    scenario: scenarioSchema,
    language: supportedLanguageSchema.default("en"),
    seed: z.number().int().nonnegative().max(2_147_483_647).optional(),
    tick: z.number().int().nonnegative().max(10_000).optional(),
  })
  .strict();
export type OperationsBriefRequest = z.infer<typeof operationsBriefRequestSchema>;

export const operationsActionSchema = z
  .object({
    id: z.string().min(1).max(100),
    priority: z.number().int().min(1).max(5),
    title: z.string().min(1).max(160),
    description: z.string().min(1).max(600),
    ownerTeam: z.string().min(1).max(120),
    affectedZone: z.string().min(1).max(100),
    rationale: z.string().min(1).max(600),
    supportingMetrics: z.array(z.string().min(1).max(300)).min(1).max(6),
    evidence: z.array(z.string().min(1).max(300)).min(1).max(6),
    confidence: z.number().min(0).max(1),
    requiresHumanApproval: z.literal(true),
    approvalStatus: z.literal("pending"),
  })
  .strict();
export type OperationsAction = z.infer<typeof operationsActionSchema>;

export const operationsBriefSchema = z
  .object({
    scenario: scenarioSchema,
    summary: z.string().min(1).max(1_500),
    riskLevel: crowdLevelSchema,
    priorityActions: z.array(operationsActionSchema).max(8),
    affectedZones: z.array(z.string().min(1).max(100)).max(20),
    evidence: z.array(z.string().min(1).max(400)).min(1).max(15),
    confidence: z.number().min(0).max(1),
    requiresHumanApproval: z.literal(true),
    fallbackUsed: z.boolean(),
    simulated: z.literal(true),
  })
  .strict();
export type OperationsBrief = z.infer<typeof operationsBriefSchema>;

export const volunteerRoleSchema = z.enum(VOLUNTEER_ROLE_IDS);

export const volunteerTopicSchema = z.enum(VOLUNTEER_TOPIC_IDS);

export const volunteerRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(600),
    language: supportedLanguageSchema.default("en"),
    role: volunteerRoleSchema,
    topic: volunteerTopicSchema,
    scenario: scenarioSchema.default("normal"),
  })
  .strict();
export type VolunteerRequest = z.infer<typeof volunteerRequestSchema>;

export const volunteerAssistanceResponseSchema = z
  .object({
    language: supportedLanguageSchema,
    sopTitle: z.string().min(1).max(180),
    summary: z.string().min(1).max(1_500),
    checklist: z.array(z.string().min(1).max(400)).min(1).max(8),
    escalationRequired: z.boolean(),
    escalationReason: z.string().min(1).max(500),
    contactRole: z.string().min(1).max(120),
    authorityBoundary: z.string().min(1).max(500),
    confidence: z.number().min(0).max(1),
    fallbackUsed: z.boolean(),
    simulated: z.literal(true),
  })
  .strict();
export type VolunteerAssistanceResponse = z.infer<typeof volunteerAssistanceResponseSchema>;

export const fanNarrativeSchema = z
  .object({
    summary: z.string().trim().min(1).max(400),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type FanNarrative = z.infer<typeof fanNarrativeSchema>;

export const operationsNarrativeSchema = z
  .object({
    summary: z.string().trim().min(1).max(400),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type OperationsNarrative = z.infer<typeof operationsNarrativeSchema>;

export const volunteerNarrativeSchema = z
  .object({
    summary: z.string().trim().min(1).max(400),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type VolunteerNarrative = z.infer<typeof volunteerNarrativeSchema>;

export const aiResponseModeSchema = z.enum(["gemini", "demo", "fallback"]);
export type AiResponseMode = z.infer<typeof aiResponseModeSchema>;

export interface SuccessEnvelope<T> {
  readonly data: T;
  readonly meta: Readonly<{
    mode: AiResponseMode;
    simulated: true;
  }>;
}

/** Builds the runtime counterpart of `SuccessEnvelope` for a concrete response schema. */
export function successEnvelopeSchema<TSchema extends z.ZodType>(dataSchema: TSchema) {
  return z
    .object({
      data: dataSchema,
      meta: z
        .object({
          mode: aiResponseModeSchema,
          simulated: z.literal(true),
        })
        .strict(),
    })
    .strict();
}
