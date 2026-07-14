import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", name: "landing" },
  { path: "/fan", name: "fan companion" },
  { path: "/operations", name: "operations command center" },
  { path: "/volunteer", name: "volunteer assistant" },
] as const;

for (const pageUnderTest of pages) {
  test(`${pageUnderTest.name} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(pageUnderTest.path);
    await expect(page.locator("main")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(blockingViolations).toEqual([]);
  });
}
