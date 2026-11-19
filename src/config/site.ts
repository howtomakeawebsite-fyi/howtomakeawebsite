/**
 * Website settings, all in one place.
 *
 * The details a church changes (name, address, phone, email, service time, giving details, social links,
 * YouTube channel ID, calendar link) live in content/settings.json, so they can be edited in the browser
 * with Pages CMS. This file reads them and adds the menu. Change a detail once and it updates everywhere.
 *
 * COLOURS: change the brand colours at the top of src/app/globals.css (the lines that start with --brand-).
 * After changing colours, run "npm run check" to make sure text is still easy to read.
 */
import settings from "../../content/settings.json";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const a = settings.address;
/** "123 Sample Street, Sample Town 0000" */
const addressLine = [a.street, [a.town, a.postcode].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
/** The words Google Maps searches for. Empty means "no map yet" (a friendly note is shown instead). */
const mapSearch = (a.mapSearch ?? "").trim();
const dayIndex = Math.max(0, DAYS.indexOf(settings.service.day));

export const site = {
  name: settings.name,
  shortName: settings.shortName || settings.name,
  /** Name under the icon when people save the site to their phone. */
  appName: settings.shortName || settings.name,
  tagline: settings.tagline,
  description: settings.description,
  /** The site's own address, used for search engines and social previews. NEXT_PUBLIC_SITE_URL wins if set. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || settings.url || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en",

  email: settings.email,
  phone: settings.phone,
  phoneHref: `tel:${settings.phone.replace(/[^\d+]/g, "")}`,

  venue: {
    name: a.venueName,
    street: a.street,
    town: a.town,
    postcode: a.postcode,
    country: a.country,
  },
  addressLine,
  /** Map on the Plan Your Visit page. Both are empty until "mapSearch" is filled in. */
  mapEmbed: mapSearch ? `https://maps.google.com/maps?q=${encodeURIComponent(mapSearch)}&t=m&z=15&output=embed&iwloc=near` : "",
  mapsLink: mapSearch ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearch)}` : "",

  service: {
    label: settings.service.label,
    /** 0 = Sunday ... 6 = Saturday */
    day: dayIndex,
    dayName: DAYS[dayIndex],
    hour: Number(settings.service.hour) || 0,
    minute: Number(settings.service.minute) || 0,
    durationMinutes: Number(settings.service.durationMinutes) || 60,
    /** Your time zone, for example "Pacific/Auckland", "Europe/London" or "America/Chicago". */
    timeZone: settings.service.timeZone || "UTC",
  },

  giving: settings.giving,

  youtube: {
    /** Starts with UC. NEXT_PUBLIC_YOUTUBE_CHANNEL_ID wins if set. Empty means the Sermons page shows a sample. */
    channelId: (process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || settings.youtube.channelId || "").trim(),
    url: (settings.youtube.channelUrl ?? "").trim(),
  },

  calendar: { icsUrl: (settings.calendar.icsUrl ?? "").trim() },

  /** The Podcast page (content/pages/podcast.mdx). Each empty value shows a friendly note instead of a player. */
  podcast: {
    name: (settings.podcast?.name ?? "").trim() || `${settings.name} podcast`,
    /** The code after /show/ in the show's open.spotify.com address (a full address works too). */
    spotifyShowId: (settings.podcast?.spotifyShowId ?? "").trim().replace(/^.*\/show\//, "").replace(/[?#].*$/, ""),
    /** The show's address on podcasts.apple.com (it ends in id and a number). */
    appleUrl: (settings.podcast?.applePodcastsUrl ?? "").trim(),
    /** Optional: the RSS feed from your podcast host. Empty means it is found from the Apple Podcasts address. */
    rssUrl: (settings.podcast?.rssFeedUrl ?? "").trim(),
  },

  social: settings.social.filter((s) => s.name && s.href),

  /** Hashtags added when people share a page (without the # sign). */
  hashtags: (settings.shareHashtags ?? []).map((h: string) => h.replace(/^#/, "").replace(/\s+/g, "")).filter(Boolean),

  /** Search phrases people might use to find your church. Used in page metadata and llms.txt. */
  keywords: [settings.name, `church in ${a.town}`, "Sunday service", "Christian church"],
};

export type NavItem = { label: string; href: string };

/** Main menu (top of every page). Add, remove or reorder lines here. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  { label: "Plan Your Visit", href: "/plan-your-visit/" },
  { label: "Sermons", href: "/sermons/" },
  { label: "Events", href: "/events/" },
  { label: "Give", href: "/give/" },
  { label: "Prayer", href: "/prayer/" },
  { label: "Contact", href: "/contact/" },
];

/** Bottom bar on phones (five items fit best). */
export const tabNav = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Visit", href: "/plan-your-visit/", icon: "map" },
  { label: "Sermons", href: "/sermons/", icon: "play" },
  { label: "Events", href: "/events/", icon: "calendar" },
  { label: "Give", href: "/give/", icon: "gift" },
] as const;

/** Small links at the bottom of every page. */
export const footerLinks: NavItem[] = [
  { label: "About", href: "/about/" },
  { label: "Plan Your Visit", href: "/plan-your-visit/" },
  { label: "Sermons", href: "/sermons/" },
  { label: "Events", href: "/events/" },
  { label: "Give", href: "/give/" },
  { label: "Prayer", href: "/prayer/" },
  { label: "Contact", href: "/contact/" },
  { label: "FAQ", href: "/faq/" },
  { label: "Podcast", href: "/podcast/" },
  { label: "Get our app", href: "/get-our-app/" },
  { label: "Privacy Policy", href: "/privacy-policy/" },
];
