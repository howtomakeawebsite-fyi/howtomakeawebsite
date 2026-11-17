"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";

type Status = "idle" | "sending" | "sent" | "error";

/** Prayer request form. Name and email are optional. Sends via /api/prayer. */
export function PrayerForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const startedAt = useRef(0);
  const [human, setHuman] = useState("");                       // the "Verify you are human" answer
  useEffect(() => { startedAt.current = Date.now(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/prayer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, startedAt: startedAt.current, turnstile: human }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return (
      <div className="not-prose my-8 rounded-3xl border border-line bg-panel p-6" role="status">
        <p className="font-display text-2xl">We have received your request</p>
        <p className="mt-1">Thank you for trusting us with it. We will pray for you.</p>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none transition-colors focus:border-accent";
  return (
    <form onSubmit={onSubmit} className="not-prose my-8 grid gap-4 rounded-3xl border border-line bg-panel p-5 sm:grid-cols-2 sm:p-7">
      <label className="block">
        <span className="font-semibold">Your name <span className="text-muted">(optional)</span></span>
        <input name="name" autoComplete="name" className={input} />
      </label>
      <label className="block">
        <span className="font-semibold">Email <span className="text-muted">(optional, only if you&rsquo;d like a reply)</span></span>
        <input name="email" type="email" autoComplete="email" className={input} />
      </label>
      <label className="block sm:col-span-2">
        <span className="font-semibold">How can we pray for you? <span className="text-muted">(required)</span></span>
        <textarea name="request" required rows={6} className={input} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="font-semibold">Who may see this?</legend>
        <label className="mt-2 flex items-start gap-3"><input type="radio" name="visibility" value="private" defaultChecked className="mt-1.5" /><span>Keep it private: our pastoral team only</span></label>
        <label className="mt-2 flex items-start gap-3"><input type="radio" name="visibility" value="team" className="mt-1.5" /><span>It&rsquo;s fine to share with our prayer team</span></label>
      </fieldset>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <p className="text-sm text-muted sm:col-span-2">
        Please don&rsquo;t include other people&rsquo;s private details without their permission. If someone&rsquo;s life or safety is in danger, call your local emergency number. See our <Link href="/privacy-policy/" className="font-semibold text-accent underline underline-offset-4">Privacy Policy</Link>.
      </p>
      <div className="sm:col-span-2">
        {TURNSTILE_SITE_KEY && <div className="mb-3"><Turnstile action="prayer" onToken={setHuman} onExpire={() => setHuman("")} /></div>}
        <button type="submit" className="btn btn-primary" disabled={status === "sending" || (Boolean(TURNSTILE_SITE_KEY) && !human)}>{status === "sending" ? "Sending..." : "Send prayer request"}</button>
        {status === "error" && <p role="alert" className="mt-3 font-semibold text-live">{message}</p>}
      </div>
    </form>
  );
}
