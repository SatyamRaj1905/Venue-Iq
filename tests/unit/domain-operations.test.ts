import { describe, expect, it } from "vitest";

import {
  BASE_TRANSPORT_SERVICES,
  assessIncident,
  calculateCrowdRiskScore,
  calculateDensityPeoplePerSquareMeter,
  calculateEnergyConsumptionTrend,
  calculateGateThroughput,
  calculateIncidentSeverity,
  calculateOccupancyPercentage,
  calculatePublicTransportUsage,
  calculateTransportStatus,
  calculateWasteBinUtilization,
  calculateWaterRefillUsage,
  calculateZoneCrowdMetrics,
  classifyDensity,
  classifyZoneStatus,
  estimateEmissionsAvoided,
  estimateQueueTime,
  getSustainabilitySnapshot,
  getTransportOptions,
  sortIncidentsByPriority,
  suggestFanRedistribution,
} from "@/lib/domain";
import type { IncidentInput } from "@/lib/domain";

describe("crowd calculations", () => {
  it("calculates occupancy percentages without hiding over-capacity values", () => {
    expect(calculateOccupancyPercentage(4_500, 6_000)).toBe(75);
    expect(calculateOccupancyPercentage(6_600, 6_000)).toBe(110);
  });

  it("rejects zero capacity", () => {
    expect(() => calculateOccupancyPercentage(100, 0)).toThrow(RangeError);
  });

  it("calculates and classifies crowd density", () => {
    const density = calculateDensityPeoplePerSquareMeter(9_300, 3_100);

    expect(density).toBe(3);
    expect(classifyDensity(density)).toBe("high");
    expect(classifyDensity(4)).toBe("critical");
  });

  it("normalizes gate entries to hourly throughput", () => {
    expect(calculateGateThroughput(900, 15)).toBe(3_600);
  });

  it("estimates queue time from observed service rate", () => {
    expect(estimateQueueTime(600, 2_400)).toBe(15);
    expect(estimateQueueTime(0, 0)).toBe(0);
  });

  it("combines occupancy, density, queues, and incidents into bounded risk", () => {
    const low = calculateCrowdRiskScore({
      occupancyPercentage: 30,
      densityPeoplePerSquareMeter: 0.5,
      queueMinutes: 2,
    });
    const critical = calculateCrowdRiskScore({
      occupancyPercentage: 130,
      densityPeoplePerSquareMeter: 5,
      queueMinutes: 40,
      activeIncidentCount: 2,
    });

    expect(low).toBeLessThan(35);
    expect(critical).toBe(100);
    expect(classifyZoneStatus(critical)).toBe("critical");
  });

  it("builds internally consistent zone metrics", () => {
    const metrics = calculateZoneCrowdMetrics({
      zoneId: "north-entry",
      occupancy: 4_800,
      capacity: 6_000,
      areaSquareMeters: 2_000,
      queuedPeople: 500,
      entriesInWindow: 600,
      windowMinutes: 15,
      activeIncidentCount: 1,
    });

    expect(metrics).toMatchObject({
      occupancyPercentage: 80,
      densityPeoplePerSquareMeter: 2.4,
      throughputPerHour: 2_400,
      queueMinutes: 12.5,
      simulated: true,
    });
    expect(metrics.status).not.toBe("normal");
  });

  it("suggests redistribution only from high-risk to lower-risk zones", () => {
    const overloaded = calculateZoneCrowdMetrics({
      zoneId: "overloaded",
      occupancy: 1_120,
      capacity: 1_000,
      areaSquareMeters: 220,
      queuedPeople: 700,
      entriesInWindow: 200,
      windowMinutes: 15,
      activeIncidentCount: 1,
    });
    const available = calculateZoneCrowdMetrics({
      zoneId: "available",
      occupancy: 300,
      capacity: 1_000,
      areaSquareMeters: 700,
      queuedPeople: 10,
      entriesInWindow: 400,
      windowMinutes: 15,
    });
    const suggestions = suggestFanRedistribution([overloaded, available]);

    expect(suggestions[0]).toMatchObject({
      fromZoneId: "overloaded",
      toZoneId: "available",
      requiresHumanApproval: true,
    });
    expect(suggestions[0]?.suggestedPeople).toBeGreaterThan(0);
  });
});

