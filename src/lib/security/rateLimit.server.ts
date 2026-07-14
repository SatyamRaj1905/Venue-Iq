import "server-only";

import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getServerEnvironment } from "@/lib/config/env.server";

const LIMIT = 20;
const WINDOW_MS = 60_000;
const MAX_EPHEMERAL_ENTRIES = 1_000;

interface LocalWindow {
  count: number;
  reset: number;
}

export interface RateLimitResult {
  readonly success: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
}

const localWindows = new Map<string, LocalWindow>();
const upstashEphemeralCache = new Map<string, number>();

interface UpstashLimiterCache {
  readonly url: string;
  readonly token: string;
  readonly limiter: Ratelimit;
}

let upstashLimiterCache: UpstashLimiterCache | undefined;

export class RateLimitUnavailableError extends Error {
  public constructor() {
    super("Production rate limiting is unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

function clientAddress(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")?.split(",", 1)[0]?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return (realIp ?? vercelForwarded ?? forwarded ?? "anonymous").slice(0, 100);
}

function identifierFor(request: Request, scope: string): string {
  return createHash("sha256")
    .update(`${scope}:${clientAddress(request)}`)
    .digest("hex")
    .slice(0, 32);
}

function cleanExpiredWindows(now: number): void {
  if (localWindows.size < 1_000) {
    return;
  }
  for (const [key, window] of localWindows) {
    if (window.reset <= now) {
      localWindows.delete(key);
    }
  }
}

function checkLocalLimit(identifier: string, now = Date.now()): RateLimitResult {
  cleanExpiredWindows(now);
  const current = localWindows.get(identifier);
  if (current === undefined || current.reset <= now) {
    const reset = now + WINDOW_MS;
    localWindows.set(identifier, { count: 1, reset });
    return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset };
  }

  current.count += 1;
  return {
    success: current.count <= LIMIT,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - current.count),
    reset: current.reset,
  };
}

function createUpstashLimiter(url: string, token: string): Ratelimit {
  return new Ratelimit({
    redis: new Redis({ url, token, enableTelemetry: false }),
    limiter: Ratelimit.slidingWindow(LIMIT, "1 m"),
    analytics: false,
    prefix: "venueiq:ai",
    ephemeralCache: upstashEphemeralCache,
  });
}

function getUpstashLimiter(url: string, token: string): Ratelimit {
  if (upstashLimiterCache?.url === url && upstashLimiterCache.token === token) {
    return upstashLimiterCache.limiter;
  }

  upstashEphemeralCache.clear();
  const limiter = createUpstashLimiter(url, token);
  upstashLimiterCache = { url, token, limiter };
  return limiter;
}

function pruneEphemeralCache(now = Date.now()): void {
  if (upstashEphemeralCache.size < MAX_EPHEMERAL_ENTRIES) {
    return;
  }
  for (const [key, reset] of upstashEphemeralCache) {
    if (reset <= now) {
      upstashEphemeralCache.delete(key);
    }
  }
  while (upstashEphemeralCache.size >= MAX_EPHEMERAL_ENTRIES) {
    const oldestKey = upstashEphemeralCache.keys().next().value as string | undefined;
    if (oldestKey === undefined) {
      break;
    }
    upstashEphemeralCache.delete(oldestKey);
  }
}

export async function checkAiRateLimit(request: Request, scope: string): Promise<RateLimitResult> {
  const identifier = identifierFor(request, scope);
  const environment = getServerEnvironment();
  if (environment.upstash === undefined) {
    if (environment.nodeEnv === "production") {
      throw new RateLimitUnavailableError();
    }
    return checkLocalLimit(identifier);
  }

  try {
    pruneEphemeralCache();
    const limiter = getUpstashLimiter(environment.upstash.url, environment.upstash.token);
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    if (environment.nodeEnv === "production") {
      throw new RateLimitUnavailableError();
    }
    return checkLocalLimit(identifier);
  }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "ratelimit-limit": String(result.limit),
    "ratelimit-remaining": String(result.remaining),
    "ratelimit-reset": String(Math.ceil(result.reset / 1_000)),
  };
}

export function resetLocalRateLimitForTests(): void {
  localWindows.clear();
  upstashEphemeralCache.clear();
  upstashLimiterCache = undefined;
}
