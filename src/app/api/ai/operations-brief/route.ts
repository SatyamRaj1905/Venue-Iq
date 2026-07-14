import { operationsBriefRequestSchema } from "@/lib/ai/schemas";
import { createOperationsBrief } from "@/lib/ai/service/operations.server";
import { handleAiRoute } from "@/lib/security/aiRoute.server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, {
    scope: "operations-brief",
    schema: operationsBriefRequestSchema,
    userText: () => "operations briefing",
    handler: createOperationsBrief,
  });
}
