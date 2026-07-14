import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrowdZoneGrid } from "@/components/operations/CrowdZoneGrid";
import { EventTimeline } from "@/components/operations/EventTimeline";
import { getScenarioState } from "@/lib/domain";

describe("operations scroll regions", () => {
  it("names the crowd scrollers and marks every scenario-affected zone with text", () => {
    const snapshot = getScenarioState("gate-closure");
    render(<CrowdZoneGrid snapshot={snapshot} />);

    const cardRegion = screen.getByRole("region", { name: "Crowd zone cards" });
    expect(cardRegion).toHaveAttribute("tabindex", "0");
    expect(within(cardRegion).getAllByText("Scenario affected")).toHaveLength(
      snapshot.affectedZoneIds.length,
    );
    expect(within(cardRegion).getByText("South Concourse").closest(".zone-tile")).toHaveClass(
      "zone-tile--affected",
    );

    const tableRegion = screen.getByRole("region", { name: "Detailed crowd metrics" });
    expect(tableRegion).toHaveAttribute("tabindex", "0");
    expect(within(tableRegion).getAllByText("Affected")).toHaveLength(
      snapshot.affectedZoneIds.length,
    );
  });

  it("exposes the horizontally scrollable timeline as a named keyboard region", () => {
    const snapshot = getScenarioState("arrival-surge");
    render(<EventTimeline events={snapshot.timeline} />);

    const timelineRegion = screen.getByRole("region", { name: "Operations event history" });
    expect(timelineRegion).toHaveAttribute("tabindex", "0");
    expect(within(timelineRegion).getByRole("list")).toBeInTheDocument();
  });
});
