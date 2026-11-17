import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/** Lets people save the website to their phone or computer like an app. Icons are in public/icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.appName,
    description: site.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#3b2a18",
    lang: "en",
    categories: ["lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Plan Your Visit", url: "/plan-your-visit/" },
      { name: "Sermons", url: "/sermons/" },
      { name: "Give", url: "/give/" },
    ],
  };
}
