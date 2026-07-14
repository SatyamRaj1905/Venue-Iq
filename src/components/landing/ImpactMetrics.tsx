import { impactMetrics } from "@/lib/content/landingContent";

export function ImpactMetrics() {
  return (
    <section className="impact-band" aria-labelledby="metrics-title">
      <div className="shell">
        <div className="section-heading section-heading--split section-heading--compact">
          <div>
            <p className="eyebrow">Designed to keep working</p>
            <h2 id="metrics-title">Useful signals, honest boundaries.</h2>
          </div>
          <p>
            All values shown in this hackathon experience are deterministic, seeded and clearly
            simulated.
          </p>
        </div>
        <dl className="impact-metrics">
          {impactMetrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className="impact-metrics__value">{metric.value}</dd>
              <dd className="impact-metrics__detail">{metric.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
