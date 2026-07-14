import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/config/publicEnv";

const routes = ["", "/fan", "/operations", "/volunteer", "/impact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-07-14T00:00:00.000Z"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
