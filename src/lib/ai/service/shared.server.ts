import "server-only";

import { getServerEnvironment } from "@/lib/config/env.server";

export interface AiServiceResult<T> {
  readonly data: T;
  readonly mode: "gemini" | "demo" | "fallback";
}

export function getOfflineMode(): "demo" | "fallback" | undefined {
  const environment = getServerEnvironment();
  if (environment.aiDemoMode) {
    return "demo";
  }
  if (environment.geminiApiKey === undefined) {
    return environment.nodeEnv === "production" ? "fallback" : "demo";
  }
  return undefined;
}
