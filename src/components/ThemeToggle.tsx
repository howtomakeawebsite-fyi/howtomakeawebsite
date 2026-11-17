"use client";

import { useThemeAttr } from "@/lib/hooks";
import { Icon } from "./Icon";

/** Inline script for <head>: applies the saved theme before first paint (no flash). */
export const themeScript = `(function(){try{var t=localStorage.getItem('site-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}document.documentElement.classList.remove('no-js')})();`;

export function ThemeToggle() {
  const theme = useThemeAttr();

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("site-theme", next); } catch {}
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", next === "dark" ? "#1d150d" : "#faf6ee");
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-panel">
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
