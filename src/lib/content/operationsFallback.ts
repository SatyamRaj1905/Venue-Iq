import { createOperationsFallback as createCanonicalOperationsFallback } from "@/lib/ai/fallback/operations";
import type { OperationsBrief, OperationsBriefRequest } from "@/lib/ai/schemas";
import { getOperationsGroundingFromState } from "@/lib/ai/tools/operations";
import type { SimulationState } from "@/lib/domain";

export function createOperationsFallback(snapshot: SimulationState): OperationsBrief {
  const request: OperationsBriefRequest = {
    scenario: snapshot.scenarioId,
    language: "en",
    seed: snapshot.seed,
    tick: snapshot.tick,
  };
  return createCanonicalOperationsFallback(request, getOperationsGroundingFromState(snapshot));
}
