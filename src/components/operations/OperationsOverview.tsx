import { Accessibility, BusFront, DoorOpen, Gauge, UsersRound, Waves } from "lucide-react";
import type { SimulationState } from "@/lib/domain";
import { formatPercent } from "@/lib/utils/formatters";
import { MetricCard } from "@/components/ui/MetricCard";

interface OperationsOverviewProps {
  snapshot: SimulationState;
}

function averageGateThroughput(snapshot: SimulationState): number {
  if (snapshot.gates.length === 0) return 0;
  return (
    snapshot.gates.reduce((sum, gate) => sum + gate.throughputPerHour, 0) / snapshot.gates.length
  );
}

function occupancyTone(value: number): "warning" | "positive" {
  return value > 85 ? "warning" : "positive";
}

function transportTone(
  status: SimulationState["transport"]["networkStatus"],
): "positive" | "warning" {
  return status === "normal" ? "positive" : "warning";
}

function accessTone(obstructedPaths: number): "positive" | "warning" {
  return obstructedPaths === 0 ? "positive" : "warning";
}

function wasteTone(status: SimulationState["sustainability"]["status"]): "positive" | "critical" {
  return status === "action-required" ? "critical" : "positive";
}

export function OperationsOverview({ snapshot }: OperationsOverviewProps) {
  const maxQueue = Math.max(...snapshot.gates.map((gate) => gate.estimatedQueueMinutes), 0);
  const closedPaths = snapshot.routeConditions.closedEdgeIds?.length ?? 0;
  const obstructedPaths = snapshot.routeConditions.obstructedEdgeIds?.length ?? 0;
  const averageThroughput = averageGateThroughput(snapshot);
  const transportIsNormal = snapshot.transport.networkStatus === "normal";
  const crowdIsCritical = snapshot.zones.some((zone) => zone.status === "critical");

  return (
    <section className="operations-overview" aria-labelledby="overview-title">
      <h2 className="sr-only" id="overview-title">
        Venue overview
      </h2>
      <MetricCard
        label="Stadium occupancy"
        value={formatPercent(snapshot.occupancyPercentage)}
        detail={`${snapshot.totalOccupancy.toLocaleString()} people`}
        icon={UsersRound}
        tone={occupancyTone(snapshot.occupancyPercentage)}
        trend={snapshot.occupancyPercentage > 70 ? "up" : "steady"}
        trendLabel="simulated"
      />
      <MetricCard
        label="Gate throughput"
        value={`${Math.round(averageThroughput).toLocaleString()}/h`}
        detail={`Longest queue ${Math.round(maxQueue)} min`}
        icon={DoorOpen}
        tone={maxQueue > 15 ? "warning" : "positive"}
        trend={maxQueue > 15 ? "down" : "steady"}
        trendLabel={maxQueue > 15 ? "pressure" : "stable"}
      />
      <MetricCard
        label="Transport"
        value={`${snapshot.transport.averageDelayMinutes} min`}
        detail={snapshot.transport.networkStatus}
        icon={BusFront}
        tone={transportTone(snapshot.transport.networkStatus)}
        trend={transportIsNormal ? "steady" : "down"}
        trendLabel="avg delay"
      />
      <MetricCard
        label="Accessible routes"
        value={obstructedPaths === 0 ? "Open" : `${obstructedPaths} watch`}
        detail={`${closedPaths} paths closed`}
        icon={Accessibility}
        tone={accessTone(obstructedPaths)}
        trend="steady"
        trendLabel="verified"
      />
      <MetricCard
        label="Crowd risk"
        value={`${Math.max(...snapshot.zones.map((zone) => zone.riskScore), 0)}`}
        detail="Highest zone score"
        icon={Gauge}
        tone={crowdIsCritical ? "critical" : "info"}
        trend={crowdIsCritical ? "up" : "steady"}
        trendLabel="seeded data"
      />
      <MetricCard
        label="Waste capacity"
        value={formatPercent(snapshot.sustainability.wasteBinUtilizationPercentage)}
        detail={snapshot.sustainability.status.replace("-", " ")}
        icon={Waves}
        tone={wasteTone(snapshot.sustainability.status)}
        trend={snapshot.sustainability.energyTrend === "improving" ? "down" : "steady"}
        trendLabel="simulated"
      />
    </section>
  );
}
