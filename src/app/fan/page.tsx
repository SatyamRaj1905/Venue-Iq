import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FanCompanionClient } from "@/components/fan/FanCompanionClient";
import "../assistant.css";
import "./fan.css";

export const metadata: Metadata = {
  title: "Fan Companion",
  description:
    "Find grounded, accessible and lower-crowd routes through the simulated VenueIQ stadium.",
  alternates: { canonical: "/fan" },
};

export default function FanPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Fan Companion"
        title="Move through the venue with confidence."
        description="Tell us what you need. VenueIQ checks the trusted stadium graph, current simulated conditions and your access preferences before it explains the route."
        status="Simulated venue live"
        statusTone="positive"
      />
      <FanCompanionClient />
    </AppShell>
  );
}
