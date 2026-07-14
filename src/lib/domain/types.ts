/**
 * Shared deterministic domain contracts for VenueIQ.
 *
 * All measurements use SI units and all percentages use the 0-100 scale unless
 * a field explicitly says otherwise. Domain values are simulated demo data.
 */

import type { ScenarioId } from "./constants";

export type NodeId = string;
export type EdgeId = string;
export type ZoneId = string;

export type StadiumNodeKind =
  | "gate"
  | "section"
  | "concourse"
  | "lift"
  | "stairs"
  | "ramp"
  | "toilet"
  | "accessible-toilet"
  | "medical"
  | "water-refill"
  | "assistance-desk"
  | "food"
  | "transport-pickup";

export type FacilityKind = Extract<
  StadiumNodeKind,
  | "toilet"
  | "accessible-toilet"
  | "medical"
  | "water-refill"
  | "assistance-desk"
  | "food"
  | "transport-pickup"
  | "lift"
>;

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export interface StadiumNode {
  readonly id: NodeId;
  readonly name: string;
  readonly kind: StadiumNodeKind;
  readonly zoneId: ZoneId;
  readonly level: number;
  readonly position: MapPosition;
  readonly accessible: boolean;
  /** 0 is noisy; 100 is very quiet. */
  readonly quietScore: number;
  readonly description: string;
}

export type StadiumPathKind = "walkway" | "accessible-path" | "ramp" | "lift" | "stairs";

export type PathStatus = "open" | "restricted" | "closed";

export interface StadiumEdge {
  readonly id: EdgeId;
  readonly from: NodeId;
  readonly to: NodeId;
  readonly bidirectional: boolean;
  readonly distanceMeters: number;
  readonly kind: StadiumPathKind;
  readonly stepFree: boolean;
  readonly widthMeters: number;
  /** 0 is noisy; 100 is very quiet. */
  readonly quietScore: number;
  /** Baseline path load on a 0-1 scale. */
  readonly baselineCrowd: number;
  readonly status: PathStatus;
  readonly accessibilityObstructed: boolean;
  readonly zoneIds: readonly ZoneId[];
}

export interface StadiumZone {
  readonly id: ZoneId;
  readonly name: string;
  readonly capacity: number;
  readonly areaSquareMeters: number;
  readonly level: number;
}

export interface StadiumGraph {
  readonly nodes: readonly StadiumNode[];
  readonly edges: readonly StadiumEdge[];
  readonly zones: readonly StadiumZone[];
}

export type CrowdLevel = "low" | "moderate" | "high" | "critical";

export interface RoutePreferences {
  readonly stepFree?: boolean;
  readonly avoidCrowds?: boolean;
  readonly preferQuiet?: boolean;
  readonly avoidAccessibilityObstructions?: boolean;
  /** Typical walking speed is 1.3 m/s; accessible default is 1.0 m/s. */
  readonly walkingSpeedMetersPerSecond?: number;
}

export interface RouteConditions {
  readonly closedEdgeIds?: readonly EdgeId[];
  readonly closedNodeIds?: readonly NodeId[];
  readonly obstructedEdgeIds?: readonly EdgeId[];
  /** Occupancy percentage keyed by zone id. Values may exceed 100. */
  readonly crowdByZone?: Readonly<Record<ZoneId, number>>;
}

export interface RouteRequest {
  readonly originId: NodeId;
  readonly destinationId: NodeId;
  readonly preferences?: RoutePreferences;
  readonly conditions?: RouteConditions;
}

export interface RouteStep {
  readonly index: number;
  readonly fromNodeId: NodeId;
  readonly fromName: string;
  readonly toNodeId: NodeId;
  readonly toName: string;
  readonly edgeId: EdgeId;
  readonly instruction: string;
  readonly distanceMeters: number;
  readonly estimatedSeconds: number;
  readonly pathKind: StadiumPathKind;
  readonly zoneIds: readonly ZoneId[];
  readonly stepFree: boolean;
  readonly crowdLevel: CrowdLevel;
  readonly accessibilityNote: string;
}

