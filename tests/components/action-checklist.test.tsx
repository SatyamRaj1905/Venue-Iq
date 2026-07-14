import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActionChecklist } from "@/components/volunteer/ActionChecklist";

describe("ActionChecklist", () => {
  it("tracks progress while keeping every item available to assistive technology", async () => {
    const user = userEvent.setup();
    render(<ActionChecklist items={["Confirm access needs", "Contact the accessibility host"]} />);

    expect(screen.getByText("0/2 checked")).toBeInTheDocument();
    const firstItem = screen.getByRole("button", { name: "Mark complete: Confirm access needs" });
    await user.click(firstItem);
    expect(firstItem).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1/2 checked")).toBeInTheDocument();
  });
});
