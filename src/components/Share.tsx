"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { site } from "@/config/site";

/**
 * "Share this page": uses the phone's own share menu when there is one, otherwise offers links.
 * The hashtags come from "Share hashtags" in the church settings.
 */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = () => (typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path);
  const tags = site.hashtags.map((h) => `#${h}`).join(" ");

  const onShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: [title, tags].filter(Boolean).join(" "), url: url() }); } catch {}
      return;
    }
    setOpen((o) => !o);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const enc = (s: string) => encodeURIComponent(s);

  return (
    <div className="relative inline-block">
      <button type="button" onClick={onShare} className="btn btn-ghost !min-h-9 !px-4 text-sm" aria-expanded={open}>
        <Icon name="share" className="h-4 w-4" /> Share this page
      </button>
      {open && (
        <ul className="absolute bottom-full left-0 z-40 mb-2 w-56 rounded-2xl border border-line bg-bg p-2 shadow-soft">
          <li><a className="block rounded-xl px-3 py-2 hover:bg-panel" target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url())}${site.hashtags[0] ? `&hashtag=${enc(`#${site.hashtags[0]}`)}` : ""}`}>Facebook</a></li>
          <li><a className="block rounded-xl px-3 py-2 hover:bg-panel" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url())}${site.hashtags.length ? `&hashtags=${enc(site.hashtags.slice(0, 3).join(","))}` : ""}`}>X</a></li>
          <li><a className="block rounded-xl px-3 py-2 hover:bg-panel" target="_blank" rel="noopener" href={`https://wa.me/?text=${enc([title, url(), tags].filter(Boolean).join(" "))}`}>WhatsApp</a></li>
          <li><a className="block rounded-xl px-3 py-2 hover:bg-panel" href={`mailto:?subject=${enc(title)}&body=${enc(url())}`}>Email</a></li>
          <li><button type="button" onClick={copy} className="w-full rounded-xl px-3 py-2 text-left hover:bg-panel">{copied ? "Link copied" : "Copy link"}</button></li>
        </ul>
      )}
    </div>
  );
}
