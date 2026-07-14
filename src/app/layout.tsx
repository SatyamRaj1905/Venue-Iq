import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getPublicAppUrl } from "@/lib/config/publicEnv";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import "./globals.css";
import "./layout.css";

const appUrl = getPublicAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "VenueIQ | Intelligent tournament-day support",
    template: "%s | VenueIQ",
  },
  description:
    "Grounded AI support for safer navigation, clearer venue operations and more inclusive tournament days.",
  applicationName: "VenueIQ",
  authors: [{ name: "VenueIQ hackathon team" }],
  creator: "VenueIQ",
  category: "technology",
  alternates: { canonical: "/" },
  keywords: ["venue intelligence", "accessible navigation", "stadium operations", "responsible AI"],
  openGraph: {
    title: "VenueIQ — intelligence for every tournament-day moment",
    description:
      "A grounded, inclusive intelligence layer for fans, volunteers and venue operations.",
    url: "/",
    siteName: "VenueIQ",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VenueIQ stadium intelligence interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VenueIQ",
    description: "Safer, smoother and more inclusive tournament days.",
    images: ["/opengraph-image"],
  },
  icons: { icon: "/icon", apple: "/icon" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#06111d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SkipLink />
        <div className="site-background" aria-hidden="true">
          <span />
          <span />
        </div>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
