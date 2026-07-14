import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  CircleCheck,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

const signalRows = [
  { label: "North concourse", value: "Flow stable", tone: "positive" },
  { label: "Accessible route", value: "Step-free", tone: "info" },
  { label: "Gate C", value: "Watch queue", tone: "warning" },
] as const;

function HeroCopy() {
  return (
    <div className="hero__copy">
      <Badge tone="info" className="hero__badge">
        <Sparkles size={13} aria-hidden="true" /> 2026 tournament-day demonstration
      </Badge>
      <h1 id="hero-title">
        One intelligent layer for <span>every moment</span> at the venue.
      </h1>
      <p className="hero__lead">
        VenueIQ connects grounded stadium data with role-aware AI so fans move with confidence,
        volunteers respond clearly and operations teams decide with evidence.
      </p>
      <div className="hero__actions">
        <ButtonLink href="/fan" size="large" showArrow>
          Open Fan Companion
        </ButtonLink>
        <ButtonLink href="/operations" size="large" variant="secondary">
          Explore Operations
        </ButtonLink>
      </div>
      <Link className="hero__volunteer-link" href="/volunteer">
        Supporting the venue today? Open Volunteer Assistant{" "}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
      <ul className="hero__trust-list" aria-label="Product assurances">
        <li>
          <ShieldCheck size={16} aria-hidden="true" /> Grounded recommendations
        </li>
        <li>
          <Accessibility size={16} aria-hidden="true" /> WCAG-aware experience
        </li>
        <li>
          <CircleCheck size={16} aria-hidden="true" /> Works in demo mode
        </li>
      </ul>
    </div>
  );
}

function StadiumOrbit() {
  return (
    <div className="stadium-orbit">
      <svg
        className="stadium-orbit__svg"
        viewBox="0 0 520 410"
        role="img"
        aria-labelledby="stadium-preview-title stadium-preview-description"
      >
        <title id="stadium-preview-title">Abstract stadium status map</title>
        <desc id="stadium-preview-description">
          An oval stadium with four gates, a highlighted accessible route and three crowd status
          zones.
        </desc>
        <defs>
          <linearGradient id="orbitStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#49e7ff" />
            <stop offset="1" stopColor="#a7f45b" />
          </linearGradient>
          <radialGradient id="pitchGlow">
            <stop offset="0" stopColor="#1a5572" stopOpacity=".7" />
            <stop offset="1" stopColor="#071421" stopOpacity=".15" />
          </radialGradient>
        </defs>
        <ellipse className="stadium-orbit__radar" cx="260" cy="205" rx="214" ry="157" />
        <ellipse className="stadium-orbit__outer" cx="260" cy="205" rx="176" ry="126" />
        <ellipse className="stadium-orbit__inner" cx="260" cy="205" rx="130" ry="84" />
        <rect className="stadium-orbit__pitch" x="195" y="166" width="130" height="78" rx="8" />
        <path className="stadium-orbit__pitch-line" d="M260 166v78M195 205h130" />
        <circle className="stadium-orbit__pitch-line" cx="260" cy="205" r="13" />
        <path
          className="stadium-orbit__route"
          d="M78 252 C126 244, 152 262, 173 239 S211 214, 226 205"
        />
        <circle className="stadium-orbit__route-dot" cx="78" cy="252" r="6" />
        <circle
          className="stadium-orbit__route-dot stadium-orbit__route-dot--end"
          cx="226"
          cy="205"
          r="7"
        />
        <g className="stadium-orbit__gate">
          <circle cx="260" cy="60" r="13" />
          <text x="260" y="64">
            A
          </text>
        </g>
        <g className="stadium-orbit__gate">
          <circle cx="449" cy="205" r="13" />
          <text x="449" y="209">
            B
          </text>
        </g>
        <g className="stadium-orbit__gate stadium-orbit__gate--warning">
          <circle cx="260" cy="350" r="13" />
          <text x="260" y="354">
            C
          </text>
        </g>
        <g className="stadium-orbit__gate">
          <circle cx="71" cy="205" r="13" />
          <text x="71" y="209">
            D
          </text>
        </g>
      </svg>
      <div className="stadium-orbit__score">
        <span>Venue flow</span>
        <strong>82</strong>
        <small>Stable</small>
      </div>
      <div className="map-chip map-chip--route">
        <MapPinned size={14} aria-hidden="true" /> Route ready
      </div>
      <div className="map-chip map-chip--signal">
        <RadioTower size={14} aria-hidden="true" /> 18 signals
      </div>
    </div>
  );
}

function HeroSignals() {
  return (
    <div className="hero-preview__signals">
      {signalRows.map((row) => (
        <div className="signal-row" key={row.label}>
          <span>{row.label}</span>
          <Badge tone={row.tone}>{row.value}</Badge>
        </div>
      ))}
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="hero-preview" aria-label="Simulated stadium intelligence preview">
      <div className="hero-preview__topbar">
        <div>
          <span className="live-pill">
            <span aria-hidden="true" /> Stadium signal
          </span>
          <p>Venue overview</p>
        </div>
        <span className="hero-preview__time">T−00:42:18</span>
      </div>
      <StadiumOrbit />
      <HeroSignals />
      <p className="hero-preview__caption">
        Simulated demonstration data <span aria-hidden="true">•</span> No official affiliation
      </p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <HeroCopy />
      <HeroPreview />
    </section>
  );
}
