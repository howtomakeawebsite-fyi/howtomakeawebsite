import { cacheLife } from "next/cache";
import type { ReactNode } from "react";
import { site } from "@/config/site";

/*
 * Blocks for the Podcast page (content/pages/podcast.mdx):
 *   <PodcastPlayers />    the Spotify player and the Apple Podcasts player side by side
 *   <PodcastEpisodes />   the latest episodes, each with its own play button
 * The show details come from the church settings ("Podcast" in Pages CMS). Until a value is filled in,
 * a friendly note shows where the player will be.
 */

const p = site.podcast;
const appleId = p.appleUrl.match(/id(\d{5,})/)?.[1] ?? (/^\d{5,}$/.test(p.appleUrl) ? p.appleUrl : "");
/** Apple's player lives at embed.podcasts.apple.com, with the same path as the show's normal address. */
const appleEmbed = /^https:\/\/podcasts\.apple\.com\//.test(p.appleUrl) ? p.appleUrl.replace("https://podcasts.apple.com/", "https://embed.podcasts.apple.com/") : "";
const spotifyId = /^[A-Za-z0-9]{10,40}$/.test(p.spotifyShowId) ? p.spotifyShowId : "";

function NotSetUp({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[152px] flex-col justify-center rounded-3xl border-2 border-dashed border-accent bg-panel p-5" role="note">
      <p className="eyebrow">Not set up yet</p>
      <p className="mt-1 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

export function SpotifyPlayer() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-semibold">Listen on Spotify</h2>
      {spotifyId ? (
        <>
          <iframe title={`${p.name} on Spotify`} src={`https://open.spotify.com/embed/show/${spotifyId}`} width="100%" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="block rounded-3xl border-0" />
          <a href={`https://open.spotify.com/show/${spotifyId}`} target="_blank" rel="noopener" className="btn btn-primary mt-4">Open the podcast on Spotify</a>
        </>
      ) : (
        <NotSetUp title="Your Spotify player will show here">Open the church settings in Pages CMS, find <b>Podcast</b>, and fill in <b>Spotify show ID</b>.</NotSetUp>
      )}
    </div>
  );
}

export function ApplePodcastsPlayer() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-semibold">Listen on Apple Podcasts</h2>
      {appleEmbed ? (
        <>
          {/* Apple's player is 175 pixels tall and Spotify's 152: Apple's is shown slightly smaller so both are the same height. */}
          <div className="overflow-hidden rounded-3xl" style={{ height: 152 }}>
            <iframe title={`${p.name} on Apple Podcasts`} src={appleEmbed} width="100%" height="175" loading="lazy" allow="autoplay *; encrypted-media *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" className="border-0" style={{ width: "115.13%", transform: "scale(0.8686)", transformOrigin: "top left" }} />
          </div>
          <a href={p.appleUrl} target="_blank" rel="noopener" className="btn btn-primary mt-4">Open the podcast on Apple Podcasts</a>
        </>
      ) : (
        <NotSetUp title="Your Apple Podcasts player will show here">Open the church settings in Pages CMS, find <b>Podcast</b>, and fill in <b>Apple Podcasts address</b>.</NotSetUp>
      )}
    </div>
  );
}

/** Both players, side by side on a wide screen and one under the other on a phone. */
export function PodcastPlayers() {
  return (
    <div className="not-prose my-8 grid gap-8 md:grid-cols-2">
      <SpotifyPlayer />
      <ApplePodcastsPlayer />
    </div>
  );
}

type Episode = { title: string; date?: string; duration?: string; audio?: string };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : undefined;
}

function duration(d?: string) {
  if (!d) return undefined;
  let secs = 0;
  if (/^\d+$/.test(d)) secs = Number(d);
  else {
    const parts = d.split(":").map(Number);
    secs = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
  }
  if (!secs) return undefined;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

/** The RSS feed: the one in the settings, or the one Apple Podcasts lists for the show. */
async function feedUrl() {
  if (/^https?:\/\//.test(p.rssUrl)) return p.rssUrl;
  if (!appleId) return "";
  const look = await fetch(`https://itunes.apple.com/lookup?id=${appleId}`).then((r) => r.json());
  return (look?.results?.[0]?.feedUrl as string | undefined) ?? "";
}

/** Latest episodes, refreshed about once an hour. state "unset" = no feed or Apple address in the settings yet. */
async function getEpisodes(limit: number): Promise<{ episodes: Episode[]; state: "ok" | "unset" | "error" }> {
  "use cache";
  cacheLife("hours");
  if (!p.rssUrl && !appleId) return { episodes: [], state: "unset" };
  try {
    const feed = await feedUrl();
    if (!feed) return { episodes: [], state: "error" };
    const xml = await fetch(feed, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ChurchWebsite/1.0)" } }).then((r) => r.text());
    const episodes = xml
      .split(/<item[\s>]/)
      .slice(1, limit + 1)
      .map((item) => {
        const pub = tag(item, "pubDate");
        const d = pub ? new Date(pub) : null;
        return {
          title: tag(item, "title") ?? "Episode",
          date: d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
          duration: duration(tag(item, "itunes:duration")),
          audio: item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&"),
        };
      });
    return { episodes, state: episodes.length ? "ok" : "error" };
  } catch {
    return { episodes: [], state: "error" };
  }
}

/** The latest episodes (30 unless you say otherwise, for example <PodcastEpisodes count={10} />). */
export async function PodcastEpisodes({ count = 30 }: { count?: number }) {
  const { episodes, state } = await getEpisodes(count);
  if (state === "unset") {
    return (
      <div className="not-prose my-8">
        <NotSetUp title="Your latest episodes will show here">Fill in <b>Apple Podcasts address</b> or <b>RSS feed address</b> under <b>Podcast</b> in the church settings, and the newest episodes appear here by themselves.</NotSetUp>
      </div>
    );
  }
  if (state === "error") {
    return <p className="not-prose my-8 rounded-3xl border border-line bg-panel p-5 text-muted">We could not load the episode list just now. Please try again later, or listen on Spotify or Apple Podcasts.</p>;
  }
  return (
    <ol className="not-prose my-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-bg">
      {episodes.map((e, i) => (
        <li key={i} className="p-4 sm:p-5">
          <p className="font-semibold leading-snug">{e.title}</p>
          {(e.date || e.duration) && <p className="mt-1 text-sm text-muted">{[e.date, e.duration].filter(Boolean).join(" · ")}</p>}
          {e.audio && <audio controls preload="none" src={e.audio} className="mt-3 w-full" />}
        </li>
      ))}
    </ol>
  );
}
