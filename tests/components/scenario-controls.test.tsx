import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScenarioControls } from "@/components/operations/ScenarioControls";

describe("ScenarioControls", () => {
  it("selects a scenario without implying automatic execution", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ScenarioControls
        activeScenario="normal"
        isPaused={false}
        isLoading={false}
        onSelect={onSelect}
        onPauseChange={vi.fn()}
      />,
    );

    const gateClosure = screen.getByRole("button", { name: "Gate closure" });
    expect(gateClosure).toHaveAttribute("aria-pressed", "false");
    await user.click(gateClosure);
    expect(onSelect).toHaveBeenCalledWith("gate-closure");
  });

  it("makes the snapshot lock keyboard operable", async () => {
    const user = userEvent.setup();
    const onPauseChange = vi.fn();
    render(
      <ScenarioControls
        activeScenario="normal"
        isPaused={false}
        isLoading={false}
        onSelect={vi.fn()}
        onPauseChange={onPauseChange}
      />,
    );
    const lock = screen.getByRole("button", { name: "Lock snapshot" });
    lock.focus();
    await user.keyboard("{Enter}");
    expect(onPauseChange).toHaveBeenCalledWith(true);
  });

  it("disables scenario activation while the snapshot is locked", () => {
    render(
      <ScenarioControls
        activeScenario="normal"
        isPaused
        isLoading={false}
        onSelect={vi.fn()}
        onPauseChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Gate closure" })).toBeDisabled();
    expect(screen.getByText(/unlock it to activate another scenario/i)).toBeInTheDocument();
  });
});
