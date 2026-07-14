import { capabilities } from "@/lib/content/landingContent";

export function CapabilitySection() {
  return (
    <section className="section shell" aria-labelledby="capabilities-title">
      <div className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">One shared venue picture</p>
          <h2 id="capabilities-title">From fragmented signals to confident action.</h2>
        </div>
        <p>
          A stadium day is a chain of connected decisions. VenueIQ makes the trusted context behind
          each one easier to understand and act on.
        </p>
      </div>
      <div className="capability-grid">
        {capabilities.map(({ title, description, icon: Icon }, index) => (
          <article className="capability-card" key={title}>
            <div className="capability-card__top">
              <span className="capability-card__icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="capability-card__number" aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
