import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns a no-store health response without configuration details", async () => {
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.status).toBe("ok");
    expect(body.service).toBe("venueiq");
    expect(JSON.stringify(body)).not.toMatch(/key|token|upstash|gemini/i);
  });
});
