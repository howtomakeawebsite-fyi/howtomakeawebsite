import type { Metadata } from "next";
import { site } from "@/config/site";

/**
 * Search engines may only list the real site. Test copies (a preview on Vercel, a .vercel.app address,
 * or the site running on your own computer) are hidden, so they never compete with the real site.
 */
export const allowIndexing = process.env.VERCEL_ENV !== "preview" && !/localhost|127\.0\.0\.1|\.vercel\.app/.test(site.url);

const abs = (path: string) => (path.startsWith("http") ? path : `${site.url}${path}`);
const pad = (n: number) => String(n).padStart(2, "0");
const startTime = `${pad(site.service.hour)}:${pad(site.service.minute)}`;
const endMinutes = site.service.hour * 60 + site.service.minute + site.service.durationMinutes;
const endTime = `${pad(Math.floor(endMinutes / 60) % 24)}:${pad(endMinutes % 60)}`;

/** IDs that link the structured data together (Google and AI assistants read this as one "knowledge graph"). */
export const ids = {
  church: `${site.url}/#church`,
  website: `${site.url}/#website`,
  place: `${site.url}/#venue`,
};

/** Site-wide structured data (JSON-LD): the church, where it meets, and the website with its search. */
export function churchJsonLd() {
  const address = {
    "@type": "PostalAddress",
    streetAddress: site.venue.street,
    addressLocality: site.venue.town,
    postalCode: site.venue.postcode,
    ...(site.venue.country ? { addressCountry: site.venue.country } : {}),
  };
  const day = `https://schema.org/${site.service.dayName}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Church", "Organization"],
        "@id": ids.church,
        name: site.name,
        url: `${site.url}/`,
        logo: { "@type": "ImageObject", url: abs("/icons/icon-512.png"), width: 512, height: 512 },
        image: abs("/opengraph-image.png"),
        description: site.description,
        email: site.email,
        telephone: site.phone,
        address,
        contactPoint: { "@type": "ContactPoint", contactType: "general enquiries", telephone: site.phone, email: site.email, url: abs("/contact/") },
        ...(site.mapsLink ? { hasMap: site.mapsLink } : {}),
        location: { "@id": ids.place },
        keywords: site.keywords.join(", "),
        sameAs: site.social.map((s) => s.href),
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: startTime, closes: endTime },
        event: {
          "@type": "Event",
          name: `${site.service.dayName} service at ${site.name}`,
          eventSchedule: { "@type": "Schedule", repeatFrequency: "P1W", byDay: day, startTime: `${startTime}:00`, endTime: `${endTime}:00`, scheduleTimezone: site.service.timeZone },
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@id": ids.place },
          organizer: { "@id": ids.church },
          isAccessibleForFree: true,
        },
        potentialAction: { "@type": "DonateAction", target: abs("/give/"), recipient: { "@id": ids.church } },
      },
      {
        "@type": ["Place", "EventVenue"],
        "@id": ids.place,
        name: site.venue.name,
        address,
        ...(site.mapsLink ? { hasMap: site.mapsLink } : {}),
      },
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: `${site.url}/`,
        name: site.name,
        inLanguage: "en",
        publisher: { "@id": ids.church },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${site.url}/search/?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function webPageJsonLd({ title, description, path, type = "WebPage" }: { title: string; description: string; path: string; type?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${abs(path)}#webpage`,
    url: abs(path),
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": ids.website },
    about: { "@id": ids.church },
  };
}

/** Title, description and social preview for one page. */
export function pageMetadata({ title, description, path, keywords }: { title: string; description?: string; path: string; keywords?: string[] }): Metadata {
  const desc = description ?? site.description;
  const image = abs("/opengraph-image.png");
  return {
    title,
    description: desc,
    keywords: [...(keywords ?? []), ...site.keywords],
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: path, type: "website", siteName: site.name, locale: site.locale, images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [image] },
  };
}
