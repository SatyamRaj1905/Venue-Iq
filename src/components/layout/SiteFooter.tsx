import Link from "next/link";
import { Code2, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <Link className="brand brand--footer" href="/" aria-label="VenueIQ home">
            <span className="brand__mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand__name">
              Venue<span>IQ</span>
            </span>
          </Link>
          <p className="site-footer__description">
            One intelligent layer for safer, smoother and more inclusive tournament days.
          </p>
        </div>
        <nav className="site-footer__links" aria-label="Product links">
          <p>Explore</p>
          <Link href="/fan">Fan Companion</Link>
          <Link href="/operations">Operations Center</Link>
          <Link href="/volunteer">Volunteer Assistant</Link>
          <Link href="/impact">Impact &amp; responsibility</Link>
        </nav>
        <div className="site-footer__links">
          <p>Project</p>
          <a href="#documentation" aria-label="Documentation placeholder">
            Documentation
          </a>
          <a href="#source" aria-label="GitHub repository placeholder">
            <Code2 size={15} aria-hidden="true" /> GitHub
          </a>
          <span>
            <ShieldCheck size={15} aria-hidden="true" /> Responsible AI
          </span>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <p>&copy; {new Date().getFullYear()} VenueIQ. Hackathon demonstration.</p>
        <p>No official tournament affiliation or branding.</p>
      </div>
    </footer>
  );
}
