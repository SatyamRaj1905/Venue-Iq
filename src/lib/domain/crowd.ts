import type {
  CrowdRiskInput,
  DensityLevel,
  RedistributionSuggestion,
  ZoneCrowdInput,
  ZoneCrowdMetrics,
  ZoneStatus,
} from "./types";

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite, non-negative number.`);
  }
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite number greater than zero.`);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimalPlaces = 1): number {
  const multiplier = 10 ** decimalPlaces;
  return Math.round(value * multiplier) / multiplier;
}

export function calculateOccupancyPercentage(occupancy: number, capacity: number): number {
  assertNonNegative(occupancy, "Occupancy");
  assertPositive(capacity, "Capacity");
  return round((occupancy / capacity) * 100);
}

export function calculateDensityPeoplePerSquareMeter(
  occupancy: number,
  areaSquareMeters: number,
): number {
  assertNonNegative(occupancy, "Occupancy");
  assertPositive(areaSquareMeters, "Area");
  return round(occupancy / areaSquareMeters, 2);
}

export function classifyDensity(densityPeoplePerSquareMeter: number): DensityLevel {
  assertNonNegative(densityPeoplePerSquareMeter, "Density");
  if (densityPeoplePerSquareMeter >= 4) {
    return "critical";
  }
  if (densityPeoplePerSquareMeter >= 3) {
    return "high";
  }
  if (densityPeoplePerSquareMeter >= 1.75) {
    return "moderate";
  }
  if (densityPeoplePerSquareMeter >= 0.75) {
    return "low";
  }
  return "very-low";
}

/** Returns the observed gate throughput in people per hour. */
export function calculateGateThroughput(entriesInWindow: number, windowMinutes: number): number {
  assertNonNegative(entriesInWindow, "Entry count");
  assertPositive(windowMinutes, "Observation window");
  return Math.round((entriesInWindow / windowMinutes) * 60);
}

/** Queue estimate based on the observed throughput, in minutes. */
export function estimateQueueTime(queuedPeople: number, throughputPerHour: number): number {
  assertNonNegative(queuedPeople, "Queued people");
  if (queuedPeople === 0) {
    return 0;
  }
  assertPositive(throughputPerHour, "Throughput");
  return round(queuedPeople / (throughputPerHour / 60));
}

export function calculateCrowdRiskScore(input: CrowdRiskInput): number {
  assertNonNegative(input.occupancyPercentage, "Occupancy percentage");
  assertNonNegative(input.densityPeoplePerSquareMeter, "Density");
  assertNonNegative(input.queueMinutes, "Queue time");
  const incidentCount = input.activeIncidentCount ?? 0;
  assertNonNegative(incidentCount, "Active incident count");

  const occupancyComponent = clamp(input.occupancyPercentage / 120, 0, 1) * 45;
  const densityComponent = clamp(input.densityPeoplePerSquareMeter / 4.5, 0, 1) * 30;
  const queueComponent = clamp(input.queueMinutes / 30, 0, 1) * 20;
  const incidentComponent = clamp(incidentCount * 5, 0, 15);
  return round(
    clamp(occupancyComponent + densityComponent + queueComponent + incidentComponent, 0, 100),
  );
}

export function classifyZoneStatus(riskScore: number): ZoneStatus {
  assertNonNegative(riskScore, "Risk score");
  if (riskScore > 100) {
    throw new RangeError("Risk score cannot exceed 100.");
  }
  if (riskScore >= 80) {
    return "critical";
  }
  if (riskScore >= 60) {
    return "congested";
  }
  if (riskScore >= 35) {
    return "busy";
  }
  return "normal";
}

export function calculateZoneCrowdMetrics(input: ZoneCrowdInput): ZoneCrowdMetrics {
  const occupancyPercentage = calculateOccupancyPercentage(input.occupancy, input.capacity);
  const densityPeoplePerSquareMeter = calculateDensityPeoplePerSquareMeter(
    input.occupancy,
    input.areaSquareMeters,
  );
  const throughputPerHour = calculateGateThroughput(input.entriesInWindow, input.windowMinutes);
  const queueMinutes = estimateQueueTime(input.queuedPeople, throughputPerHour);
  const riskScore = calculateCrowdRiskScore({
    occupancyPercentage,
    densityPeoplePerSquareMeter,
    queueMinutes,
    ...(input.activeIncidentCount === undefined
      ? {}
      : { activeIncidentCount: input.activeIncidentCount }),
  });

  return {
    zoneId: input.zoneId,
    occupancy: input.occupancy,
    capacity: input.capacity,
    occupancyPercentage,
    densityPeoplePerSquareMeter,
    densityLevel: classifyDensity(densityPeoplePerSquareMeter),
    queuedPeople: input.queuedPeople,
    throughputPerHour,
    queueMinutes,
    riskScore,
    status: classifyZoneStatus(riskScore),
    simulated: true,
  };
}

function targetHeadroom(zone: ZoneCrowdMetrics): number {
  return Math.max(0, Math.floor(zone.capacity * 0.75 - zone.occupancy));
}

function sourceExcess(zone: ZoneCrowdMetrics): number {
  return Math.max(0, Math.ceil(zone.occupancy - zone.capacity * 0.78));
}

export function suggestFanRedistribution(
  zones: readonly ZoneCrowdMetrics[],
): readonly RedistributionSuggestion[] {
  const sources = zones
    .filter((zone) => zone.status === "congested" || zone.status === "critical")
    .sort((left, right) => right.riskScore - left.riskScore);
  const targets = zones
    .filter((zone) => zone.status === "normal" || zone.status === "busy")
    .sort(
      (left, right) => left.riskScore - right.riskScore || left.zoneId.localeCompare(right.zoneId),
    );
  const remainingHeadroom = new Map(
    targets.map((target) => [target.zoneId, targetHeadroom(target)]),
  );
  const suggestions: RedistributionSuggestion[] = [];

  for (const source of sources) {
    let remainingExcess = sourceExcess(source);
    for (const target of targets) {
      const headroom = remainingHeadroom.get(target.zoneId) ?? 0;
      const suggestedPeople = Math.min(remainingExcess, headroom);
      if (suggestedPeople <= 0) {
        continue;
      }
      suggestions.push({
        fromZoneId: source.zoneId,
        toZoneId: target.zoneId,
        suggestedPeople,
        reason: `${source.zoneId} is ${source.status}; ${target.zoneId} has lower simulated crowd risk.`,
        requiresHumanApproval: true,
      });
      remainingExcess -= suggestedPeople;
      remainingHeadroom.set(target.zoneId, headroom - suggestedPeople);
      if (remainingExcess === 0) {
        break;
      }
    }
  }

  return suggestions;
}
