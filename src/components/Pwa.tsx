"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/**
 * Installable app (PWA) support.
 * PwaSupport switches on the service worker (public/sw.js), which keeps key pages readable without internet.
 * InstallAppButton shows an "Install app" button on phones and computers that offer it (Android, Chrome, Edge).
 * On an iPhone, people use Share, then "Add to Home Screen" instead; no button is needed for that.
 */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let saved: InstallEvent | null = null;
const listeners = new Set<() => void>();

export function PwaSupport() {
  useEffect(() => {
    // Only on the live site: on your own computer a service worker would keep showing old pages.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); saved = e as InstallEvent; listeners.forEach((l) => l()); };
    const onInstalled = () => { saved = null; listeners.forEach((l) => l()); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  return null;
}

export function InstallAppButton({ className = "btn btn-ghost" }: { className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const update = () => setReady(Boolean(saved));
    update();
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);
  if (!ready) return null;
  return (
    <button type="button" className={className} onClick={async () => { const e = saved; if (!e) return; await e.prompt(); await e.userChoice.catch(() => null); saved = null; setReady(false); }}>
      <Icon name="smartphone" className="h-4 w-4" /> Install app
    </button>
  );
}
