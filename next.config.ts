import fs from "node:fs";
import type { NextConfig } from "next";
import { redirects } from "./redirects";

// Content Security Policy: the browser only runs scripts and shows frames from the places listed here,
// so an injected script from anywhere else is blocked.
// When you add a new embed (a new video, map or form provider), add its address to the right line.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com", // Cloudflare Turnstile ("Verify you are human")
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", // includes YouTube video thumbnails
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  // Frames: YouTube player, Google Maps, Turnstile
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://maps.google.com https://www.google.com https://challenges.cloudflare.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // The live site cannot be shown inside another site's page, and gets the Content Security Policy.
  // The preview on your own computer (npm run dev) gets neither, so developer tools keep working.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Content-Security-Policy", value: csp }]
    : []),
];

// The real address of the site (from the environment, or content/settings.json). Every other address that
// serves this site (for example *.vercel.app previews) is kept out of search results, so Google never sees duplicates.
function mainHost(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL || JSON.parse(fs.readFileSync("content/settings.json", "utf8")).url;
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "localhost" ? null : host;
  } catch {
    return null;
  }
}
const host = mainHost();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Every address ends in "/", for example /about/.
  trailingSlash: true,
  poweredByHeader: false,
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return redirects;
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...(host
        ? [
            {
              source: "/:path*",
              has: [{ type: "host" as const, value: `(?!(www\\.)?${host.replace(/\./g, "\\.")}$).*` }],
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ]
        : []),
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};

export default nextConfig;
