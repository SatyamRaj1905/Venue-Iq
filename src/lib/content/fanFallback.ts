import { createFanFallback as createCanonicalFanFallback } from "@/lib/ai/fallback/fan";
import type { FanAssistanceResponse, FanAssistRequest } from "@/lib/ai/schemas";
import { getAccessibleRoute } from "@/lib/ai/tools/fan";

export function createFanFallback(request: FanAssistRequest): FanAssistanceResponse {
  return createCanonicalFanFallback(request, getAccessibleRoute(request));
}
