import "server-only";

import { z } from "zod";

const optionalSecretSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).max(2_048).optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    GEMINI_API_KEY: optionalSecretSchema,
    GEMINI_MODEL: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/)
      .default("gemini-3.1-flash-lite"),
    AI_DEMO_MODE: z.enum(["true", "false"]).default("false"),
    UPSTASH_REDIS_REST_URL: optionalUrlSchema,
    UPSTASH_REDIS_REST_TOKEN: optionalSecretSchema,
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  })
  .superRefine((environment, context) => {
    const hasUrl = environment.UPSTASH_REDIS_REST_URL !== undefined;
    const hasToken = environment.UPSTASH_REDIS_REST_TOKEN !== undefined;

    if (hasUrl !== hasToken) {
      context.addIssue({
        code: "custom",
        message: "Upstash credentials must be configured together.",
        path: ["UPSTASH_REDIS_REST_URL"],
      });
    }
  });

export interface ServerEnvironment {
  readonly nodeEnv: "development" | "test" | "production";
  readonly geminiApiKey?: string;
  readonly geminiModel: string;
  readonly aiDemoMode: boolean;
  readonly upstash?: Readonly<{ url: string; token: string }>;
  readonly appUrl: string;
}

/**
 * Reads server configuration lazily so importing schemas never captures a secret.
 * The returned object must remain inside server-only modules and route handlers.
 */
export function getServerEnvironment(): ServerEnvironment {
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    AI_DEMO_MODE: process.env.AI_DEMO_MODE,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    throw new Error("Server environment configuration is invalid.");
  }

  const upstash =
    parsed.data.UPSTASH_REDIS_REST_URL !== undefined &&
    parsed.data.UPSTASH_REDIS_REST_TOKEN !== undefined
      ? {
          url: parsed.data.UPSTASH_REDIS_REST_URL,
          token: parsed.data.UPSTASH_REDIS_REST_TOKEN,
        }
      : undefined;

  return {
    nodeEnv: parsed.data.NODE_ENV,
    ...(parsed.data.GEMINI_API_KEY === undefined
      ? {}
      : { geminiApiKey: parsed.data.GEMINI_API_KEY }),
    geminiModel: parsed.data.GEMINI_MODEL,
    aiDemoMode: parsed.data.AI_DEMO_MODE === "true",
    ...(upstash === undefined ? {} : { upstash }),
    appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
  };
}
