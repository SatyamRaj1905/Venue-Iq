import type { OperationsAction, OperationsBrief, OperationsBriefRequest } from "../types";
import type { OperationsGrounding } from "../tools/operations";

function groundedAction(
  action: OperationsGrounding["recommendedActions"][number],
  index: number,
  evidence: readonly string[],
  affectedZones: readonly string[],
): OperationsAction {
  return {
    id: `action-${index + 1}`,
    priority: Math.min(5, index + 1),
    title: action.title,
    description: action.description,
    ownerTeam: action.ownerTeam,
    affectedZone: affectedZones[index % affectedZones.length] ?? "venue-wide",
    rationale: action.rationale,
    supportingMetrics: [evidence[index % evidence.length] ?? "Trusted simulated venue snapshot."],
    evidence: [evidence[index % evidence.length] ?? "Trusted simulated venue snapshot."],
    confidence: 0.95,
    requiresHumanApproval: true,
    approvalStatus: "pending",
  };
}

export function createOperationsFallback(
  request: OperationsBriefRequest,
  grounding: OperationsGrounding,
): OperationsBrief {
  const actions = grounding.recommendedActions.map((action, index) =>
    groundedAction(action, index, grounding.evidence, grounding.affectedZones),
  );
  return {
    scenario: request.scenario,
    summary: `Simulated ${request.scenario.replaceAll("-", " ")} conditions are ${grounding.riskLevel}. Review ${grounding.affectedZones.length} affected zone(s) and keep every action pending human approval.`,
    riskLevel: grounding.riskLevel,
    priorityActions: actions,
    affectedZones: [...grounding.affectedZones],
    evidence: [...grounding.evidence],
    confidence: 0.96,
    requiresHumanApproval: true,
    fallbackUsed: true,
    simulated: true,
  };
}
