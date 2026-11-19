import { cacheLife } from "next/cache";
import { site } from "@/config/site";
import extras from "../../content/sermons.json";

export type Video = {
  id: string;
  title: string;
  published: string;
  publishedLabel?: string;
  description: string;
  thumbnail: string;
  /** Read from the title ("Series name - Part 3 - ..."), or set in content/sermons.json. */
  series?: string;
  /** Read from the end of the title ("... by Speaker Name"), or set in content/sermons.json. */
  speaker?: string;
  topics: string[];
  /** Link to the sermon notes (a PDF or a page), from content/sermons.json. */
  notes?: string;
};

/**
 * Sermon extras (content/sermons.json, "Sermon extras" in Pages CMS): optional details for one video,
 * listed by its YouTube video ID (the code after watch?v=). Use it when a title does not follow the pattern,
 * to add topics or a sermon-notes button, or to hide a video.
 */
type Extra = { id?: string; series?: string; speaker?: string; topics?: string[]; notes?: string; hide?: boolean };
const extraFor = new Map<string, Extra>(
  ((extras as { videos?: Extra[] }).videos ?? []).filter((x) => x.id?.trim()).map((x) => [x.id!.trim(), x]),
);
const filled = (s?: string) => (s && s.trim() ? s.trim() : undefined);

/** Only titles written in CAPITAL LETTERS are changed to normal capitals. */
const tidy = (s: string) =>
  s === s.toUpperCase()
    ? s.toLowerCase().replace(/([a-z])/g, (c) => c.toUpperCase()).replace(/(Of|The|And|In|On|To|A|An|For)/g, (w, _m, i) => (i === 0 ? w : w.toLowerCase()))
    : s;

/**
 * Reads the series and the speaker from a title written in the pattern
 *   Series name - Part 3 - Sermon title (Bible passage) by Speaker Name
 * "Part" may also be "Study", "Session", "Episode" or "Week". The speaker is two to four words after the last "by".
 */
export function fromTitle(title: string): { series?: string; speaker?: string } {
  const speaker = title.match(/^.*by\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3})\s*$/i)?.[1]?.trim();
  const series = title.match(/^(.+?)\s*[-:|\u2013]\s*(?:study|part|session|episode|week)\s*\d+/i)?.[1]?.trim();
  return { series: series ? tidy(series) : undefined, speaker: speaker ? tidy(speaker) : undefined };
}

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

type RawVideo = Pick<Video, "id" | "title" | "published" | "publishedLabel" | "description">;

const UA = { "Accept-Language": "en", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36", Cookie: "CONSENT=YES+1" };

/** "4 days ago" becomes an approximate date (YouTube's page only gives relative ages). */
function fromRelative(label: string, now: number) {
  const m = label.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return new Date(now).toISOString();
  const n = Number(m[1]);
  const unit = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2629746e3, year: 31556952e3 }[m[2].toLowerCase() as "day"];
  return new Date(now - n * unit).toISOString();
}

