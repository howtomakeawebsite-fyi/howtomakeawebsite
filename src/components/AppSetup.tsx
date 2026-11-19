"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { site } from "@/config/site";
import { Icon } from "./Icon";
import { InstallAppButton, useInstalled } from "./Pwa";
import { NotificationsButton } from "./PushNotifications";

/*
 * The three steps on the Get our app page (block: <AppSetupSteps />):
 *   1. Save the website to your phone   2. Open it from your home screen   3. Turn on notifications
 * Each step has a small drawing of a phone. On iPhone, notifications only work once the app is opened
 * from the Home Screen, hence this order. The app icon is public/icons/icon-192.png.
 */

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}
const noSubscribe = () => () => {};
function usePlatform() {
  return useSyncExternalStore(noSubscribe, detectPlatform, () => "unknown" as Platform);
}

/* ---------- Drawings ---------- */

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto h-44 w-[6.5rem] rounded-[1.6rem] border-[3px] border-ink/80 bg-bg p-1.5 shadow-soft" aria-hidden="true">
      <div className="absolute left-1/2 top-1.5 h-1.5 w-8 -translate-x-1/2 rounded-full bg-ink/70" />
      <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-panel">{children}</div>
    </div>
  );
}

function AppTile({ className = "h-9 w-9" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icons/icon-192.png" alt="" width={48} height={48} className={`${className} rounded-[0.6rem] shadow-soft`} />;
}

function SaveDrawing() {
  return (
    <Phone>
      <div className="flex h-full flex-col">
        <div className="grid flex-1 place-items-center pt-3">
          <AppTile className="h-11 w-11" />
        </div>
        <div className="space-y-1.5 rounded-t-xl border-t border-line bg-bg px-2 pb-2.5 pt-2">
          <div className="h-1.5 w-3/4 rounded-full bg-panel-strong" />
          <div className="flex items-center gap-1.5 rounded-lg bg-accent px-1.5 py-1 text-on-accent">
            <span className="grid h-4 w-4 place-items-center rounded-[0.3rem] border border-current text-[0.6rem] font-bold leading-none">+</span>
            <span className="h-1.5 flex-1 rounded-full bg-current opacity-70" />
          </div>
          <div className="h-1.5 w-1/2 rounded-full bg-panel-strong" />
        </div>
      </div>
    </Phone>
  );
}

function OpenDrawing() {
  return (
    <Phone>
      <div className="grid h-full grid-cols-3 content-center gap-2 px-2.5">
        {Array.from({ length: 9 }, (_, i) =>
          i === 4 ? (
            <span key={i} className="relative grid place-items-center">
              <span className="absolute inset-0 rounded-[0.6rem] ring-2 ring-accent motion-safe:animate-pulse" />
              <AppTile className="h-full w-full" />
            </span>
          ) : (
            <span key={i} className="aspect-square rounded-[0.6rem] bg-panel-strong" />
          ),
        )}
      </div>
    </Phone>
  );
}

function NotifyDrawing() {
  return (
    <Phone>
      <div className="flex h-full flex-col px-1.5 pt-5">
        <div className="flex items-start gap-1.5 rounded-xl bg-bg p-1.5 shadow-soft">
          <AppTile className="h-6 w-6 shrink-0 !rounded-md" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 w-4/5 rounded-full bg-ink/70" />
            <div className="h-1.5 w-full rounded-full bg-panel-strong" />
          </div>
        </div>
        <div className="grid flex-1 place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent">
            <Icon name="bell" className="h-6 w-6" />
          </span>
        </div>
      </div>
    </Phone>
  );
}

/* ---------- Steps ---------- */

function Step({ n, title, drawing, children, done }: { n: number; title: string; drawing: ReactNode; children: ReactNode; done?: boolean }) {
  return (
    <li className="card flex flex-col p-5 sm:p-6">
      <div className="mb-5 rounded-2xl bg-panel-strong/60 py-5">{drawing}</div>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${done ? "bg-accent text-on-accent" : "border-2 border-accent text-accent"}`}>
          {done ? <span aria-label="Done">&#10003;</span> : n}
        </span>
        <h3 className="font-display text-xl font-semibold leading-tight">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h3>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-4 text-muted">{children}</div>
    </li>
  );
}

const saveHow: Record<Platform, ReactNode> = {
  ios: <>In <strong className="text-ink">Safari</strong>, tap <strong className="text-ink">Share</strong>, then <strong className="text-ink">Add to Home Screen</strong>, then <strong className="text-ink">Add</strong>.</>,
  android: <>In <strong className="text-ink">Chrome</strong>, tap <strong className="text-ink">Install</strong> below. Or tap the three dots, then <strong className="text-ink">Add to Home screen</strong> or <strong className="text-ink">Install app</strong>.</>,
  desktop: <>In <strong className="text-ink">Chrome</strong> or <strong className="text-ink">Edge</strong>, click the install icon at the right of the address bar, then <strong className="text-ink">Install</strong>.</>,
  unknown: <>Add this website to your phone&rsquo;s home screen. It only takes a few seconds.</>,
};

export function AppSetupSteps() {
  const platform = usePlatform();
  const installed = useInstalled();
  const where = platform === "desktop" ? "computer" : "phone";

  return (
    <section className="not-prose my-8" aria-labelledby="app-steps-heading">
      <h2 id="app-steps-heading" className="font-display text-2xl font-semibold sm:text-3xl">Three simple steps</h2>
      <p className="mt-2 text-muted">Free, no app store and no account needed.</p>
      <ol className="mt-6 grid gap-5 lg:grid-cols-3">
        <Step n={1} title={`Save our app to your ${where}`} drawing={<SaveDrawing />} done={installed}>
          {installed ? (
            <p>Done. You are using the app right now.</p>
          ) : (
            <>
              <p>{saveHow[platform]}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                <InstallAppButton className="btn btn-primary" label="Install" />
                <a href="#detailed-steps" className="text-sm font-semibold text-accent underline underline-offset-4">Show me in detail</a>
              </div>
            </>
          )}
        </Step>
        <Step n={2} title="Open it from your home screen" drawing={<OpenDrawing />} done={installed}>
          {installed ? (
            <p>Done. Next time, just tap the icon on your home screen.</p>
          ) : (
            <p>Find the icon called <strong className="text-ink">{site.appName}</strong> and tap it. It opens full screen, just like any other app.</p>
          )}
        </Step>
        <Step n={3} title="Turn on notifications" drawing={<NotifyDrawing />}>
          <p>If you would like, we will let you know when there is news or an event. You can turn them off at any time.</p>
          <div className="mt-auto">
            <NotificationsButton inline />
          </div>
        </Step>
      </ol>
    </section>
  );
}
