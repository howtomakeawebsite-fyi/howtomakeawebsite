import { cacheLife } from "next/cache";
import { site } from "@/config/site";

export type Video = {
  id: string;
  title: string;
  published: string;
  publishedLabel?: string;
  description: string;
  thumbnail: string;
};

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

type RawVideo = Omit<Video, "thumbnail">;

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
      .filter((v) => v.id && !seen.has(v.id) && seen.add(v.id))
      .map((v): Video => ({ ...v, title: decode(v.title), thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` }));
    return { videos, state: videos.length ? "ok" : "error" };
  } catch {
    return { videos: [], state: "error" };
  }
}

/** Where the "Visit our YouTube channel" buttons go. */
export const channelUrl = site.youtube.url || (site.youtube.channelId ? `https://www.youtube.com/channel/${site.youtube.channelId}` : "");
