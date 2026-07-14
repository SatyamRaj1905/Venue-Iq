import { Accessibility, Braces, CheckCircle2, Cpu, Languages, LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const technology = [
  { label: "Next.js + TypeScript", icon: Braces },
  { label: "Google Gemini", icon: Cpu },
  { label: "Deterministic tools", icon: CheckCircle2 },
  { label: "Server-side secrets", icon: LockKeyhole },
  { label: "Six languages", icon: Languages },
  { label: "WCAG 2.2 AA target", icon: Accessibility },
];

export function TechnologySection() {
  return (
    <section className="section shell technology" aria-labelledby="technology-title">
      <div>
        <p className="eyebrow">Built for a trustworthy demo</p>
        <h2 id="technology-title">Fast at the edge. Grounded at the core.</h2>
        <p>
          A production-minded Next.js application with server-only Gemini access, validated
          structured output, safe fallback responses and no external visual assets.
        </p>
        <ButtonLink href="/fan" showArrow>
          Try the fan journey
        </ButtonLink>
      </div>
      <ul className="technology__list">
        {technology.map(({ label, icon: Icon }) => (
          <li key={label}>
            <Icon size={18} aria-hidden="true" /> {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
