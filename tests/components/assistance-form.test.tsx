import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FanAssistRequest } from "@/lib/ai/schemas";
import { AssistanceForm } from "@/components/fan/AssistanceForm";

const preferences: FanAssistRequest["preferences"] = {
  stepFree: false,
  avoidCrowds: true,
  preferQuiet: false,
  avoidAccessibilityObstructions: true,
};

describe("AssistanceForm", () => {
  it("exposes route and language controls with accessible labels", () => {
    render(
      <AssistanceForm
        currentLocation="gate-a"
        destination="section-214"
        language="en"
        message="Find my route"
        preferences={preferences}
        isLoading={false}
        validationError={undefined}
        onCurrentLocationChange={vi.fn()}
        onDestinationChange={vi.fn()}
        onLanguageChange={vi.fn()}
        onMessageChange={vi.fn()}
        onPreferencesChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("I am near")).toHaveValue("gate-a");
    expect(screen.getByLabelText("Take me to")).toHaveValue("section-214");
    expect(screen.getByLabelText("Response language")).toHaveValue("en");
    expect(screen.getByRole("button", { name: /step-free/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports preference changes and form submission", async () => {
    const user = userEvent.setup();
    const onPreferencesChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <AssistanceForm
        currentLocation="gate-a"
        destination="section-214"
        language="en"
        message="Find my route"
        preferences={preferences}
        isLoading={false}
        validationError={undefined}
        onCurrentLocationChange={vi.fn()}
        onDestinationChange={vi.fn()}
        onLanguageChange={vi.fn()}
        onMessageChange={vi.fn()}
        onPreferencesChange={onPreferencesChange}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /step-free/i }));
    expect(onPreferencesChange).toHaveBeenCalledWith({ ...preferences, stepFree: true });
    await user.click(screen.getByRole("button", { name: /find my route/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
