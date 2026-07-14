import type {
  EnergyTrend,
  SustainabilityInput,
  SustainabilitySnapshot,
  SustainabilityStatus,
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

function round(value: number, decimalPlaces = 1): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

export function calculatePublicTransportUsage(
  publicTransportArrivals: number,
  totalArrivals: number,
): number {
  assertNonNegative(publicTransportArrivals, "Public transport arrivals");
  assertNonNegative(totalArrivals, "Total arrivals");
  if (totalArrivals === 0) {
    return 0;
  }
  if (publicTransportArrivals > totalArrivals) {
    throw new RangeError("Public transport arrivals cannot exceed total arrivals.");
  }
  return round((publicTransportArrivals / totalArrivals) * 100);
}

export interface WaterRefillMetrics {
  readonly liters: number;
  readonly singleUseBottlesAvoided: number;
}

export function calculateWaterRefillUsage(
  refillCount: number,
  averageLitersPerRefill = 0.6,
): WaterRefillMetrics {
  assertNonNegative(refillCount, "Water refill count");
  assertPositive(averageLitersPerRefill, "Average liters per refill");
  const liters = round(refillCount * averageLitersPerRefill);
  return {
    liters,
    singleUseBottlesAvoided: Math.floor(liters / 0.5),
  };
}

export function calculateWasteBinUtilization(
  totalWasteKilograms: number,
  binCapacityKilograms: number,
): number {
  assertNonNegative(totalWasteKilograms, "Total waste");
  assertPositive(binCapacityKilograms, "Bin capacity");
  return round((totalWasteKilograms / binCapacityKilograms) * 100);
}

export interface EnergyTrendMetrics {
  readonly changePercentage: number;
  readonly trend: EnergyTrend;
}

export function calculateEnergyConsumptionTrend(
  currentEnergyKwh: number,
  baselineEnergyKwh: number,
): EnergyTrendMetrics {
  assertNonNegative(currentEnergyKwh, "Current energy consumption");
  assertPositive(baselineEnergyKwh, "Baseline energy consumption");
  const changePercentage = round(
    ((currentEnergyKwh - baselineEnergyKwh) / baselineEnergyKwh) * 100,
  );
  const trend: EnergyTrend =
    changePercentage <= -2 ? "improving" : changePercentage >= 2 ? "increasing" : "stable";
  return { changePercentage, trend };
}

/**
 * Estimates avoided road emissions versus equivalent private-car journeys.
 * The default 0.09 kg/person-km delta is an explicit simulation assumption.
 */
export function estimateEmissionsAvoided(
  publicTransportTrips: number,
  averageJourneyKilometers = 12,
  avoidedKilogramsPerPersonKilometer = 0.09,
): number {
  assertNonNegative(publicTransportTrips, "Public transport trips");
  assertNonNegative(averageJourneyKilometers, "Average journey distance");
  assertNonNegative(avoidedKilogramsPerPersonKilometer, "Avoided emissions factor");
  return round(
    publicTransportTrips * averageJourneyKilometers * avoidedKilogramsPerPersonKilometer,
  );
}

export interface SustainabilityStatusInput {
  readonly publicTransportUsagePercentage: number;
  readonly wasteBinUtilizationPercentage: number;
  readonly energyChangePercentage: number;
}

export function calculateSustainabilityStatus(
  input: SustainabilityStatusInput,
): SustainabilityStatus {
  if (
    input.wasteBinUtilizationPercentage >= 100 ||
    input.energyChangePercentage >= 12 ||
    input.publicTransportUsagePercentage < 35
  ) {
    return "action-required";
  }
  if (
    input.wasteBinUtilizationPercentage >= 80 ||
    input.energyChangePercentage >= 4 ||
    input.publicTransportUsagePercentage < 50
  ) {
    return "watch";
  }
  return "on-track";
}

export function getSustainabilitySnapshot(input: SustainabilityInput): SustainabilitySnapshot {
  const publicTransportUsagePercentage = calculatePublicTransportUsage(
    input.publicTransportArrivals,
    input.totalArrivals,
  );
  const water = calculateWaterRefillUsage(input.waterRefills);
  const wasteBinUtilizationPercentage = calculateWasteBinUtilization(
    input.totalWasteKilograms,
    input.binCapacityKilograms,
  );
  const energy = calculateEnergyConsumptionTrend(input.currentEnergyKwh, input.baselineEnergyKwh);

  return {
    publicTransportUsagePercentage,
    waterRefillLiters: water.liters,
    singleUseBottlesAvoided: water.singleUseBottlesAvoided,
    wasteBinUtilizationPercentage,
    energyChangePercentage: energy.changePercentage,
    energyTrend: energy.trend,
    estimatedEmissionsAvoidedKilograms: estimateEmissionsAvoided(input.publicTransportArrivals),
    status: calculateSustainabilityStatus({
      publicTransportUsagePercentage,
      wasteBinUtilizationPercentage,
      energyChangePercentage: energy.changePercentage,
    }),
    simulated: true,
  };
}
