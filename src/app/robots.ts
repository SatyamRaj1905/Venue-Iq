import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/config/publicEnv";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${getPublicAppUrl()}/sitemap.xml`,
  };
}
