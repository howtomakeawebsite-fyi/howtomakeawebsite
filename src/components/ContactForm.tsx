"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";

type Status = "idle" | "sending" | "sent" | "error";

/** Contact form (Name, Email, Comments). Sends via /api/contact. */
export function ContactForm() {
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
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, startedAt: startedAt.current, turnstile: human }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus("sent");
      // The thank-you message replaces the form, so no reset is needed.
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return (
      <div className="not-prose my-8 rounded-3xl border border-line bg-panel p-6" role="status">
        <p className="font-display text-2xl">Thank you!</p>
        <p className="mt-1">We&rsquo;ll come back to you as soon as possible.</p>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none transition-colors focus:border-accent";
  return (
    <form onSubmit={onSubmit} className="not-prose my-8 grid gap-4 rounded-3xl border border-line bg-panel p-5 sm:grid-cols-2 sm:p-7" noValidate={false}>
      <label className="block">
        <span className="font-semibold">First name</span>
        <input name="firstName" autoComplete="given-name" className={input} />
      </label>
      <label className="block">
        <span className="font-semibold">Last name</span>
        <input name="lastName" autoComplete="family-name" className={input} />
      </label>
      <label className="block sm:col-span-2">
        <span className="font-semibold">Email <span className="text-muted">(required)</span></span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block sm:col-span-2">
        <span className="font-semibold">Comments <span className="text-muted">(required)</span></span>
        <textarea name="comments" required rows={5} className={input} />
      </label>
      {/* Spam trap: hidden from people, bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <p className="text-sm text-muted sm:col-span-2">
        We only use your details to reply to you. See our <Link href="/privacy-policy/" className="font-semibold text-accent underline underline-offset-4">Privacy Policy</Link>.
      </p>
      <div className="sm:col-span-2">
        {TURNSTILE_SITE_KEY && <div className="mb-3"><Turnstile action="contact" onToken={setHuman} onExpire={() => setHuman("")} /></div>}
        <button type="submit" className="btn btn-primary" disabled={status === "sending" || (Boolean(TURNSTILE_SITE_KEY) && !human)}>
          {status === "sending" ? "Sending..." : "Send message"}
        </button>
        {status === "error" && <p role="alert" className="mt-3 font-semibold text-live">{message}</p>}
      </div>
    </form>
  );
}
