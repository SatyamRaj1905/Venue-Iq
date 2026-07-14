"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function FanError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="The Fan Companion could not be loaded"
      description="Try again to restore the venue map and your route controls."
      reset={reset}
    />
  );
}
