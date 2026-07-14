# Testing VenueIQ

VenueIQ uses a layered test strategy: many fast pure-function tests, focused component and handler tests, then a small set of browser journeys.

## Locations

- `tests/unit/`: routing, crowd, incident, sustainability, simulation, schemas, fallback, storage, and validation.
- `tests/components/`: forms, controls, result panels, loading/fallback states, and keyboard interaction.
- `tests/integration/`: route-handler contracts, health, headers, and demo mode.
- `tests/e2e/`: primary fan, operator, volunteer, keyboard, mobile, and fallback journeys.
- `tests/accessibility/`: axe scans for the four key surfaces.

## Commands

```bash
npm run test:unit       # Vitest without coverage enforcement
npm run test            # Vitest with coverage
npm run test:watch
npm run test:e2e
npm run test:a11y
npm run bundle:check   # enforce initial JS/CSS budgets after a production build
npm run verify
npm run verify:full
```

Install the Chromium binary once with `npx playwright install chromium` (or `npx playwright install --with-deps chromium` in Linux CI).

## Coverage

Coverage thresholds for meaningful pure application logic are:

- Lines: 90%
- Functions: 90%
- Statements: 90%
- Branches: 85%

Framework-generated declarations, pure type barrels, and Playwright artifacts are excluded. A high percentage does not replace scenario coverage or manual review.

Production maintainability is also enforced during linting: complexity 12, 80 lines per function,
500 nonblank lines per file, strict TypeScript, and zero warnings. Route asset budgets are described
in `PERFORMANCE.md` and run in local, CI, and Vercel release gates.

## Mocked boundaries

Automated tests do not require a Gemini key. AI calls use demo fixtures or a controlled model-client seam. Time, browser storage failures, and network errors are controlled when a deterministic assertion needs them. The stadium graph, route solver, crowd calculations, scenario generator, SOP content, and response validators are real.

## Accessibility strategy

Component tests assert semantic contracts. Browser tests run axe and reject serious or critical violations; no broad violation exclusions are allowed. The manual checklist in `ACCESSIBILITY.md` covers behavior automation cannot prove, including screen-reader quality and focus visibility.

## End-to-end strategy

Playwright starts the app in demo mode and tests the user-visible contract. Tests prefer accessible roles and labels over CSS selectors. The suite covers a low-crowd route, step-free route, Spanish and Arabic responses, Gate C closure, changed operations briefing, volunteer SOP checklist, keyboard navigation, mobile viewport, and safe fallback.

## Manual QA

- Run all three supplied demo questions.
- Change every scenario and confirm simulated labels and timestamps.
- Lock/unlock the operations snapshot and confirm scenario controls cannot change a locked state.
- Confirm every recommendation requires human approval.
- Block network requests and verify usable fallback plus retry copy.
- Test Chrome and Safari at mobile, tablet, and desktop widths.
- Confirm no secret or server stack appears in browser source, payloads, console, or health output.
- Run a production build locally and inspect response security headers.
