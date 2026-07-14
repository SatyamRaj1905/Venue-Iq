# VenueIQ performance and efficiency

VenueIQ treats efficiency as a release constraint rather than an unverified claim. The repository
checks the initial JavaScript and CSS referenced by every primary production route after each
release build.

## Reproduce the bundle check

```bash
npm run build
npm run bundle:check
```

The checker reads each prerendered HTML artifact in `.next/server/app`, resolves its unique
`/_next/static/chunks` references, and measures JavaScript and CSS separately. Raw size is the
compiled file size; gzip size is calculated with Node.js `zlib.gzipSync`. Vercel may negotiate a
different transfer encoding, so these numbers are a stable regression signal rather than a claim
about exact bytes received by every browser.

## Enforced budgets

The same caps apply independently to `/`, `/fan`, `/operations`, `/volunteer`, and `/impact`.
They deliberately leave headroom for maintenance while preventing an unnoticed large dependency
or client-boundary regression.

| Metric                         | Maximum per route |
| ------------------------------ | ----------------: |
| Initial JavaScript, raw        |           850 KiB |
| Initial JavaScript, gzip       |           260 KiB |
| Initial CSS, raw               |            40 KiB |
| Initial CSS, gzip              |            11 KiB |
| Initial JavaScript + CSS, gzip |           280 KiB |

`npm run verify`, the GitHub Actions workflow, and the Vercel build command all run the budget
check after producing a fresh Next.js build.

## Current production baseline

The table below is refreshed from `npm run bundle:check` after a successful production build.

| Route         |    JS raw |   JS gzip |  CSS raw | CSS gzip | Total gzip |
| ------------- | --------: | --------: | -------: | -------: | ---------: |
| `/`           | 632.1 KiB | 189.3 KiB | 29.8 KiB |  8.0 KiB |  197.2 KiB |
| `/fan`        | 737.6 KiB | 222.0 KiB | 30.8 KiB |  8.4 KiB |  230.4 KiB |
| `/operations` | 702.8 KiB | 211.2 KiB | 28.6 KiB |  7.4 KiB |  218.6 KiB |
| `/volunteer`  | 678.1 KiB | 204.5 KiB | 24.0 KiB |  6.9 KiB |  211.4 KiB |
| `/impact`     | 634.7 KiB | 190.4 KiB | 21.1 KiB |  5.8 KiB |  196.2 KiB |

Baseline environment: Next.js 16.2.10 production build, Node.js 24.16.0, npm 11.13.0,
measured on 14 July 2026. The caps intentionally leave maintenance headroom; they should be
tightened after a future measured reduction.

## Measured stylesheet reduction

Before route splitting, every primary page loaded the same 58.6 KiB raw / 12.2 KiB gzip
stylesheet. Shared foundations now remain global while each experience imports only its own visual
rules.

| Route         | CSS gzip before | CSS gzip now | Reduction |
| ------------- | --------------: | -----------: | --------: |
| `/`           |        12.2 KiB |      8.0 KiB |     34.4% |
| `/fan`        |        12.2 KiB |      8.4 KiB |     31.1% |
| `/operations` |        12.2 KiB |      7.4 KiB |     39.3% |
| `/volunteer`  |        12.2 KiB |      6.9 KiB |     43.4% |
| `/impact`     |        12.2 KiB |      5.8 KiB |     52.5% |

## Design choices that reduce work

- Server Components remain the default; only interactive workspaces and global preferences
  hydrate in the browser.
- Venue maps and operational visualizations use local SVG and CSS rather than map or chart
  runtimes.
- Seeded scenarios change only after explicit user input, with no background polling.
- Graph queries reuse immutable indexes, and route search uses a binary heap with
  `O((V + E) log V)` complexity.
- Browser requests share one timeout/abort boundary and load Zod response schemas lazily, keeping
  validation out of initial route chunks.
- Warm server instances reuse parsed configuration, Gemini and Upstash clients, and a bounded
  one-minute cache for identical operations brief coordinates.
- Static venue facts and deterministic fallbacks avoid extra data services and remain available
  if Gemini is unavailable.
- The styling layer is plain local CSS. Shared foundations load from the root layout while landing
  and role styles compile into route-scoped chunks, so each page avoids unrelated CSS.
- VenueIQ does not ship a utility-CSS runtime or require a Tailwind/PostCSS build plugin.

Bundle budgets complement, but do not replace, deployed Lighthouse and Core Web Vitals checks.
Browser metrics depend on the deployment region, device, network, and Vercel cache state and
should be recorded separately against the final production URL.
