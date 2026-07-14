# VenueIQ judging evidence

This guide maps each judging parameter to implementation evidence and a quick verification path.

## Code quality

**Evidence:** Strict TypeScript flags, thin route composition, role-scoped AI modules, canonical domain identifiers, reusable UI, pure deterministic modules, discriminated network states, runtime-validated client responses, named exports, and a no-`any`/no-`@ts-ignore` policy. ESLint permanently caps production complexity at 12, functions at 80 lines, and files at 500 nonblank lines with no module exceptions.

**Source:** `tsconfig.json`, `eslint.config.mjs`, `src/app`, `src/components`, `src/lib/domain`, `src/lib/ai`.

**Tests/docs:** `tests/unit`, `tests/components`, `ARCHITECTURE.md`; fallback-adapter parity, prompt-size, graph-integrity, cache, and malformed-response tests protect the refactored boundaries.

**Verify:** `npm run format:check && npm run lint && npm run type-check`.

## Security

**Evidence:** Server-only Gemini client, strict Zod input and output parsing, bounded streaming JSON payloads, trusted-origin checks, prompt-injection screening, local development limiting, fail-closed Upstash production limiting, safe public errors, deterministic fallback, no model HTML, and strong headers.

**Source:** `src/lib/config/env.server.ts`, `src/lib/ai`, `src/lib/security`, `src/app/api`, `next.config.ts`, `.env.example`.

**Tests/docs:** API integration and AI validation tests; `SECURITY.md`.

**Verify:** Submit unknown/oversized fields, inspect `/api/health`, run `curl -I`, search browser bundles for the secret name/value, and run `npm run audit:prod`.

## Efficiency

**Evidence:** Server Components by default, isolated interactive clients, custom SVG map and charts, no remote fonts/assets or heavy map/chart dependency, route-scoped CSS, lazy response-schema loading, cancellable stale requests, bounded warm-instance caches, indexed graph queries, and binary-heap Dijkstra routing in `O((V + E) log V)`. Seeded scenarios update locally without polling.

**Source:** `src/app`, `src/components`, `src/lib/domain/routing.ts`, `src/lib/domain/stadiumGraph.ts`, `src/lib/http/postJson.ts`, `src/lib/ai/service`, `scripts/check-bundle-budget.mjs`, `package.json`.

**Tests/docs:** Browser/mobile tests and enforced route budgets in `PERFORMANCE.md`.

**Verify:** Run `npm run build && npm run bundle:check`, inspect Network requests, then audit the deployed preview with Lighthouse.

## Testing

**Evidence:** 181 unit, component, and integration checks cover routing, graph integrity, operational math, schemas, prompt budgets, caches, fallbacks, client transport failures, and API contracts. Ten primary E2E journeys and four axe scans complete the 195-check release gate. CI performs every gate without a live model key.

**Source:** `tests`, `vitest.config.mts`, `playwright.config.ts`, `.github/workflows/ci.yml`.

**Docs:** `TESTING.md`.

**Verify:** `npm run verify:full`; inspect the Vitest coverage summary and Playwright report.

## Accessibility

**Evidence:** Skip link, landmarks, labels, keyboard controls, 44px targets, visible focus, text-plus-icon states, polite live regions, route list alternative, Arabic RTL, large-text/high-contrast preferences, responsive reflow, and reduced motion.

**Source:** shared layout/UI components, `src/components/fan`, `src/components/operations`, `src/components/volunteer`, and the shared/route-scoped styles in `src/app`.

**Tests/docs:** `tests/accessibility`, keyboard/mobile E2E cases, `ACCESSIBILITY.md`.

**Verify:** `npm run test:a11y`, keyboard-only navigation, VoiceOver/NVDA route reading, 200% zoom, and Arabic language selection.

## Problem-statement alignment

**Evidence:** The three role experiences share a stadium twin and cover accessible navigation, crowd management, transport disruption, multilingual help, sustainability, volunteer SOP support, and human-approved operations intelligence. AI is visibly grounded rather than presented as a generic chat surface.

**Source:** `/fan`, `/operations`, `/volunteer`, `/impact`, `src/lib/domain`, `src/lib/content/volunteerSops.ts`, `src/lib/ai/tools.ts`.

**Tests/docs:** Primary demo E2E flows; product and responsible-AI sections in `README.md`.

**Verify:** Run the exact fan, Gate C closure, and Arabic-speaking-family stories from the brief, then enable demo mode and repeat them to prove resilience.
