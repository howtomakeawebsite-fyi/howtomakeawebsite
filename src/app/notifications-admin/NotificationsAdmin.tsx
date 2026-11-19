"use client";

import { useState, type FormEvent } from "react";
import { TOPICS, type Topic } from "@/lib/push-topics";

const input = "mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-base outline-none focus:border-accent";

type Status = { subscribers: number; quietHours: boolean; sentToday: boolean };
type Result = Status & { sent: number; failed: number; skipped: number; removed: number };

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/push/send/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function NotificationsAdmin() {
  // The password stays in this browser tab's memory only. Closing or reloading the tab forgets it.
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("/");
  const [topic, setTopic] = useState<Topic>("announcements");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      setStatus((await call({ action: "count", password })) as Status);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!status) return;
    const label = TOPICS.find((t) => t.id === topic)?.label ?? "";
    const warnings = [
      status.quietHours && "It is night-time at the church (quiet hours are 9 pm to 6 am).",
      status.sentToday && "A notification has already gone out today.",
    ].filter(Boolean).join(" ");
    if (!confirm(`${warnings ? warnings + "\n\n" : ""}Send "${title}" to everyone who has ${label} switched on?`)) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const data = (await call({ action: "send", password, title, message, link, topic })) as Result;
      setResult(data);
      setStatus(data);
      setTitle(""); setMessage(""); setLink("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <form onSubmit={signIn} className="mt-8 grid gap-4 rounded-3xl border border-line bg-panel p-5 sm:p-7">
        <label className="block">
          <span className="font-semibold">Admin password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        </label>
        {error && <p role="alert" className="font-semibold">{error}</p>}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={busy}>{busy ? "Checking..." : "Continue"}</button>
      </form>
    );
  }

  return (
    <form onSubmit={send} className="mt-8 grid gap-4 rounded-3xl border border-line bg-panel p-5 sm:p-7">
      <p className="rounded-2xl bg-bg px-4 py-3">
        <strong>{status.subscribers}</strong> device{status.subscribers === 1 ? " is" : "s are"} signed up for notifications.
      </p>
      {(status.quietHours || status.sentToday) && (
        <p className="rounded-2xl border border-accent bg-bg px-4 py-3" role="note">
          <strong>Good manners: </strong>
          {status.quietHours && "It is night-time at the church (quiet hours are 9 pm to 6 am). Unless it is urgent, please wait until the morning. "}
          {status.sentToday && "A notification has already gone out today. People switch notifications off when they get too many."}
        </p>
      )}
      <label className="block">
        <span className="font-semibold">Title</span>
        <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="For example: Welcome" />
      </label>
      <label className="block">
        <span className="font-semibold">Message</span>
        <textarea required maxLength={300} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={input} />
        <span className="mt-1 block text-sm text-muted">{message.length} of 300 characters. Short messages read best on a phone.</span>
      </label>
      <label className="block">
        <span className="font-semibold">Topic</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className={input}>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <span className="mt-1 block text-sm text-muted">Only people who kept this topic switched on get the message.</span>
      </label>
      <label className="block">
        <span className="font-semibold">Link (opens when someone taps the notification)</span>
        <input value={link} onChange={(e) => setLink(e.target.value)} className={input} placeholder="/events/" />
        <span className="mt-1 block text-sm text-muted">A page on this site, such as <code>/events/</code> or <code>/sermons/</code>, or a full address starting with https://</span>
      </label>
      {error && <p role="alert" className="font-semibold">{error}</p>}
      {result && (
        <p role="status" className="rounded-2xl bg-bg px-4 py-3">
          Sent to <strong>{result.sent}</strong> device{result.sent === 1 ? "" : "s"}.
          {result.skipped > 0 && ` ${result.skipped} had switched this topic off.`}
          {result.removed > 0 && ` Removed ${result.removed} that had turned notifications off.`}
          {result.failed > 0 && ` ${result.failed} could not be reached this time and will be tried again next time.`}
        </p>
      )}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={busy || status.subscribers === 0}>{busy ? "Sending..." : "Send"}</button>
    </form>
  );
}
