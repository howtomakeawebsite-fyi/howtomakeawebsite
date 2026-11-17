"use client";

import { useMemo, useState } from "react";
import type { Video } from "@/lib/youtube";
import { LiteYouTube } from "./LiteYouTube";
import { Icon } from "./Icon";

function date(iso: string, label?: string) {
  if (label) return label;
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

/** Sermon video library: a big player for the chosen video, a search box, and a grid of all videos. */
export function VideoLibrary({ videos }: { videos: Video[] }) {
  const [current, setCurrent] = useState<Video>(videos[0]);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? videos.filter((v) => words.every((w) => `${v.title} ${v.description}`.toLowerCase().includes(w))) : videos;
  }, [q, videos]);

  const play = (v: Video) => {
    setCurrent(v);
    document.getElementById("player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div id="player" className="scroll-mt-24">
        <LiteYouTube key={current.id} id={current.id} title={current.title} />
        <h2 className="mt-4 font-display text-2xl font-semibold">{current.title}</h2>
        <p className="text-sm text-muted">{date(current.published, current.publishedLabel)}</p>
      </div>

      <div className="relative mt-10" role="search">
        <label htmlFor="video-search" className="sr-only">Search sermons</label>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input id="video-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sermons" className="h-12 w-full rounded-full border border-line bg-bg pl-12 pr-4 outline-none focus:border-accent" />
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">{shown.length} video{shown.length === 1 ? "" : "s"}</p>

      <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((v) => (
          <li key={v.id}>
            <button type="button" onClick={() => play(v)} className="group block w-full min-w-0 text-left" aria-label={`Play: ${v.title}`}>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-panel-strong">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-cream text-deep-oak"><Icon name="play" className="ml-0.5 h-5 w-5" /></span>
                </span>
              </div>
              <p className="mt-2 line-clamp-2 font-semibold leading-snug">{v.title}</p>
              <p className="text-sm text-muted">{date(v.published, v.publishedLabel)}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
