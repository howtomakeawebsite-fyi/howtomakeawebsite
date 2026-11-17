"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile: the free, privacy-friendly "Verify you are human" box.
 * Most people only tick a box (often it passes by itself); bots cannot. The answer (a token) is checked on our
 * server with the secret key, so it cannot be faked in the browser.
 * Switched on by NEXT_PUBLIC_TURNSTILE_SITE_KEY. Without it, nothing is shown and the forms work as before.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileApi = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id?: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

let loading: Promise<void> | null = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error("Turnstile did not load")); };
    document.head.appendChild(s);
  });
  return loading;
}

export function Turnstile({ onToken, onExpire, action }: { onToken: (token: string) => void; onExpire?: () => void; action?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef({ onToken, onExpire });
  useEffect(() => { cb.current = { onToken, onExpire }; });
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return;
    let id = "";
    let gone = false;
    loadScript().then(() => {
      if (gone || !box.current || !window.turnstile) return;
      id = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action: action ?? "form",
        theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
        language: "auto",
        callback: (t: string) => cb.current.onToken(t),
        "expired-callback": () => cb.current.onExpire?.(),
        "error-callback": () => cb.current.onExpire?.(),
      });
    }).catch(() => {});
    return () => { gone = true; if (id && window.turnstile) window.turnstile.remove(id); };
  }, [action]);
  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" />;
}
