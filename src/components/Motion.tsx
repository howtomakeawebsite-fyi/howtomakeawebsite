"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fades and lifts any element with a data-reveal attribute as it scrolls into view.
 * Turned off automatically for visitors who prefer reduced motion (see globals.css).
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const pending = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const showAll = () => pending().forEach((el) => el.classList.add("is-visible"));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const watched = new WeakSet<Element>();
    const watch = () => pending().forEach((el) => { if (!watched.has(el)) { watched.add(el); io.observe(el); } });
    watch();
    // Parts of a page that arrive after it opens (for example the events list, which is fetched from
    // Google Calendar) would otherwise stay invisible until a refresh. Watch for them too.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, [pathname]);
  return null;
}
