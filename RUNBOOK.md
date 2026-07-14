# VenueIQ runbook

## Prerequisites

- Node.js 24 LTS (use the version in `.nvmrc`)
- npm 11 or newer
- Git
- A Gemini API key for live AI responses
- Upstash Redis REST credentials (optional locally, required for production AI routes)
- A Vercel account and CLI for CLI deployment

## Local setup

```bash
git clone <repository-url>
cd venueiq
npm install
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill `.env.local`:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
AI_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never prefix the Gemini or Upstash variables with `NEXT_PUBLIC_`. Restart the server after changing environment values.

Start development:

```bash
npm run dev
```

Open <http://localhost:3000>.

## Run without Gemini

Set:

```env
AI_DEMO_MODE=true
```

No API key is required. All pages and role flows use deterministic fixture explanations over the real local stadium tools.

## Local verification

```bash
npm run format:check
npm run lint
npm run type-check
npm run test
npm run build
```

Browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Complete verification:

```bash
npm run verify:full
```

Dependency audit:

```bash
npm run audit:prod
```

## Local production test

```bash
npm run build
npm run start
```

Visit the five page routes and `/api/health`, inspect browser console output, then confirm headers with:

```bash
curl -I http://localhost:3000
```

## Vercel Method A: GitHub integration

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the repository.
3. Confirm the detected framework is Next.js and the install command is `npm ci`.
4. Add `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_DEMO_MODE`, `NEXT_PUBLIC_APP_URL`, and both Upstash variables. The Upstash pair is required for live Preview/Production AI routes.
5. Deploy a Preview build.
6. Verify `/`, `/fan`, `/operations`, `/volunteer`, `/impact`, `/api/health`, live Gemini and fallback behavior, headers, mobile layout, keyboard navigation, and browser console.
7. Merge to the production branch or promote the verified deployment.
8. Re-run the same checks on the production URL.

## Vercel Method B: CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel env add GEMINI_API_KEY
vercel env add GEMINI_MODEL
vercel env add AI_DEMO_MODE
vercel env add NEXT_PUBLIC_APP_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env pull .env.local
```

Preview:

```bash
vercel
```

Production:

```bash
vercel --prod
```

Environment-variable changes affect only new deployments. Redeploy after every change.

## Post-deployment verification

- Landing links open all role experiences.
- Fan low-crowd and step-free routes contain deterministic steps and text alternatives.
- Spanish output is visible and Arabic result content is RTL.
- Gate C closure changes zones, incident, timeline, and briefing.
- Volunteer response contains the trusted checklist and escalation role.
- Gemini status is clear; disabling the key or enabling demo mode yields safe fallback.
- `/api/health` exposes status and version only, not configuration values.
- CSP, anti-framing, nosniff, referrer, permissions, COOP, CORP, and HSTS headers are present as applicable.
- Mobile and keyboard journeys work and the browser console is clean.

## Troubleshooting

### Missing Gemini API key

Either add `GEMINI_API_KEY` and restart, or set `AI_DEMO_MODE=true`. The latter is an expected supported mode.

### Invalid Gemini model

Confirm `GEMINI_MODEL` names a model enabled for the supplied key. The supplied `gemini-2.5-flash` setting returned a Google 404 for new users on 14 July 2026, so this project currently defaults to the low-latency stable `gemini-3.1-flash-lite`. Model availability changes over time; restart locally or redeploy on Vercel after updating it.

### Rate-limit configuration missing

Local development uses the bounded process-local limiter. Production requires both Upstash REST variables together and intentionally returns a safe `503 RATE_LIMIT_UNAVAILABLE` when the pair is missing or Redis cannot be reached. A single missing value is invalid configuration.

### Playwright browser missing

Run `npx playwright install chromium`. On Linux CI use `npx playwright install --with-deps chromium`.

### Port 3000 is already in use

Stop the existing process or run `npm run dev -- --port 3001`, then set `NEXT_PUBLIC_APP_URL` to the matching URL.

### Environment changed but behavior did not

Stop and restart the local server. On Vercel, create a new deployment; editing an environment variable does not rebuild an existing deployment.

### Request rejected in production

Confirm `NEXT_PUBLIC_APP_URL` exactly matches the deployment origin and the client sends `application/json`. Check whether the safe error code indicates validation, origin, payload size, or rate limit.
