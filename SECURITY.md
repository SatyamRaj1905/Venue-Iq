# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Send a private report to the repository owner with reproduction steps, affected routes, impact, and a safe proof of concept. The maintainer should acknowledge the report within three business days and coordinate a fix before disclosure.

## Secret handling

`GEMINI_API_KEY` and Upstash credentials are server-only. They must exist only in `.env.local`, the host's encrypted environment-variable store, or CI secrets. `.env*` files are ignored except `.env.example`; public variables use the explicit `NEXT_PUBLIC_` prefix. Health responses, logs, prompts, and error payloads never include configuration values.

The key exposed in a support conversation should be rotated before a public deployment. Never paste a real key into an issue, screenshot, test fixture, or commit.

## Request controls

AI endpoints accept `POST` with `application/json` only. They apply bounded body and message sizes, strict Zod schemas that reject unknown keys, enum and array limits, production same-origin validation, and consistent public error shapes. Suspicious requests for system prompts, credentials, or internal configuration are rejected before a model call.

## Rate limiting

Production must configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed limiting. Missing or unreachable production rate limiting fails closed with a safe `503`; it never silently falls back to a per-instance counter. A bounded in-memory limiter protects local development. Rate-limit responses include a retry hint without leaking infrastructure details.

## Generative-AI controls

- Trusted stadium data is calculated before the model call.
- The system instruction treats user input as data and preserves venue policy.
- Prompts contain no secrets and no conversation history by default.
- Output is restricted to JSON and validated with Zod.
- Timeout, one retry, and deterministic fallback bound failure.
- Gemini never executes an operation or an emergency action.
- Emergency content directs the user to the venue emergency team.

## Browser and transport controls

`next.config.ts` sets CSP, anti-framing, MIME sniffing protection, a strict referrer policy, restrictive permissions policy, COOP/CORP, and production HSTS. There are no remote fonts, scripts, analytics tags, or third-party images. Vercel provides TLS at the edge.

## Data minimization

VenueIQ does not create accounts, store chat history, or persist precise location. User preferences may be stored locally in the browser. Requests should not include names, tickets, contact data, or medical records.

## Dependencies

Run:

```bash
npm audit --omit=dev
```

Review every production finding before release. Do not apply `npm audit fix --force` without reviewing framework compatibility and the lockfile diff.

## Demonstration limitations

All stadium, crowd, transport, incident, and sustainability values are simulated. This repository is a decision-support prototype, not a certified life-safety system. Real deployment requires venue-specific threat modelling, identity and authorization, audited SOP ownership, telemetry governance, resilience testing, and security review.
