import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VenueIQ",
    short_name: "VenueIQ",
    description: "Grounded intelligence for safer, smoother and more inclusive tournament days.",
    start_url: "/",
    display: "standalone",
    background_color: "#06111d",
    theme_color: "#06111d",
    orientation: "any",
    categories: ["navigation", "sports", "utilities"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
