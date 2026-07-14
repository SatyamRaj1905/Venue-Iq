import type { OperationsBrief } from "@/lib/ai/schemas";
import { getScenarioDefinition, type ScenarioId, type SimulationState } from "@/lib/domain";

function riskLevel(snapshot: SimulationState): OperationsBrief["riskLevel"] {
  if (snapshot.zones.some((zone) => zone.status === "critical")) return "critical";
  if (snapshot.zones.some((zone) => zone.status === "congested")) return "high";
  if (snapshot.zones.some((zone) => zone.status === "busy")) return "moderate";
  return "low";
}

function primaryOwner(scenario: ScenarioId): string {
  if (scenario === "medical-response") return "Medical command";
  if (scenario === "accessibility-obstruction") return "Accessibility lead";
  if (scenario === "train-disruption") return "Transport liaison";
  if (scenario === "waste-overflow") return "Sustainability team";
  return "Venue operations";
}

export function createOperationsFallback(snapshot: SimulationState): OperationsBrief {
  const definition = getScenarioDefinition(snapshot.scenarioId);
  const busiestZone = [...snapshot.zones].sort(
    (first, second) => second.riskScore - first.riskScore,
  )[0];
  const zoneEvidence = busiestZone
    ? `${busiestZone.zoneId} is at ${Math.round(busiestZone.occupancyPercentage)}% occupancy with a risk score of ${busiestZone.riskScore}.`
    : "No zone metrics are currently available.";
  const firstIncident = snapshot.incidents[0];

  return {
    scenario: snapshot.scenarioId,
    summary:
      snapshot.scenarioId === "normal"
        ? "Venue conditions are balanced. Continue routine monitoring of gate queues, accessible paths and transport arrivals."
        : `${definition.name} is active. Protect affected routes, make the change visible to frontline teams and review redistribution before acting.`,
    riskLevel: riskLevel(snapshot),
    priorityActions: [
      {
        id: `${snapshot.scenarioId}-action-monitor`,
        priority: 1,
        title:
          snapshot.scenarioId === "normal"
            ? "Maintain routine monitoring"
            : `Confirm ${definition.name.toLowerCase()} controls`,
        description:
          snapshot.scenarioId === "normal"
            ? "Keep the current operating posture and review zone changes at the next control-room check."
            : "Verify the affected area, protect safe routes and brief the responsible zone leads before changing public guidance.",
        ownerTeam: primaryOwner(snapshot.scenarioId),
        affectedZone: busiestZone?.zoneId ?? "venue-wide",
        rationale: zoneEvidence,
        supportingMetrics: [zoneEvidence],
        evidence: [
          zoneEvidence,
          `${snapshot.alerts.length} active simulated alert${snapshot.alerts.length === 1 ? "" : "s"}.`,
        ],
        confidence: 0.9,
        requiresHumanApproval: true,
        approvalStatus: "pending",
      },
      {
        id: `${snapshot.scenarioId}-action-comms`,
        priority: 2,
        title: "Align frontline messaging",
        description:
          "Share one verified instruction with gate, accessibility and volunteer leads; include what has not changed.",
        ownerTeam: "Guest operations",
        affectedZone: snapshot.affectedZoneIds[0] ?? "venue-wide",
        rationale: "Consistent role-level messaging reduces avoidable redirection and uncertainty.",
        supportingMetrics: [
          `${snapshot.affectedZoneIds.length} zone${snapshot.affectedZoneIds.length === 1 ? " is" : "s are"} affected.`,
        ],
        evidence: [
          `${snapshot.affectedZoneIds.length} zone${snapshot.affectedZoneIds.length === 1 ? " is" : "s are"} affected.`,
          firstIncident
            ? `Incident priority score: ${firstIncident.priorityScore}.`
            : "No active incident is recorded.",
        ],
        confidence: 0.88,
        requiresHumanApproval: true,
        approvalStatus: "pending",
      },
    ],
    affectedZones: [...snapshot.affectedZoneIds],
    evidence: [
      zoneEvidence,
      `Transport network: ${snapshot.transport.networkStatus}; average delay ${snapshot.transport.averageDelayMinutes} minutes.`,
      `Waste capacity is ${Math.round(snapshot.sustainability.wasteBinUtilizationPercentage)}% utilized.`,
    ],
    confidence: 0.87,
    requiresHumanApproval: true,
    fallbackUsed: true,
    simulated: true,
  };
}
