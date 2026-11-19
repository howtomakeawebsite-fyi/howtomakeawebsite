"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Icon } from "./Icon";

/*
 * Live streams and the countdown to the next service.
 *   LiveBanner          a thin red banner at the top of every page while the YouTube channel is live
 *   LiveOrCountdown     on the Sermons page: the live stream while it is live, otherwise a countdown to the next service
 * Live checks need only the YouTube channel ID in the church settings. Without it nothing live is ever shown.
 * The countdown uses the service day, time and time zone from the church settings.
 */

type LiveState = { live: boolean; videoId?: string | null };
const hasChannel = /^UC[\w-]{22}$/.test(site.youtube.channelId);

function useLive(poll = false) {
  const [state, setState] = useState<LiveState>({ live: false });
  useEffect(() => {
    if (!hasChannel) return;
    let stop = false;
    const check = () =>
      fetch("/api/live/", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { live: false }))
        .then((s: LiveState) => { if (!stop) setState(s); })
        .catch(() => {});
    check();
    const id = poll ? setInterval(check, 120_000) : undefined;
    return () => { stop = true; if (id) clearInterval(id); };
  }, [poll]);
  return state;
}

export function LiveBanner() {
  const { live } = useLive(false);
  if (!live) return null;
  return (
    <Link href="/sermons/" className="flex items-center justify-center gap-2 bg-live px-4 py-2 text-sm font-semibold text-white">
      <span className="pulse-dot h-2 w-2 rounded-full bg-white" aria-hidden="true" /> Live now: join our service online <Icon name="arrow" className="h-4 w-4" />
    </Link>
  );
}

/** The start of the next service, worked out in the church's own time zone. */
export function nextServiceStart(now = new Date()) {
  const { day, hour, minute, timeZone, durationMinutes } = site.service;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const nowMinutes = Number(get("hour")) * 60 + Number(get("minute"));
  let addDays = (day - wd + 7) % 7;
  if (addDays === 0 && nowMinutes >= hour * 60 + minute + durationMinutes) addDays = 7;
  // The difference between the church's clock and world time.
  const localAsUtc = Date.UTC(+get("year"), +get("month") - 1, +get("day"), +get("hour"), +get("minute"), +get("second"));
  const offset = localAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  const targetAsUtc = Date.UTC(+get("year"), +get("month") - 1, +get("day") + addDays, hour, minute, 0);
  return new Date(targetAsUtc - offset);
}

export function LiveOrCountdown() {
  const { live, videoId } = useLive(true);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

  if (live) {
    const src = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : `https://www.youtube-nocookie.com/embed/live_stream?channel=${site.youtube.channelId}`;
    return (
      <div className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-live px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"><span className="pulse-dot h-2 w-2 rounded-full bg-white" /> Live now</p>
        <div className="aspect-video overflow-hidden rounded-3xl bg-black shadow-soft">
          <iframe src={src} title={`${site.name} live stream`} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      </div>
    );
  }

  const start = now ? nextServiceStart(now) : null;
  const diff = start && now ? Math.max(0, start.getTime() - now.getTime()) : 0;
  const inService = Boolean(start && now && diff === 0);
  const d = Math.floor(diff / 86_400_000), h = Math.floor((diff / 3_600_000) % 24), m = Math.floor((diff / 60_000) % 60), s = Math.floor((diff / 1000) % 60);
  const units = [["days", d], ["hours", h], ["mins", m], ["secs", s]] as const;
  return (
    <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8">
      <p className="eyebrow">Next {site.service.dayName} service</p>
      <p className="mt-1 font-display text-2xl sm:text-3xl" suppressHydrationWarning>
        {start ? start.toLocaleString("en-GB", { timeZone: site.service.timeZone, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }) : site.service.label}
      </p>
      <div className="mt-6 grid max-w-md grid-cols-4 gap-2" aria-live="off" aria-label="Countdown to the next service">
        {units.map(([label, v]) => (
          <div key={label} className="rounded-2xl bg-bg px-2 py-3 text-center">
            <span className="block font-display text-3xl tabular-nums sm:text-4xl" suppressHydrationWarning>{now ? String(v).padStart(2, "0") : "--"}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted">
        {hasChannel && (inService ? "The service should be starting now. If the stream has not appeared, check our YouTube channel. " : "When we go live on YouTube, the stream appears here by itself. ")}
        Join us in person: {site.service.label}.{" "}
        <Link href="/plan-your-visit/" className="font-semibold text-accent underline underline-offset-4">Plan your visit</Link>
      </p>
    </div>
  );
}
