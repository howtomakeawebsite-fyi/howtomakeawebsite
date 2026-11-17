import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Lato } from "next/font/google";
import { ViewTransition } from "react";
import "./globals.css";
import { site } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TabBar } from "@/components/TabBar";
import { RevealObserver } from "@/components/Motion";
import { PwaSupport } from "@/components/Pwa";
import { themeScript } from "@/components/ThemeToggle";
import { churchJsonLd, allowIndexing } from "@/lib/seo";

// Body text: Source Sans 3 (the font files are in src/fonts). Headings: Lato.
const body = localFont({
  src: [
    { path: "../fonts/source-sans-3.woff2", style: "normal", weight: "200 900" },
    { path: "../fonts/source-sans-3-italic.woff2", style: "italic", weight: "200 900" },
  ],
  preload: true,
  variable: "--font-body",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
const heading = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-heading",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "Religion",
  alternates: { canonical: "/" },
  robots: !allowIndexing ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: site.name, locale: site.locale, url: "/" },
  twitter: { card: "summary_large_image" },
  verification: {
    // Paste the codes from Google Search Console and Bing Webmaster Tools into your host's environment variables.
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
  appleWebApp: { capable: true, title: site.appName, statusBarStyle: "default" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} no-js`} suppressHydrationWarning data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd()).replace(/</g, "\\u003c") }} />
        <link rel="alternate" type="text/plain" title={`${site.name} summary for AI assistants`} href="/llms.txt" />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <ViewTransition name="page">
          <main id="main">{children}</main>
        </ViewTransition>
        <Footer />
        <TabBar />
        <RevealObserver />
        <PwaSupport />
      </body>
    </html>
  );
}
