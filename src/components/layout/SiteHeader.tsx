"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cx } from "@/lib/utils/classNames";
import { AccessibilityControls } from "./AccessibilityControls";

const navigation = [
  { href: "/fan", label: "Fan" },
  { href: "/operations", label: "Operations" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/impact", label: "Impact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <Link className="brand" href="/" aria-label="VenueIQ home">
          <span className="brand__mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand__name">
            Venue<span>IQ</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={cx("nav-link", isActive && "nav-link--active")}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <span className="live-pill">
            <span aria-hidden="true" /> Demo live
          </span>
          <AccessibilityControls />
          <details className="mobile-menu">
            <summary className="icon-button" aria-label="Open navigation menu">
              <Menu size={20} aria-hidden="true" />
            </summary>
            <nav className="mobile-menu__panel" aria-label="Mobile navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    className={cx("nav-link", isActive && "nav-link--active")}
                    href={item.href}
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
