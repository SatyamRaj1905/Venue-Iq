"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function OperationsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="The operations view could not be loaded"
      description="No operational action was taken. Retry to restore the seeded simulation."
      reset={reset}
    />
  );
}
