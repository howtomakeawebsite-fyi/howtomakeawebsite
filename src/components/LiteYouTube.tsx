"use client";

import { useState } from "react";

/** Loads the YouTube player (privacy-enhanced youtube-nocookie.com) only when the visitor presses play. */
export function LiteYouTube({ id, title, thumb }: { id: string; title: string; thumb?: string }) {
  const [play, setPlay] = useState(false);
  if (play) {
    return (
      <div className="aspect-video overflow-hidden rounded-3xl bg-black shadow-soft">
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setPlay(true)} className="group relative block aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-soft" aria-label={`Play: ${title}`}>
      {/* Sharp thumbnail; falls back to the smaller one if a video has no high-resolution version. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb ?? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} onError={(e) => { const img = e.currentTarget; if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; }} onLoad={(e) => { const img = e.currentTarget; if (img.naturalWidth <= 120 && !img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; }} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-cream/95 text-deep-oak shadow-soft transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
        </span>
      </span>
    </button>
  );
}
