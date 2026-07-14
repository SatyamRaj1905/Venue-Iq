import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { successEnvelopeSchema } from "@/lib/ai/schemas";
import { postJson } from "@/lib/http/postJson";

const messageEnvelopeSchema = successEnvelopeSchema(
  z.object({ message: z.string().min(1) }).strict(),
);

const validEnvelope = {
  data: { message: "Grounded response" },
  meta: { mode: "demo", simulated: true },
} as const;

afterEach(() => {
  vi.useRealTimers();
});

describe("postJson", () => {
  it("returns a runtime-validated success envelope", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(validEnvelope, { status: 200 }));

    await expect(
      postJson({
        url: "/api/example",
        body: { query: "accessible route" },
        responseSchema: messageEnvelopeSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: true, data: validEnvelope });

    expect(fetcher).toHaveBeenCalledWith(
      "/api/example",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "accessible route" }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("loads a response schema lazily after the HTTP request succeeds", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(validEnvelope, { status: 200 }));
    const loadSchema = vi.fn().mockResolvedValue(messageEnvelopeSchema);

    await expect(
      postJson({
        url: "/api/example",
        body: {},
        responseSchema: loadSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: true, data: validEnvelope });
    expect(loadSchema).toHaveBeenCalledOnce();
  });

  it("rejects a malformed successful response", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ data: { unexpected: true } }, { status: 200 }));

    await expect(
      postJson({
        url: "/api/example",
        body: {},
        responseSchema: messageEnvelopeSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: false, kind: "invalid-response" });
  });

  it("rejects a non-JSON successful response", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not-json", { status: 200 }));

    await expect(
      postJson({
        url: "/api/example",
        body: {},
        responseSchema: messageEnvelopeSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: false, kind: "invalid-response" });
  });

  it.each([429, 503])("classifies HTTP %i without trusting its response body", async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));

    await expect(
      postJson({
        url: "/api/example",
        body: {},
        responseSchema: messageEnvelopeSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: false, kind: "http-error", status });
  });

  it("classifies a request that exceeds its timeout", async () => {
    vi.useFakeTimers();
    const hangingFetch: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("The request was aborted.", "AbortError")),
          { once: true },
        );
      });
    const fetcher = vi.fn(hangingFetch);

    const pendingResult = postJson({
      url: "/api/example",
      body: {},
      responseSchema: messageEnvelopeSchema,
      timeoutMs: 50,
      fetcher,
    });
    await vi.advanceTimersByTimeAsync(50);

    await expect(pendingResult).resolves.toEqual({ ok: false, kind: "timeout" });
  });

  it("classifies a transport failure without exposing the thrown error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Internal network detail"));

    await expect(
      postJson({
        url: "/api/example",
        body: {},
        responseSchema: messageEnvelopeSchema,
        fetcher,
      }),
    ).resolves.toEqual({ ok: false, kind: "network-error" });
  });
});
