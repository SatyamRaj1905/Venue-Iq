import type { CrowdLevel, StadiumPathKind } from "./types";

export const DEFAULT_WALKING_SPEED_METERS_PER_SECOND = 1.3;

const CROWD_SPEED_FACTOR: Readonly<Record<CrowdLevel, number>> = {
  low: 1,
  moderate: 0.88,
  high: 0.7,
  critical: 0.5,
};

const PATH_SPEED_FACTOR: Readonly<Record<StadiumPathKind, number>> = {
  walkway: 1,
  "accessible-path": 1,
  ramp: 0.82,
  lift: 0.72,
  stairs: 0.75,
};

interface WalkingTimeOptions {
  readonly speedMetersPerSecond?: number;
  readonly crowdLevel?: CrowdLevel;
  readonly pathKind?: StadiumPathKind;
}

export function classifyRouteCrowd(occupancyPercentage: number): CrowdLevel {
  if (occupancyPercentage >= 100) {
    return "critical";
  }
  if (occupancyPercentage >= 80) {
    return "high";
  }
  if (occupancyPercentage >= 55) {
    return "moderate";
  }
  return "low";
}

export function calculateWalkingTime(
  distanceMeters: number,
  options: WalkingTimeOptions = {},
): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new RangeError("Distance must be a finite, non-negative number.");
  }

  const speed = options.speedMetersPerSecond ?? DEFAULT_WALKING_SPEED_METERS_PER_SECOND;
  if (!Number.isFinite(speed) || speed <= 0 || speed > 3) {
    throw new RangeError("Walking speed must be greater than 0 and at most 3 m/s.");
  }

  const crowd = CROWD_SPEED_FACTOR[options.crowdLevel ?? "low"];
  const path = PATH_SPEED_FACTOR[options.pathKind ?? "walkway"];
  const liftWaitSeconds = options.pathKind === "lift" && distanceMeters > 0 ? 20 : 0;

  return Math.round(distanceMeters / (speed * crowd * path) + liftWaitSeconds);
}
