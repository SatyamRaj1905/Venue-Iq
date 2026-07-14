"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function VolunteerError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="The Volunteer Assistant could not be loaded"
      description="Retry to restore the trusted local procedure library."
      reset={reset}
    />
  );
}
