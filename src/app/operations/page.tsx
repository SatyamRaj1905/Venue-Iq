import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { OperationsClient } from "@/components/operations/OperationsClient";

export const metadata: Metadata = {
  title: "Operations Command Center",
  description:
    "Simulate venue scenarios and review grounded, human-approved operational decision support.",
  alternates: { canonical: "/operations" },
};

export default function OperationsPage() {
  return (
    <AppShell width="wide">
      <PageHeader
        eyebrow="Operations Command Center"
        title="See the venue. Understand the pressure."
        description="Activate a seeded scenario, trace the evidence and review role-specific actions. Recommendations never execute without accountable human approval."
        status="Decision support only"
        statusTone="warning"
      />
      <OperationsClient />
    </AppShell>
  );
}
