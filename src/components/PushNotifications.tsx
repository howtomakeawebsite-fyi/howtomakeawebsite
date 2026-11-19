"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { TOPICS, type Topic } from "@/lib/push-topics";

/*
 * "Turn on notifications" (on the Notifications page and the Get our app page). Asks the phone for permission,
 * then saves this device's push address so the church can send news. Each topic has its own switch.
 * iPhones and iPads only allow notifications once the site is added to the Home Screen (iOS 16.4 or newer).
 * Until the keys are set in Vercel (see .env.example), it simply says notifications are coming soon.
 */

type State = "loading" | "off" | "on" | "busy" | "blocked" | "unsupported" | "ios-not-installed" | "not-ready";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
/** True once the notification keys are built into the site (the bell and the home page invitation only show then). */
export const notificationsReady = PUBLIC_KEY !== "";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

/** One switch per topic. All are on when notifications are turned on; each can be switched off. */
function TopicSwitches() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [msg, setMsg] = useState("");
  const endpoint = async () => (await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription())?.endpoint;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ep = await endpoint();
      if (!ep) return;
      const r = await fetch("/api/push/topics/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: ep }) });
      const d = await r.json().catch(() => ({}));
      if (!cancelled) setTopics(r.ok ? d.topics : TOPICS.map((t) => t.id));
    })().catch(() => { if (!cancelled) setTopics(TOPICS.map((t) => t.id)); });
    return () => { cancelled = true; };
  }, []);
  async function toggle(id: Topic, on: boolean) {
    if (!topics) return;
    const before = topics;
    const next = on ? [...topics, id] : topics.filter((t) => t !== id);
    setTopics(next);
    setMsg("");
    try {
      const ep = await endpoint();
      const r = await fetch("/api/push/topics/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: ep, topics: next }) });
      if (!r.ok) throw new Error();
      setMsg("Saved.");
    } catch {
      setTopics(before);
      setMsg("That did not save. Please try again.");
    }
  }
  if (!topics) return null;
  return (
    <fieldset className="mt-5 rounded-2xl bg-bg p-4">
      <legend className="px-1 text-sm font-semibold">What would you like to get?</legend>
      <ul className="space-y-3">
        {TOPICS.map((t) => {
          const on = topics.includes(t.id);
          return (
            <li key={t.id}>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span><span className="font-semibold">{t.label}</span> <span className="text-sm text-muted">({t.note})</span></span>
                <input type="checkbox" role="switch" className="peer sr-only" checked={on} onChange={(e) => toggle(t.id, e.target.checked)} />
                <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${on ? "bg-accent" : "bg-panel-strong"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-bg shadow-soft transition-[left] ${on ? "left-6" : "left-1"}`} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted" aria-live="polite">{msg || "Switch off anything you do not want. You can change this at any time."}</p>
    </fieldset>
  );
}

export function NotificationsButton({ inline = false }: { inline?: boolean } = {}) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: State;
      if (!PUBLIC_KEY) next = "not-ready";
      else if (!supported()) next = isIos() && !isStandalone() ? "ios-not-installed" : "unsupported";
      else if (Notification.permission === "denied") next = "blocked";
      else {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        next = sub ? "on" : "off";
      }
      if (!cancelled) setState(next);
    })().catch(() => { if (!cancelled) setState("unsupported"); });
    return () => { cancelled = true; };
  }, []);

  async function turnOn() {
    setError("");
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      await registration();
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) }));
      const res = await fetch("/api/push/subscribe/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setState("off");
    }
  }

  async function turnOff() {
    setError("");
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe/", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setError("We could not turn notifications off. You can also do it in your phone's settings.");
      setState("on");
    }
  }

  const status: Record<Exclude<State, "loading">, string> = {
    on: "Notifications are on for this device.",
    off: "Get the Thought for the Day and church announcements on this device. You can switch off either of them.",
    busy: "One moment...",
    blocked: "Notifications are blocked for this site. You can allow them in your browser or phone settings, then come back here.",
    unsupported: "This browser cannot receive notifications. Try Chrome, Edge, Firefox or Safari.",
    "ios-not-installed": "On iPhone and iPad, notifications only work from the app on your Home Screen.",
    "not-ready": "Notifications are coming soon.",
  };

  if (state === "loading") return <div className={inline ? "min-h-11" : "not-prose my-8 min-h-24"} aria-hidden />;

  const turnOnButton = (state === "off" || (state === "busy" && !error)) && (
    <button type="button" className="btn btn-primary" onClick={turnOn} disabled={state === "busy"}>
      <Icon name="bell" className="h-4 w-4" /> {state === "busy" ? "One moment..." : "Turn on notifications"}
    </button>
  );
  const iosNote = state === "ios-not-installed" && (
    <p className={inline ? "rounded-2xl bg-bg p-3 text-sm text-ink" : "mt-4 text-sm"}>
      <strong>iPhone or iPad:</strong> first add this website to your Home Screen (tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, then <strong>Add</strong>). Then open it from the icon on your Home Screen, come back here and tap <strong>Turn on notifications</strong>. You need iOS 16.4 or newer.{" "}
      {!inline && <Link href="/get-our-app/" className="font-semibold text-accent underline underline-offset-4">Show me how</Link>}
    </p>
  );

  // Compact version for step 3 on the Get our app page.
  if (inline) {
    return (
      <div aria-live="polite" className="space-y-2">
        {turnOnButton}
        {state === "on" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-ink">&#10003; Notifications are on</p>
            <Link href="/notifications/" className="text-sm font-semibold text-accent underline underline-offset-4">Choose topics</Link>
          </div>
        )}
        {iosNote}
        {(state === "blocked" || state === "unsupported" || state === "not-ready") && <p className="text-sm text-ink">{status[state]}</p>}
        {error && <p className="text-sm font-semibold text-ink" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-panel p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bg text-accent"><Icon name="bell" className="h-6 w-6" /></span>
        <div className="min-w-[12rem] flex-1">
          <p className="font-display text-xl font-semibold">{state === "on" ? "Notifications are on" : "Notifications"}</p>
          <p className="text-muted">{status[state]}</p>
        </div>
        {turnOnButton}
        {state === "on" && <button type="button" className="btn btn-ghost" onClick={turnOff}>Turn off</button>}
      </div>
      {iosNote}
      {state === "on" && <TopicSwitches />}
      {error && <p className="mt-3 text-sm font-semibold" role="alert">{error}</p>}
    </div>
  );
}
