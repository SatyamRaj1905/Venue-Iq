# VenueIQ judging evidence

This guide maps each judging parameter to implementation evidence and a quick verification path.

## Code quality

**Evidence:** Strict TypeScript flags, thin route composition, reusable UI, pure deterministic modules, discriminated async states, static content separation, named exports, and no `any`/`@ts-ignore` policy.

**Source:** `tsconfig.json`, `eslint.config.mjs`, `src/app`, `src/components`, `src/lib/domain`, `src/lib/ai`.

**Tests/docs:** `tests/unit`, `tests/components`, `ARCHITECTURE.md`.

**Verify:** `npm run format:check && npm run lint && npm run type-check`.

## Security

**Evidence:** Server-only Gemini client, strict Zod input and output parsing, bounded streaming JSON payloads, trusted-origin checks, prompt-injection screening, local development limiting, fail-closed Upstash production limiting, safe public errors, deterministic fallback, no model HTML, and strong headers.

**Source:** `src/lib/config/env.server.ts`, `src/lib/ai`, `src/lib/security`, `src/app/api`, `next.config.ts`, `.env.example`.

**Tests/docs:** API integration and AI validation tests; `SECURITY.md`.

**Verify:** Submit unknown/oversized fields, inspect `/api/health`, run `curl -I`, search browser bundles for the secret name/value, and run `npm run audit:prod`.

## Efficiency

**Evidence:** Server Components by default, isolated interactive clients, custom SVG map and charts, no remote fonts/assets or heavy map/chart dependency, local scenario changes instead of polling, memoized derived data, cancellable requests, and reduced-motion CSS.

**Source:** `src/app`, `src/components/fan/StadiumMap.tsx`, operations visual components, `src/app/globals.css`, `package.json`.

**Tests/docs:** Browser/mobile tests; performance section in `README.md`.

**Verify:** Run a production build, inspect route bundle output and Network requests, then audit the deployed preview with Lighthouse.

## Testing

**Evidence:** Unit coverage for routing and operational math, schema/fallback tests, interactive component tests, API/health contracts, ten primary E2E journeys, and four axe scans. CI performs every gate without a live model key.

**Source:** `tests`, `vitest.config.mts`, `playwright.config.ts`, `.github/workflows/ci.yml`.

**Docs:** `TESTING.md`.

**Verify:** `npm run verify:full`; inspect the Vitest coverage summary and Playwright report.

## Accessibility

**Evidence:** Skip link, landmarks, labels, keyboard controls, 44px targets, visible focus, text-plus-icon states, polite live regions, route list alternative, Arabic RTL, large-text/high-contrast preferences, responsive reflow, and reduced motion.

**Source:** shared layout/UI components, `src/components/fan`, `src/components/operations`, `src/components/volunteer`, `src/app/globals.css`.

**Tests/docs:** `tests/accessibility`, keyboard/mobile E2E cases, `ACCESSIBILITY.md`.

**Verify:** `npm run test:a11y`, keyboard-only navigation, VoiceOver/NVDA route reading, 200% zoom, and Arabic language selection.

## Problem-statement alignment

**Evidence:** The three role experiences share a stadium twin and cover accessible navigation, crowd management, transport disruption, multilingual help, sustainability, volunteer SOP support, and human-approved operations intelligence. AI is visibly grounded rather than presented as a generic chat surface.

**Source:** `/fan`, `/operations`, `/volunteer`, `/impact`, `src/lib/domain`, `src/lib/content/volunteerSops.ts`, `src/lib/ai/tools.ts`.

**Tests/docs:** Primary demo E2E flows; product and responsible-AI sections in `README.md`.

**Verify:** Run the exact fan, Gate C closure, and Arabic-speaking-family stories from the brief, then enable demo mode and repeat them to prove resilience.
