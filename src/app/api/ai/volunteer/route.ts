import { volunteerRequestSchema } from "@/lib/ai/schemas";
import { assistVolunteer } from "@/lib/ai/service.server";
import { handleAiRoute } from "@/lib/security/aiRoute.server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, {
    scope: "volunteer-assist",
    schema: volunteerRequestSchema,
    userText: (payload) => payload.question,
    handler: assistVolunteer,
  });
}