export interface NearbyFacility {
  readonly id: NodeId;
  readonly name: string;
  readonly kind: FacilityKind;
  readonly zoneId: ZoneId;
  readonly accessible: boolean;
  readonly distanceFromRouteMeters: number;
}

export interface RouteResult {
  readonly originId: NodeId;
  readonly destinationId: NodeId;
  readonly nodeIds: readonly NodeId[];
  readonly edgeIds: readonly EdgeId[];
  readonly steps: readonly RouteStep[];
  readonly totalDistanceMeters: number;
  readonly estimatedWalkingSeconds: number;
  readonly estimatedWalkingMinutes: number;
  /** Weighted distance used to choose the route, not physical distance. */
  readonly scoreMeters: number;
  readonly crowdLevel: CrowdLevel;
  readonly isStepFree: boolean;
  readonly explanations: readonly string[];
  readonly nearbyFacilities: readonly NearbyFacility[];
  readonly simulated: true;
}

export type RouteFailureReason = "unknown-origin" | "unknown-destination" | "no-route";

export type RouteSearchResult =
  | { readonly found: true; readonly route: RouteResult }
  | {
      readonly found: false;
      readonly reason: RouteFailureReason;
      readonly message: string;
      readonly simulated: true;
    };

export type DensityLevel = "very-low" | "low" | "moderate" | "high" | "critical";

export type ZoneStatus = "normal" | "busy" | "congested" | "critical";

export interface ZoneCrowdInput {
  readonly zoneId: ZoneId;
  readonly occupancy: number;
  readonly capacity: number;
  readonly areaSquareMeters: number;
  readonly queuedPeople: number;
  readonly entriesInWindow: number;
  readonly windowMinutes: number;
  readonly activeIncidentCount?: number;
}

export interface ZoneCrowdMetrics {
  readonly zoneId: ZoneId;
  readonly occupancy: number;
  readonly capacity: number;
  readonly occupancyPercentage: number;
  readonly densityPeoplePerSquareMeter: number;
  readonly densityLevel: DensityLevel;
  readonly queuedPeople: number;
  readonly throughputPerHour: number;
  readonly queueMinutes: number;
  readonly riskScore: number;
  readonly status: ZoneStatus;
  readonly simulated: true;
}

export interface CrowdRiskInput {
  readonly occupancyPercentage: number;
  readonly densityPeoplePerSquareMeter: number;
  readonly queueMinutes: number;
  readonly activeIncidentCount?: number;
}

export interface RedistributionSuggestion {
  readonly fromZoneId: ZoneId;
  readonly toZoneId: ZoneId;
  readonly suggestedPeople: number;
  readonly reason: string;
  readonly requiresHumanApproval: true;
}

export type IncidentType =
  | "gate-closure"
  | "crowd-congestion"
  | "transport-disruption"
  | "heat"
  | "medical"
  | "accessibility-obstruction"
  | "waste-overflow"
  | "security"
  | "other";

export type IncidentSeverity = "low" | "moderate" | "high" | "critical";
export type MedicalUrgency = "routine" | "urgent" | "life-threatening";
export type IncidentStatus = "active" | "monitoring" | "resolved";

export type EscalationRole =
  | "venue-operations"
  | "crowd-safety-lead"
  | "transport-liaison"
  | "medical-command"
  | "accessibility-lead"
  | "sustainability-lead"
  | "security-control";

export type SopCategory =
  | "access-and-egress"
  | "crowd-management"
  | "transport-contingency"
  | "heat-response"
  | "medical-response"
  | "accessible-route-contingency"
  | "waste-response"
  | "security-response"
  | "general-operations";

export interface IncidentInput {
  readonly id: string;
  readonly type: IncidentType;
  readonly title: string;
  readonly zoneIds: readonly ZoneId[];
  /** Minutes since the demo simulation began. */
  readonly reportedAtMinute: number;
  readonly peopleAffected: number;
  readonly blockingCriticalRoute?: boolean;
  readonly medicalUrgency?: MedicalUrgency;
  readonly status?: IncidentStatus;
}

