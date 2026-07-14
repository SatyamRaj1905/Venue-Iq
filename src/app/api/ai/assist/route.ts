import { fanAssistRequestSchema } from "@/lib/ai/schemas";
import { assistFan } from "@/lib/ai/service/fan.server";
import { handleAiRoute } from "@/lib/security/aiRoute.server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, {
    scope: "fan-assist",
    schema: fanAssistRequestSchema,
    userText: (payload) => payload.message,
    handler: assistFan,
  });
}
