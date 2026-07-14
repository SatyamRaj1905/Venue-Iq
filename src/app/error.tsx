"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function RootError({ reset }: { reset: () => void }) {
  return <ErrorState reset={reset} />;
}
