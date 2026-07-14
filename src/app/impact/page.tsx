import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImpactPageContent } from "@/components/impact/ImpactPageContent";

export const metadata: Metadata = {
  title: "Impact & Responsible AI",
  description:
    "Explore VenueIQ’s practical tournament-day impact and the responsible AI controls behind it.",
  alternates: { canonical: "/impact" },
};

export default function ImpactPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Impact & responsibility"
        title="Better flow is a human outcome."
        description="VenueIQ connects access, movement and operational context while keeping trusted data, accountable decisions and honest failure states at the center."
        status="Simulated impact model"
        statusTone="info"
      />
      <ImpactPageContent />
    </AppShell>
  );
}