/** Reads the channel's public Videos page (no API key needed). */
async function fromChannelPage(channelId: string): Promise<RawVideo[]> {
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/videos`, { headers: UA });
  if (!res.ok) return [];
  const html = await res.text();
  const json = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/)?.[1];
  if (!json) return [];
  const data = JSON.parse(json);
  const out: RawVideo[] = [];
  const now = Date.now();
  const walk = (o: unknown): void => {
    if (!o || typeof o !== "object") return;
    const rec = o as Record<string, unknown>;
    const lockup = rec.lockupViewModel as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (lockup && lockup.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
      const meta = lockup.metadata?.lockupMetadataViewModel;
      const parts: { text?: { content?: string }; accessibilityLabel?: string }[] = meta?.metadata?.contentMetadataViewModel?.metadataRows?.flatMap((r: { metadataParts?: unknown[] }) => r.metadataParts ?? []) ?? [];
      const age = parts.find((p) => /ago/i.test(p.accessibilityLabel ?? p.text?.content ?? ""));
      const label = age?.accessibilityLabel ?? age?.text?.content ?? "";
      out.push({ id: lockup.contentId, title: meta?.title?.content ?? "", published: fromRelative(label, now), publishedLabel: label, description: "" });
      return;
    }
    const vr = rec.videoRenderer as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (vr?.videoId) {
      const label = vr.publishedTimeText?.simpleText ?? "";
      out.push({ id: vr.videoId, title: vr.title?.runs?.[0]?.text ?? "", published: fromRelative(label, now), publishedLabel: label, description: (vr.descriptionSnippet?.runs ?? []).map((r: { text: string }) => r.text).join("") });
      return;
    }
    for (const v of Object.values(rec)) walk(v);
  };
  walk(data);
  return out;
}

/** Optional: with a free YouTube Data API key (YOUTUBE_API_KEY) you get exact dates and full descriptions. */
async function fromApi(channelId: string, key: string): Promise<RawVideo[]> {
  const uploads = "UU" + channelId.slice(2);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploads}&key=${key}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: { snippet: { title: string; description: string; publishedAt: string; resourceId: { videoId: string } } }[] };
  return (data.items ?? []).map((it) => ({ id: it.snippet.resourceId.videoId, title: it.snippet.title, published: it.snippet.publishedAt, description: it.snippet.description }));
}

/**
 * Latest videos from the church's YouTube channel. Refreshed about once an hour.
 * state: "unset" = no channel ID in the settings yet, "error" = YouTube could not be read just now, "ok" = videos found.
 */
export async function getVideos(): Promise<{ videos: Video[]; state: "ok" | "unset" | "error" }> {
  "use cache";
  cacheLife("hours");
  const channelId = site.youtube.channelId;
  if (!/^UC[\w-]{22}$/.test(channelId)) return { videos: [], state: "unset" };
  try {
    const key = process.env.YOUTUBE_API_KEY;
    let raw = key ? await fromApi(channelId, key) : [];
    if (!raw.length) raw = await fromChannelPage(channelId);
    const seen = new Set<string>();
    const videos = raw
      .filter((v) => v.id && !seen.has(v.id) && seen.add(v.id) && !extraFor.get(v.id)?.hide)
      .map((v): Video => {
        const title = decode(v.title);
        const auto = fromTitle(title);
        const x = extraFor.get(v.id) ?? {};
        return {
          ...v,
          title,
          thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          series: filled(x.series) ?? auto.series,
          speaker: filled(x.speaker) ?? auto.speaker,
          topics: (x.topics ?? []).map((t) => t.trim()).filter(Boolean),
          notes: filled(x.notes),
        };
      });
    return { videos, state: videos.length ? "ok" : "error" };
  } catch {
    return { videos: [], state: "error" };
  }
}

/** Where the "Visit our YouTube channel" buttons go. */
export const channelUrl = site.youtube.url || (site.youtube.channelId ? `https://www.youtube.com/channel/${site.youtube.channelId}` : "");

/**
 * Is the channel live right now? Checked about once a minute, from the channel's public "live" page (no key needed).
 * Without a channel ID in the settings it always answers "not live", so the "Live now" banner never shows.
 */
export async function getLiveStatus(): Promise<{ live: boolean; videoId: string | null; title: string | null }> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  const off = { live: false, videoId: null, title: null };
  const channelId = site.youtube.channelId;
  if (!/^UC[\w-]{22}$/.test(channelId)) return off;
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, { headers: UA });
    if (!res.ok) return off;
    const html = await res.text();
    const live = /"isLiveNow":true/.test(html) || (/"isLive":true/.test(html) && !/"isUpcoming":true/.test(html));
    if (!live) return off;
    const videoId = html.match(/"videoId":"([\w-]{11})"/)?.[1] ?? null;
    const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1] ?? null;
    return { live: true, videoId, title: title ? decode(title) : null };
  } catch {
    return off;
  }
}
