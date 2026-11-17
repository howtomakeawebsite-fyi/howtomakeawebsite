"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOpenUntilNavigate } from "@/lib/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import type Fuse from "fuse.js";
import { Icon } from "./Icon";

type Doc = { title: string; url: string; type: "Page" | "Blog" | "Video" | "FAQ"; text: string };

const TYPE_LABEL: Record<Doc["type"], string> = { Page: "Page", Blog: "Blog post", Video: "Video", FAQ: "Question" };

let fusePromise: Promise<Fuse<Doc>> | null = null;
function loadIndex() {
  fusePromise ??= Promise.all([import("fuse.js"), fetch("/search-index.json").then((r) => r.json() as Promise<Doc[]>)]).then(
    ([{ default: FuseCtor }, docs]) =>
      new FuseCtor(docs, { keys: [{ name: "title", weight: 3 }, { name: "text", weight: 1 }], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 }),
  );
  return fusePromise;
}

export function SearchButton() {
  const [open, setOpen] = useOpenUntilNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Doc[]>([]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
  useEffect(() => {
    if (open) { loadIndex(); setTimeout(() => input.current?.focus(), 30); document.body.style.overflow = "hidden"; }
    else document.body.style.overflow = "";
  }, [open]);

  const run = useCallback(async (value: string) => {
    setQ(value);
    setActive(0);
    if (value.trim().length < 2) { setResults([]); return; }
    const fuse = await loadIndex();
    setResults(fuse.search(value.trim(), { limit: 12 }).map((r) => r.item));
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) {
      const r = results[active];
      if (r.url.startsWith("http")) window.open(r.url, "_blank", "noopener"); else router.push(r.url);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search the site" title="Search (Ctrl K)" className="group flex h-10 items-center gap-2 rounded-full px-2.5 transition-colors hover:bg-panel md:border md:border-line md:pr-3">
        <Icon name="search" />
        <span className="hidden text-sm text-muted md:inline lg:hidden 2xl:inline">Search</span>
        <kbd className="hidden rounded-md border border-line px-1.5 text-xs text-muted 2xl:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-3 pt-[8vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search" className="rise w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-bg shadow-soft">
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Icon name="search" className="h-5 w-5 text-muted" />
              <label htmlFor="site-search" className="sr-only">Search sermons, videos, blog posts and pages</label>
              <input
                ref={input}
                id="site-search"
                value={q}
                onChange={(e) => run(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search pages and sermons"
                autoComplete="off"
                className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `sr-${active}` : undefined}
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-panel" aria-label="Close search"><Icon name="close" /></button>
            </div>
            <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {q.trim().length >= 2 && results.length === 0 && <li className="px-4 py-6 text-center text-muted">No results for &ldquo;{q}&rdquo;</li>}
              {q.trim().length < 2 && <li className="px-4 py-6 text-center text-sm text-muted">Try &ldquo;baptism&rdquo;, &ldquo;home groups&rdquo; or &ldquo;Sunday&rdquo;</li>}
              {results.map((r, i) => {
                const external = r.url.startsWith("http");
                const cls = `flex items-start gap-3 rounded-2xl px-4 py-3 ${i === active ? "bg-panel" : "hover:bg-panel"}`;
                const body = (
                  <>
                    <span className="mt-0.5 rounded-full bg-panel-strong px-2 py-0.5 text-xs font-semibold text-ink">{TYPE_LABEL[r.type]}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="line-clamp-1 block text-sm text-muted">{r.text.slice(0, 140)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={r.url + r.title} id={`sr-${i}`} role="option" aria-selected={i === active}>
                    {external ? <a href={r.url} target="_blank" rel="noopener" className={cls}>{body}</a> : <Link href={r.url} className={cls}>{body}</Link>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
