"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { notificationsReady } from "./PushNotifications";

/**
 * Home page: an easy-to-see invitation to turn on notifications.
 * Shows only once notifications are set up (the keys are in Vercel), and hides itself on a device that already has them on.
 */
export function NotifyStrip() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!notificationsReady) return;
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator)) return setShow(true); // for example an iPhone outside the Home Screen app: the page explains the steps
      const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager?.getSubscription();
      if (!cancelled) setShow(!sub);
    })().catch(() => { if (!cancelled) setShow(true); });
    return () => { cancelled = true; };
  }, []);
  if (!show) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" aria-label="Notifications">
      <div className="flex flex-col gap-4 rounded-3xl bg-deep-oak p-6 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><Icon name="bell" className="h-7 w-7" /></span>
          <div>
            <p className="font-display text-2xl font-semibold">Never miss a thing</p>
            <p className="text-[#f1e6d2]">Get the Thought for the Day and church announcements on your phone. You choose which.</p>
          </div>
        </div>
        <Link href="/notifications/" className="btn btn-light shrink-0 !px-6"><Icon name="bell" className="h-4 w-4" /> Turn on notifications</Link>
      </div>
    </section>
  );
}
