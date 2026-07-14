"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function ImpactError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="The impact model could not be loaded"
      description="Retry to restore VenueIQ’s responsible-AI and outcome overview."
      reset={reset}
    />
  );
}