export interface OperationalIncident {
  readonly id: string;
  readonly type: IncidentType;
  readonly title: string;
  readonly zoneIds: readonly ZoneId[];
  readonly reportedAtMinute: number;
  readonly peopleAffected: number;
  readonly severity: IncidentSeverity;
  readonly escalationRole: EscalationRole;
  readonly sopCategory: SopCategory;
  readonly priorityScore: number;
  readonly status: IncidentStatus;
  readonly requiresHumanApproval: true;
  readonly simulated: true;
}

export type TransportMode =
  "train" | "metro" | "bus" | "shuttle" | "taxi" | "rideshare" | "walk" | "cycle";

export type TransportServiceStatus =
  "on-time" | "minor-delay" | "major-delay" | "suspended" | "crowded";

export interface TransportService {
  readonly id: string;
  readonly name: string;
  readonly mode: TransportMode;
  readonly status: TransportServiceStatus;
  readonly waitMinutes: number;
  readonly travelMinutes: number;
  readonly delayMinutes: number;
  readonly capacityUtilizationPercentage: number;
  readonly accessible: boolean;
  readonly destinationNodeId: NodeId;
  readonly note: string;
  readonly simulated: true;
}

export interface TransportPreferences {
  readonly accessibleOnly?: boolean;
  readonly preferredModes?: readonly TransportMode[];
  readonly maximumWaitMinutes?: number;
}

export interface RankedTransportOption extends TransportService {
  readonly totalJourneyMinutes: number;
  readonly rankScore: number;
}

export type TransportNetworkStatus = "normal" | "strained" | "disrupted";

export interface TransportSnapshot {
  readonly services: readonly TransportService[];
  readonly networkStatus: TransportNetworkStatus;
  readonly averageDelayMinutes: number;
  readonly accessibleServiceCount: number;
  readonly summary: string;
  readonly simulated: true;
}

export type SustainabilityStatus = "on-track" | "watch" | "action-required";

export type EnergyTrend = "improving" | "stable" | "increasing";

export interface SustainabilityInput {
  readonly totalArrivals: number;
  readonly publicTransportArrivals: number;
  readonly waterRefills: number;
  readonly totalWasteKilograms: number;
  readonly binCapacityKilograms: number;
  readonly currentEnergyKwh: number;
  readonly baselineEnergyKwh: number;
}

export interface SustainabilitySnapshot {
  readonly publicTransportUsagePercentage: number;
  readonly waterRefillLiters: number;
  readonly singleUseBottlesAvoided: number;
  readonly wasteBinUtilizationPercentage: number;
  readonly energyChangePercentage: number;
  readonly energyTrend: EnergyTrend;
  readonly estimatedEmissionsAvoidedKilograms: number;
  readonly status: SustainabilityStatus;
  readonly simulated: true;
}

export interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly name: string;
  readonly description: string;
  readonly affectedZoneIds: readonly ZoneId[];
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface StadiumAlert {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly severity: AlertSeverity;
  readonly zoneIds: readonly ZoneId[];
  readonly simulated: true;
}

export interface GateSimulationMetrics {
  readonly gateNodeId: NodeId;
  readonly entriesInLast15Minutes: number;
  readonly throughputPerHour: number;
  readonly queuedPeople: number;
  readonly estimatedQueueMinutes: number;
  readonly status: ZoneStatus;
  readonly simulated: true;
}

export interface SimulationTimelineEvent {
  readonly id: string;
  readonly minute: number;
  readonly label: string;
  readonly detail: string;
  readonly severity: AlertSeverity;
  readonly simulated: true;
}

export interface SimulationState {
  readonly scenarioId: ScenarioId;
  readonly seed: number;
  readonly tick: number;
  readonly paused: boolean;
  readonly lastUpdatedIso: string;
  readonly affectedZoneIds: readonly ZoneId[];
  readonly zones: readonly ZoneCrowdMetrics[];
  readonly gates: readonly GateSimulationMetrics[];
  readonly routeConditions: RouteConditions;
  readonly transport: TransportSnapshot;
  readonly incidents: readonly OperationalIncident[];
  readonly sustainability: SustainabilitySnapshot;
  readonly alerts: readonly StadiumAlert[];
  readonly timeline: readonly SimulationTimelineEvent[];
  readonly totalOccupancy: number;
  readonly capacity: number;
  readonly occupancyPercentage: number;
  readonly simulated: true;
}
