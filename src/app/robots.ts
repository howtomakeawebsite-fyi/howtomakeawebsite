import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allowIndexing } from "@/lib/seo";

const disallow = ["/api/", "/search/"];

// Search engines and AI assistants are all welcome: a church wants to be easy to find.
const aiCrawlers = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Googlebot", "Google-Extended", "GoogleOther",
  "Bingbot",
  "Applebot", "Applebot-Extended",
  "DuckDuckBot", "DuckAssistBot",
  "CCBot",
  "meta-externalagent", "FacebookBot",
  "Amazonbot",
];

export default function robots(): MetadataRoute.Robots {
  // Test copies of the site block everything (see allowIndexing in src/lib/seo.ts).
  if (!allowIndexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/", disallow }))],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
