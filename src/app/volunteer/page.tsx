import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { VolunteerAssistantClient } from "@/components/volunteer/VolunteerAssistantClient";
import "../assistant.css";
import "./volunteer.css";

export const metadata: Metadata = {
  title: "Volunteer Assistant",
  description:
    "Retrieve concise, multilingual venue SOP guidance with clear role boundaries and escalation steps.",
  alternates: { canonical: "/volunteer" },
};

export default function VolunteerPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Volunteer Assistant"
        title="The right procedure, in the guest’s language."
        description="Describe the situation and your role. VenueIQ retrieves trusted venue guidance, translates it and makes the correct handoff explicit."
        status="Grounded in local SOPs"
        statusTone="info"
      />
      <VolunteerAssistantClient />
    </AppShell>
  );
}
