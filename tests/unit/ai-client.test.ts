import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ThinkingLevel } from "@google/genai";

import { AiGenerationError, generateValidatedJsonWith } from "@/lib/ai/client.server";

const responseSchema = z.object({ summary: z.string() }).strict();
const generationRequest = {
  systemInstruction: "Use trusted facts.",
  prompt: "Trusted facts only.",
  responseJsonSchema: {
    type: "object",
    properties: { summary: { type: "string" } },
    required: ["summary"],
  },
  schema: responseSchema,
};

describe("Gemini structured generation", () => {
  it("uses low-temperature constrained JSON generation", async () => {
    const generate = vi.fn().mockResolvedValue({ text: '{"summary":"Grounded"}' });
    await expect(
      generateValidatedJsonWith(generate, "configured-model", generationRequest),
    ).resolves.toEqual({
      summary: "Grounded",
    });

    expect(generate).toHaveBeenCalledOnce();
    const call = generate.mock.calls[0]?.[0];
    expect(call.model).toBe("configured-model");
    expect(call.config).toMatchObject({
      temperature: 0.15,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      candidateCount: 1,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    });
  });

  it("retries once after invalid structured output", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: "not-json" })
      .mockResolvedValueOnce({ text: '{"summary":"Recovered"}' });

    await expect(generateValidatedJsonWith(generate, "model", generationRequest)).resolves.toEqual({
      summary: "Recovered",
    });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient model error", async () => {
    const generate = vi.fn().mockRejectedValue({ status: 400 });
    await expect(
      generateValidatedJsonWith(generate, "model", generationRequest),
    ).rejects.toBeInstanceOf(AiGenerationError);
    expect(generate).toHaveBeenCalledOnce();
  });

  it("returns a generic error after the single retry", async () => {
    const generate = vi.fn().mockResolvedValue({ text: '{"unexpected":true}' });
    await expect(generateValidatedJsonWith(generate, "model", generationRequest)).rejects.toThrow(
      "did not return a usable response",
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
