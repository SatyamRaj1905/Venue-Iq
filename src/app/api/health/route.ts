import { successResponse } from "@/lib/security/safeErrors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): Response {
  return successResponse({
    status: "ok",
    service: "venueiq",
    timestamp: new Date().toISOString(),
  });
}
