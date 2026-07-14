import { z } from "zod";

const publicUrlSchema = z.url();

/** Only intentionally public configuration may be exported from this module. */
export function getPublicAppUrl(): string {
  const parsed = publicUrlSchema.safeParse(process.env.NEXT_PUBLIC_APP_URL);
  return parsed.success ? parsed.data : "http://localhost:3000";
}
