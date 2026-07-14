import type {
  RankedTransportOption,
  TransportNetworkStatus,
  TransportPreferences,
  TransportService,
  TransportServiceStatus,
  TransportSnapshot,
} from "./types";

export const BASE_TRANSPORT_SERVICES: readonly TransportService[] = [
  {
    id: "north-stadium-rail",
    name: "North Stadium Rail",
    mode: "train",
    status: "on-time",
    waitMinutes: 6,
    travelMinutes: 18,
    delayMinutes: 0,
    capacityUtilizationPercentage: 68,
    accessible: true,
    destinationNodeId: "transport-north",
    note: "Step-free platforms and level boarding are available.",
    simulated: true,
  },
  {
    id: "city-centre-metro",
    name: "City Centre Metro",
    mode: "metro",
    status: "minor-delay",
    waitMinutes: 8,
    travelMinutes: 22,
    delayMinutes: 3,
    capacityUtilizationPercentage: 74,
    accessible: true,
    destinationNodeId: "transport-north",
    note: "Lifts are operating at Stadium interchange.",
    simulated: true,
  },
  {
    id: "south-park-shuttle",
    name: "South Park-and-Ride Shuttle",
    mode: "shuttle",
    status: "on-time",
    waitMinutes: 7,
    travelMinutes: 16,
    delayMinutes: 0,
    capacityUtilizationPercentage: 61,
    accessible: true,
    destinationNodeId: "transport-south",
    note: "All vehicles are low-floor and wheelchair accessible.",
    simulated: true,
  },
  {
    id: "riverside-bus",
    name: "Riverside Match Bus",
    mode: "bus",
    status: "crowded",
    waitMinutes: 12,
    travelMinutes: 28,
    delayMinutes: 4,
    capacityUtilizationPercentage: 91,
    accessible: true,
    destinationNodeId: "transport-south",
    note: "Expect busy boarding; priority wheelchair bay is available.",
    simulated: true,
  },
  {
    id: "accessible-taxi-south",
    name: "Accessible Taxi Rank",
    mode: "taxi",
    status: "on-time",
    waitMinutes: 9,
    travelMinutes: 14,
    delayMinutes: 0,
    capacityUtilizationPercentage: 52,
    accessible: true,
    destinationNodeId: "transport-south",
    note: "Wheelchair-accessible vehicles can be requested from the marshal.",
    simulated: true,
  },
  {
    id: "greenway-cycle",
    name: "Greenway Cycle Route",
    mode: "cycle",
    status: "on-time",
    waitMinutes: 0,
    travelMinutes: 24,
    delayMinutes: 0,
    capacityUtilizationPercentage: 38,
    accessible: false,
    destinationNodeId: "transport-south",
    note: "Secure cycle parking is available outside the south plaza.",
    simulated: true,
  },
] as const;

function round(value: number, decimalPlaces = 1): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

function rankPenalty(service: TransportService): number {
  const crowdPenalty = Math.max(0, service.capacityUtilizationPercentage - 70) * 0.25;
  const reliabilityPenalty: Readonly<Record<TransportServiceStatus, number>> = {
    "on-time": 0,
    "minor-delay": 3,
    "major-delay": 12,
    suspended: 100,
    crowded: 8,
  };
  return crowdPenalty + reliabilityPenalty[service.status];
}

export function getTransportOptions(
  preferences: TransportPreferences = {},
  services: readonly TransportService[] = BASE_TRANSPORT_SERVICES,
): readonly RankedTransportOption[] {
  const preferredModes = new Set(preferences.preferredModes ?? []);
  return services
    .filter((service) => service.status !== "suspended")
    .filter((service) => preferences.accessibleOnly !== true || service.accessible)
    .filter(
      (service) =>
        preferences.maximumWaitMinutes === undefined ||
        service.waitMinutes <= preferences.maximumWaitMinutes,
    )
    .map((service) => {
      const totalJourneyMinutes =
        service.waitMinutes + service.travelMinutes + service.delayMinutes;
      const preferredModeBonus =
        preferredModes.size > 0 && preferredModes.has(service.mode) ? 5 : 0;
      return {
        ...service,
        totalJourneyMinutes,
        rankScore: round(totalJourneyMinutes + rankPenalty(service) - preferredModeBonus),
      };
    })
    .sort((left, right) => left.rankScore - right.rankScore || left.name.localeCompare(right.name));
}

function networkStatusForServices(services: readonly TransportService[]): TransportNetworkStatus {
  if (
    services.some((service) => service.status === "suspended" || service.status === "major-delay")
  ) {
    return "disrupted";
  }
  if (
    services.some((service) => service.status === "minor-delay" || service.status === "crowded")
  ) {
    return "strained";
  }
  return "normal";
}

export function calculateTransportStatus(
  services: readonly TransportService[] = BASE_TRANSPORT_SERVICES,
): TransportSnapshot {
  const networkStatus = networkStatusForServices(services);
  const averageDelayMinutes =
    services.length === 0
      ? 0
      : round(
          services.reduce((total, service) => total + service.delayMinutes, 0) / services.length,
        );
  const accessibleServiceCount = services.filter(
    (service) => service.accessible && service.status !== "suspended",
  ).length;
  const summary: Readonly<Record<TransportNetworkStatus, string>> = {
    normal: "Transport services are operating normally.",
    strained: "Some services are delayed or crowded; allow extra time.",
    disrupted: "A major transport disruption is active; use an alternative service.",
  };

  return {
    services: [...services],
    networkStatus,
    averageDelayMinutes,
    accessibleServiceCount,
    summary: summary[networkStatus],
    simulated: true,
  };
}

export function replaceTransportService(
  services: readonly TransportService[],
  replacement: TransportService,
): readonly TransportService[] {
  const found = services.some((service) => service.id === replacement.id);
  if (!found) {
    return [...services, replacement].sort((left, right) => left.id.localeCompare(right.id));
  }
  return services.map((service) => (service.id === replacement.id ? replacement : service));
}
