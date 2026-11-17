"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type Fuse from "fuse.js";
import { Icon } from "./Icon";

type Doc = { title: string; url: string; type: string; text: string };

/** Full-page search (used by Google's sitelinks search box and when JavaScript search isn't available). */
export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [fuse, setFuse] = useState<Fuse<Doc> | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([import("fuse.js"), fetch("/search-index.json").then((r) => r.json() as Promise<Doc[]>)]).then(([{ default: F }, docs]) => {
      if (live) setFuse(new F(docs, { keys: [{ name: "title", weight: 3 }, { name: "text", weight: 1 }], threshold: 0.3, ignoreLocation: true }));
    });
    return () => { live = false; };
  }, []);

  const results = fuse && q.trim().length >= 2 ? fuse.search(q.trim(), { limit: 25 }).map((r) => r.item) : [];

  return (
    <div>
      <form action="/search/" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("q"); router.replace(`/search/?q=${encodeURIComponent(String(v ?? ""))}`); }} className="relative" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input id="q" name="q" defaultValue={q} key={q} placeholder="Search pages and sermons" className="h-14 w-full rounded-full border border-line bg-bg pl-12 pr-4 text-lg outline-none focus:border-accent" />
      </form>
      {q && (
        <p className="mt-6 text-sm text-muted" aria-live="polite">{fuse ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Searching..."}</p>
      )}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.url}>
            {r.url.startsWith("http") ? (
              <a href={r.url} target="_blank" rel="noopener" className="card block p-5"><span className="text-xs font-semibold uppercase tracking-wider text-muted">{r.type}</span><span className="mt-1 block font-display text-xl font-semibold">{r.title}</span></a>
            ) : (
              <Link href={r.url} className="card block p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{r.type}</span>
                <span className="mt-1 block font-display text-xl font-semibold">{r.title}</span>
                <span className="mt-1 line-clamp-2 block text-muted">{r.text.slice(0, 200)}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
