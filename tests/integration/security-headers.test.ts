import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production security headers", () => {
  it("configures the required browser security policy on every route", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { default: config } = await import("../../next.config");
    const headersFactory = config.headers;
    expect(typeof headersFactory).toBe("function");
    if (headersFactory === undefined) {
      throw new Error("Expected Next.js headers configuration.");
    }

    const rules = await headersFactory();
    const allRouteRule = rules.find((rule) => rule.source === "/(.*)");
    expect(allRouteRule).toBeDefined();
    const headers = new Map(
      (allRouteRule?.headers ?? []).map((header) => [header.key.toLowerCase(), header.value]),
    );

    expect(headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("strict-transport-security")).toContain("max-age=63072000");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("permissions-policy")).toContain("geolocation=()");
    expect(headers.get("cross-origin-opener-policy")).toBe("same-origin");
    expect(headers.get("cross-origin-resource-policy")).toBe("same-origin");
  });
});
