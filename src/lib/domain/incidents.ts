import type {
  EscalationRole,
  IncidentInput,
  IncidentSeverity,
  IncidentType,
  OperationalIncident,
  SopCategory,
  ZoneId,
} from "./types";

const SEVERITY_WEIGHT: Readonly<Record<IncidentSeverity, number>> = {
  low: 20,
  moderate: 45,
  high: 72,
  critical: 95,
};

const BASE_SEVERITY: Readonly<Record<IncidentType, IncidentSeverity>> = {
  "gate-closure": "high",
  "crowd-congestion": "moderate",
  "transport-disruption": "moderate",
  heat: "high",
  medical: "moderate",
  "accessibility-obstruction": "moderate",
  "waste-overflow": "low",
  security: "high",
  other: "low",
};

const ESCALATION_ROLE: Readonly<Record<IncidentType, EscalationRole>> = {
  "gate-closure": "venue-operations",
  "crowd-congestion": "crowd-safety-lead",
  "transport-disruption": "transport-liaison",
  heat: "medical-command",
  medical: "medical-command",
  "accessibility-obstruction": "accessibility-lead",
  "waste-overflow": "sustainability-lead",
  security: "security-control",
  other: "venue-operations",
};

const SOP_CATEGORY: Readonly<Record<IncidentType, SopCategory>> = {
  "gate-closure": "access-and-egress",
  "crowd-congestion": "crowd-management",
  "transport-disruption": "transport-contingency",
  heat: "heat-response",
  medical: "medical-response",
  "accessibility-obstruction": "accessible-route-contingency",
  "waste-overflow": "waste-response",
  security: "security-response",
  other: "general-operations",
};

function severityRank(severity: IncidentSeverity): number {
  const ranks: Readonly<Record<IncidentSeverity, number>> = {
    low: 0,
    moderate: 1,
    high: 2,
    critical: 3,
  };
  return ranks[severity];
}

function maximumSeverity(left: IncidentSeverity, right: IncidentSeverity): IncidentSeverity {
  return severityRank(left) >= severityRank(right) ? left : right;
}

function severityForPeopleAffected(peopleAffected: number): IncidentSeverity {
  if (peopleAffected >= 5_000) {
    return "critical";
  }
  if (peopleAffected >= 1_000) {
    return "high";
  }
  if (peopleAffected >= 150) {
    return "moderate";
  }
  return "low";
}

export function calculateIncidentSeverity(input: IncidentInput): IncidentSeverity {
  if (!Number.isFinite(input.peopleAffected) || input.peopleAffected < 0) {
    throw new RangeError("People affected must be a finite, non-negative number.");
  }

  let severity = maximumSeverity(
    BASE_SEVERITY[input.type],
    severityForPeopleAffected(input.peopleAffected),
  );
  if (input.medicalUrgency === "life-threatening") {
    severity = "critical";
  } else if (input.medicalUrgency === "urgent") {
    severity = maximumSeverity(severity, "high");
  }
  if (input.blockingCriticalRoute === true) {
    severity = maximumSeverity(severity, "high");
  }
  return severity;
}

export function getAffectedZones(input: IncidentInput): readonly ZoneId[] {
  return [...new Set(input.zoneIds)].sort((left, right) => left.localeCompare(right));
}

export function getEscalationRole(type: IncidentType): EscalationRole {
  return ESCALATION_ROLE[type];
}

export function getRecommendedSopCategory(type: IncidentType): SopCategory {
  return SOP_CATEGORY[type];
}

export function calculateIncidentPriority(
  input: IncidentInput,
  severity = calculateIncidentSeverity(input),
): number {
  const peopleImpact = Math.min(12, Math.log10(input.peopleAffected + 1) * 3);
  const routeImpact = input.blockingCriticalRoute === true ? 8 : 0;
  const statusPenalty = input.status === "resolved" ? 50 : 0;
  return Math.round(
    Math.max(
      0,
      Math.min(100, SEVERITY_WEIGHT[severity] + peopleImpact + routeImpact - statusPenalty),
    ),
  );
}

export function assessIncident(input: IncidentInput): OperationalIncident {
  if (!Number.isFinite(input.reportedAtMinute) || input.reportedAtMinute < 0) {
    throw new RangeError("Reported minute must be a finite, non-negative number.");
  }
  const severity = calculateIncidentSeverity(input);
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    zoneIds: getAffectedZones(input),
    reportedAtMinute: input.reportedAtMinute,
    peopleAffected: input.peopleAffected,
    severity,
    escalationRole: getEscalationRole(input.type),
    sopCategory: getRecommendedSopCategory(input.type),
    priorityScore: calculateIncidentPriority(input, severity),
    status: input.status ?? "active",
    requiresHumanApproval: true,
    simulated: true,
  };
}

export function sortIncidentsByPriority(
  incidents: readonly OperationalIncident[],
): readonly OperationalIncident[] {
  const statusRank = { active: 0, monitoring: 1, resolved: 2 } as const;
  return [...incidents].sort(
    (left, right) =>
      statusRank[left.status] - statusRank[right.status] ||
      right.priorityScore - left.priorityScore ||
      left.reportedAtMinute - right.reportedAtMinute ||
      left.id.localeCompare(right.id),
  );
}
