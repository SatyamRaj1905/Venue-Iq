import { CapabilitySection } from "@/components/landing/CapabilitySection";
import { HeroSection } from "@/components/landing/HeroSection";
import { ImpactMetrics } from "@/components/landing/ImpactMetrics";
import { ResponsibleAiSection } from "@/components/landing/ResponsibleAiSection";
import { RoleSection } from "@/components/landing/RoleSection";
import { TechnologySection } from "@/components/landing/TechnologySection";
import "./landing.css";

export default function HomePage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <CapabilitySection />
      <RoleSection />
      <ResponsibleAiSection />
      <ImpactMetrics />
      <TechnologySection />
    </div>
  );
}
