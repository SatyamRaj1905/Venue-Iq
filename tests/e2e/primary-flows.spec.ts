import { expect, test } from "@playwright/test";

async function submitFanRoute(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: /find my route/i }).click();
  await expect(page.getByRole("heading", { name: "Your grounded route" })).toBeVisible();
}

test("fan finds a deterministic low-crowd route", async ({ page }) => {
  await page.goto("/fan");
  await expect(page.getByRole("button", { name: /avoid crowds/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await submitFanRoute(page);

  await expect(page.getByLabel("Route summary")).toContainText("Crowd level");
  await expect(page.getByRole("heading", { name: "Your route" })).toBeVisible();
  await expect(page.getByText(/crowd weighting|ponderación.*afluencia/i).first()).toBeVisible();
});

test("wheelchair preference produces a step-free route", async ({ page }) => {
  await page.goto("/fan");
  await expect(page.getByRole("button", { name: /step-free/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await submitFanRoute(page);

  await expect(page.getByLabel("Route summary")).toContainText("Step-free");
  await page.getByText("Text alternative to the map", { exact: true }).click();
  await expect(page.locator(".map-alternative__body")).toBeVisible();
});

test("fan receives a Spanish response", async ({ page }) => {
  await page.goto("/fan");
  await page.getByLabel("Response language").selectOption("es");

  await submitFanRoute(page);

  await expect(page.locator(".ai-answer__summary")).toContainText(/ruta aprobada/i);
  await expect(page.locator(".route-steps")).toContainText(/siga|tome|continúe/i);
});

test("Arabic fan guidance switches the result region to RTL", async ({ page }) => {
  await page.goto("/fan");
  await page.getByLabel("Response language").selectOption("ar");

  await submitFanRoute(page);

  await expect(page.locator(".fan-response")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".ai-answer__summary")).toContainText(/المسار|الطريق/);
});

test("operator activates the Gate C closure scenario", async ({ page }) => {
  await page.goto("/operations");
  await page.getByRole("button", { name: "Gate closure" }).click();

  await expect(page.getByText("Gate C closed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/human approval required/i).first()).toBeVisible();
  const approve = page.getByRole("button", { name: /mark .* as reviewed and approved/i }).first();
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect(approve).toBeDisabled();

  await page.getByRole("link", { name: "Fan", exact: true }).click();
  await expect(page.getByText("Shared scenario: Gate C closure", { exact: true })).toBeVisible();
});

test("operations briefing changes with the selected scenario", async ({ page }) => {
  await page.goto("/operations");
  const summary = page.locator(".operations-brief__summary");
  const normalSummary = await summary.textContent();

  await page.getByRole("button", { name: "Train delay" }).click();

  await expect(
    page.getByText("North Stadium Rail major delay", { exact: true }).first(),
  ).toBeVisible();
  await expect(summary).not.toHaveText(normalSummary ?? "");
});

test("volunteer receives an Arabic grounded SOP checklist", async ({ page }) => {
  await page.goto("/volunteer");
  await page.getByRole("button", { name: /get trusted steps/i }).click();

  await expect(page.getByRole("heading", { name: "Action checklist" })).toBeVisible();
  await expect(page.locator(".volunteer-response")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".action-checklist li")).toHaveCount(4);
  await expect(page.getByText(/لا ترتجل|المتطوعين/).first()).toBeVisible();
});

test("landing page supports keyboard-only skip navigation", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: /skip to main content/i });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Open Fan Companion" }).first()).toBeFocused();
});

test("fan flow remains usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fan");

  await expect(page.getByRole("heading", { name: /move through the venue/i })).toBeVisible();
  await submitFanRoute(page);
  await expect(page.getByLabel("Route summary")).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("fan API failure falls back safely without losing the route", async ({ page }) => {
  await page.route("**/api/ai/assist", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
      }),
    });
  });
  await page.goto("/fan");

  await page.getByRole("button", { name: /find my route/i }).click();

  await expect(page.getByText("Gemini is temporarily unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Safe fallback", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your route" })).toBeVisible();
});
