import { getServerEnvironment } from "@/lib/config/env.server";

function normalizeOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return undefined;
  }
}

function requestOrigin(request: Request): string | undefined {
  const explicitOrigin = request.headers.get("origin");
  return explicitOrigin === null ? undefined : normalizeOrigin(explicitOrigin);
}

export function isTrustedRequestOrigin(request: Request): boolean {
  const environment = getServerEnvironment();
  if (environment.nodeEnv !== "production") {
    return true;
  }

  const origin = requestOrigin(request);
  if (origin === undefined) {
    return false;
  }

  const configuredOrigin = normalizeOrigin(environment.appUrl);
  const routeOrigin = normalizeOrigin(request.url);
  return origin === configuredOrigin || origin === routeOrigin;
}
