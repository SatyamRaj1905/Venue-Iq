import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteSteps } from "@/components/fan/RouteSteps";
import { StadiumMap } from "@/components/fan/StadiumMap";
import type { RouteResult } from "@/lib/ai/schemas";

function routeStep(id: string): RouteResult["steps"][number] {
  return {
    id,
    instruction: `Follow ${id}`,
    distanceMeters: 20,
    estimatedMinutes: 1,
    crowdLevel: "low",
    accessibilityNotes: ["Step-free segment."],
  };
}

const mappedRoute = {
  originId: "gate-a",
  destinationId: "section-214",
  totalDistanceMeters: 121,
  estimatedWalkingMinutes: 3,
  stepFree: true,
  crowdLevel: "low",
  steps: [
    "gate-a--north",
    "north--lift-north",
    "lift-north--upper-north",
    "upper-north--section-214",
  ].map(routeStep),
  nearbyFacilities: [],
} satisfies RouteResult;

describe("fan route display", () => {
  it("plots every intermediate deterministic graph node in route order", () => {
    const { container } = render(<StadiumMap route={mappedRoute} />);

    expect(
      screen.getByRole("img", { name: /^Route from Gate A to Section 214/ }),
    ).toHaveTextContent(
      /Gate A, then North Concourse, then North Accessible Lift, then Upper North Landing, then Section 214/,
    );
    expect(container.querySelector(".fan-map__route")).toHaveAttribute(
      "points",
      "50,4 50,22 56,27 50,36 50,43",
    );
    expect(container.querySelectorAll(".fan-map__route-waypoint")).toHaveLength(3);
  });

  it("does not invent a direct line when a route edge cannot be resolved", () => {
    const { container } = render(
      <StadiumMap
        route={{
          ...mappedRoute,
          steps: [routeStep("untrusted-edge")],
        }}
      />,
    );

    expect(container.querySelector(".fan-map__route")).toHaveAttribute("points", "50,4");
    expect(screen.getByRole("img")).toHaveTextContent("Only verified route segments are shown");
  });

  it("uses distinct start and destination marker shapes", () => {
    const { container } = render(<StadiumMap route={mappedRoute} />);

    expect(container.querySelector("circle.fan-map__marker--origin")).toBeInTheDocument();
    expect(container.querySelector("rect.fan-map__marker--destination")).toBeInTheDocument();
  });

  it("renders a clear already-at-destination state for a zero-step route", () => {
    render(
      <RouteSteps
        route={{
          ...mappedRoute,
          destinationId: "gate-a",
          totalDistanceMeters: 0,
          estimatedWalkingMinutes: 0,
          steps: [],
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("You’re already at your destination.");
    expect(screen.getByText("Already there")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
