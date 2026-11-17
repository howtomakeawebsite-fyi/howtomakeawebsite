import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getPages } from "@/lib/content";

const modified = (rel: string) => {
  try { return fs.statSync(path.join(process.cwd(), "content", rel)).mtime; } catch { return undefined; }
};

/** /sitemap.xml: the list of pages for search engines. New page files are added by themselves. */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: modified("home.json"), changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/sermons/`, changeFrequency: "weekly", priority: 0.8 },
  ];
  const important = new Set(["plan-your-visit", "about", "contact", "events"]);
  const pages: MetadataRoute.Sitemap = getPages()
    // Hidden pages are marked "noindex", so they stay out of the sitemap.
    .filter((p) => p.section !== "hidden")
    .map((p) => ({
      url: `${site.url}/${p.slug}/`,
      lastModified: modified(`pages/${p.slug}.mdx`),
      changeFrequency: p.slug === "events" ? ("daily" as const) : ("monthly" as const),
      priority: important.has(p.slug) ? 0.9 : p.slug === "privacy-policy" ? 0.3 : 0.6,
    }));
  return [...fixed, ...pages];
}
