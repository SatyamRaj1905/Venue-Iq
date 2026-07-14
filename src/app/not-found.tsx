import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="state-page" aria-labelledby="not-found-title">
      <span className="state-page__icon">
        <SearchX size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">404 · Route not found</p>
      <h1 id="not-found-title">This path is outside the venue map.</h1>
      <p>The page may have moved, but the three tournament-day experiences are still ready.</p>
      <div className="button-row">
        <ButtonLink href="/" showArrow>
          Return home
        </ButtonLink>
        <ButtonLink href="/fan" variant="secondary">
          Open Fan Companion
        </ButtonLink>
      </div>
    </section>
  );
}
