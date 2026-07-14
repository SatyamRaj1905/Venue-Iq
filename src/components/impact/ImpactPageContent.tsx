import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { impactAreas, responsibilityCards } from "@/lib/content/impactContent";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

function ImpactIntroduction() {
  return (
    <section className="impact-intro" aria-labelledby="impact-model-title">
      <div>
        <p className="eyebrow">From friction to flow</p>
        <h2 id="impact-model-title">One shared system. Eight practical outcomes.</h2>
      </div>
      <p>
        VenueIQ is designed around moments where clear, grounded information can make a tournament
        day safer, calmer and more inclusive. The figures below describe this seeded demonstration,
        not real venue performance.
      </p>
    </section>
  );
}

function ImpactAreaGrid() {
  return (
    <section className="impact-card-grid" aria-label="VenueIQ impact areas">
      {impactAreas.map(({ title, description, metric, metricLabel, icon: Icon }, index) => (
        <article className="impact-card" key={title}>
          <div className="impact-card__visual">
            <span>
              <Icon size={22} aria-hidden="true" />
            </span>
            <i aria-hidden="true">0{index + 1}</i>
          </div>
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="impact-card__metric">
            <strong>{metric}</strong>
            <span>{metricLabel}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function ResponsibilitySection() {
  return (
    <section className="impact-responsibility" aria-labelledby="responsibility-title">
      <div className="impact-responsibility__copy">
        <Badge tone="positive">
          <ShieldCheck size={13} aria-hidden="true" /> Responsibility layer
        </Badge>
        <h2 id="responsibility-title">Useful precisely because the boundaries are visible.</h2>
        <p>
          Generative AI can make complex venue information easier to use. It should not invent that
          information, conceal uncertainty or silently make safety-critical choices.
        </p>
        <ul>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" /> No autonomous emergency actions
          </li>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" /> No unnecessary personal data storage
          </li>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" /> Clear simulated-data labelling
          </li>
        </ul>
        <ButtonLink href="/operations" variant="secondary" showArrow>
          See decision support in action
        </ButtonLink>
      </div>
      <div className="responsibility-grid">
        {responsibilityCards.map(({ title, description, icon: Icon }) => (
          <article key={title}>
            <span>
              <Icon size={19} aria-hidden="true" />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImpactCallToAction() {
  return (
    <section className="impact-cta">
      <div>
        <p className="eyebrow">See the connected experience</p>
        <h2>Choose your match-day perspective.</h2>
      </div>
      <div className="button-row">
        <ButtonLink href="/fan">
          Fan Companion <ArrowRight size={16} aria-hidden="true" />
        </ButtonLink>
        <ButtonLink href="/volunteer" variant="secondary">
          Volunteer Assistant
        </ButtonLink>
      </div>
    </section>
  );
}

export function ImpactPageContent() {
  return (
    <>
      <ImpactIntroduction />
      <ImpactAreaGrid />
      <ResponsibilitySection />
      <ImpactCallToAction />
    </>
  );
}
