import { ArrowUpRight } from "lucide-react";
import { roles } from "@/lib/content/landingContent";
import { ButtonLink } from "@/components/ui/Button";

export function RoleSection() {
  return (
    <section className="section section--tinted" aria-labelledby="roles-title">
      <div className="shell">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Three connected experiences</p>
          <h2 id="roles-title">The right intelligence, at the right altitude.</h2>
          <p>Each role sees the same simulated venue state through a purpose-built experience.</p>
        </div>
        <div className="role-grid">
          {roles.map(({ eyebrow, title, description, href, linkLabel, icon: Icon }, index) => (
            <article className={`role-card role-card--${index + 1}`} key={title}>
              <div className="role-card__visual" aria-hidden="true">
                <span className="role-card__ring role-card__ring--one" />
                <span className="role-card__ring role-card__ring--two" />
                <span className="role-card__icon">
                  <Icon size={30} />
                </span>
              </div>
              <p className="eyebrow">{eyebrow}</p>
              <h3>{title}</h3>
              <p>{description}</p>
              <ButtonLink
                href={href}
                variant="quiet"
                className="role-card__link"
                aria-label={linkLabel}
              >
                {linkLabel} <ArrowUpRight size={17} aria-hidden="true" />
              </ButtonLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