describe("incident decisions", () => {
  const lowIncident: IncidentInput = {
    id: "waste",
    type: "waste-overflow",
    title: "Bin nearing capacity",
    zoneIds: ["south-concourse"],
    reportedAtMinute: 10,
    peopleAffected: 20,
  };
  const criticalIncident: IncidentInput = {
    id: "medical",
    type: "medical",
    title: "Urgent medical response",
    zoneIds: ["east-concourse", "east-concourse"],
    reportedAtMinute: 12,
    peopleAffected: 1,
    medicalUrgency: "life-threatening",
  };

  it("escalates a life-threatening medical report to critical", () => {
    expect(calculateIncidentSeverity(criticalIncident)).toBe("critical");
  });

  it("escalates a critical accessibility blockage to high severity", () => {
    expect(
      calculateIncidentSeverity({
        id: "lift",
        type: "accessibility-obstruction",
        title: "Lift unavailable",
        zoneIds: ["north-concourse"],
        reportedAtMinute: 1,
        peopleAffected: 30,
        blockingCriticalRoute: true,
      }),
    ).toBe("high");
  });

  it("assigns deterministic escalation roles and SOP categories", () => {
    const incident = assessIncident(criticalIncident);

    expect(incident).toMatchObject({
      severity: "critical",
      escalationRole: "medical-command",
      sopCategory: "medical-response",
      requiresHumanApproval: true,
      simulated: true,
    });
    expect(incident.zoneIds).toEqual(["east-concourse"]);
  });

  it("sorts active critical incidents before lower-priority incidents", () => {
    const sorted = sortIncidentsByPriority([
      assessIncident(lowIncident),
      assessIncident(criticalIncident),
    ]);

    expect(sorted.map((incident) => incident.id)).toEqual(["medical", "waste"]);
  });

  it("sorts resolved incidents after active incidents", () => {
    const resolved = assessIncident({ ...criticalIncident, status: "resolved" });
    const active = assessIncident(lowIncident);

    expect(sortIncidentsByPriority([resolved, active])[0]?.id).toBe("waste");
  });
});

describe("transport calculations", () => {
  it("filters transport options for accessibility and wait time", () => {
    const options = getTransportOptions({
      accessibleOnly: true,
      maximumWaitMinutes: 7,
    });

    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.accessible && option.waitMinutes <= 7)).toBe(true);
  });

  it("ranks a preferred transport mode more favorably", () => {
    const options = getTransportOptions({ preferredModes: ["shuttle"] });
    const shuttle = options.find((option) => option.mode === "shuttle");

    expect(shuttle).toBeDefined();
    expect(shuttle?.rankScore).toBeLessThan(shuttle?.totalJourneyMinutes ?? 0);
  });

  it("classifies the baseline network as strained", () => {
    const snapshot = calculateTransportStatus();

    expect(snapshot.networkStatus).toBe("strained");
    expect(snapshot.accessibleServiceCount).toBeGreaterThan(0);
  });

  it("classifies a suspended service as a disruption", () => {
    const suspended = BASE_TRANSPORT_SERVICES.map((service, index) =>
      index === 0 ? { ...service, status: "suspended" as const } : service,
    );

    expect(calculateTransportStatus(suspended).networkStatus).toBe("disrupted");
  });
});

describe("sustainability calculations", () => {
  it("calculates public-transport mode share", () => {
    expect(calculatePublicTransportUsage(6_200, 10_000)).toBe(62);
  });

  it("calculates refill liters and avoided bottles", () => {
    expect(calculateWaterRefillUsage(1_000)).toEqual({
      liters: 600,
      singleUseBottlesAvoided: 1_200,
    });
  });

  it("reports waste utilization above 100 percent", () => {
    expect(calculateWasteBinUtilization(5_500, 5_000)).toBe(110);
  });

  it("classifies lower energy use as improving", () => {
    expect(calculateEnergyConsumptionTrend(900, 1_000)).toEqual({
      changePercentage: -10,
      trend: "improving",
    });
  });

  it("estimates avoided transport emissions", () => {
    expect(estimateEmissionsAvoided(1_000, 10, 0.1)).toBe(1_000);
  });

  it("marks overflow conditions as action required", () => {
    const snapshot = getSustainabilitySnapshot({
      totalArrivals: 10_000,
      publicTransportArrivals: 6_000,
      waterRefills: 2_000,
      totalWasteKilograms: 5_500,
      binCapacityKilograms: 5_000,
      currentEnergyKwh: 900,
      baselineEnergyKwh: 1_000,
    });

    expect(snapshot.status).toBe("action-required");
    expect(snapshot.simulated).toBe(true);
  });
});
