import { ArrowRight, Bot, Braces, DatabaseZap, ShieldCheck } from "lucide-react";
import { responsiblePrinciples } from "@/lib/content/landingContent";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

const flow = [
  { label: "Venue data", detail: "Typed + seeded", icon: DatabaseZap },
  { label: "Safe tools", detail: "Read-only", icon: Braces },
  { label: "Gemini", detail: "Explain + translate", icon: Bot },
  { label: "Human team", detail: "Review + decide", icon: ShieldCheck },
];

export function ResponsibleAiSection() {
  return (
    <section className="section shell responsible" aria-labelledby="responsible-title">
      <div className="responsible__visual">
        <div className="responsible__visual-header">
          <Badge tone="positive">Guardrails active</Badge>
          <span>Decision path</span>
        </div>
        <ol className="ai-flow">
          {flow.map(({ label, detail, icon: Icon }, index) => (
            <li key={label}>
              <span className="ai-flow__icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{label}</strong>
                <span>{detail}</span>
              </div>
              {index < flow.length - 1 ? (
                <ArrowRight className="ai-flow__arrow" size={17} aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>
        <div className="responsible__decision">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <strong>No autonomous emergency actions</strong>
            <span>Venue personnel remain responsible for every operational decision.</span>
          </div>
        </div>
      </div>
      <div className="responsible__copy">
        <p className="eyebrow">Responsible intelligence</p>
        <h2 id="responsible-title">Generative AI explains. Trusted systems decide the facts.</h2>
        <p>
          VenueIQ gives AI a narrow, useful job: understand the request, call validated read-only
          tools and communicate their result clearly.
        </p>
        <div className="principle-list">
          {responsiblePrinciples.map(({ title, description, icon: Icon }) => (
            <div className="principle-list__item" key={title}>
              <Icon size={19} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <ButtonLink href="/impact" variant="secondary" showArrow>
          Explore our impact model
        </ButtonLink>
      </div>
    </section>
  );
}
