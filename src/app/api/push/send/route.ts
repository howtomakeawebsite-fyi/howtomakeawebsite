import { createHash, timingSafeEqual } from "node:crypto";
import { countSubscriptions, isTopic, pushConfigured, quietHoursNow, sendToAll, sentToday } from "@/lib/push";

/**
 * Used by the private /notifications-admin/ page.
 *   action "count": checks the password and returns how many devices are signed up (and the quiet-hours reminders)
 *   action "send":  sends a title, message and link to every device that kept the chosen topic switched on
 */

// Slow down password guessing: after 5 wrong tries from one address, wait 15 minutes.
const failures = new Map<string, number[]>();
const WINDOW = 15 * 60_000;
const tooManyFailures = (ip: string) => (failures.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW).length >= 5;
const recordFailure = (ip: string) => failures.set(ip, [...(failures.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW), Date.now()]);

function passwordMatches(given: string) {
  const real = process.env.PUSH_ADMIN_PASSWORD;
  if (!real || real.length < 8) return false;
  // Compare fixed-length hashes in constant time, so the answer time gives nothing away.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
}

/** Accepts a page on this site ("/events/") or a full https:// address. */
function cleanLink(raw: string) {
  const link = raw.trim() || "/";
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const u = new URL(link);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooManyFailures(ip)) return Response.json({ error: "Too many wrong passwords. Please wait 15 minutes and try again." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);

  if (!process.env.PUSH_ADMIN_PASSWORD) return Response.json({ error: "Notifications are not set up yet: PUSH_ADMIN_PASSWORD is not set in Vercel." }, { status: 503 });
  if (!passwordMatches(String(body.password ?? ""))) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 1000));
    return Response.json({ error: "That password is not right." }, { status: 401 });
  }
  if (!pushConfigured()) return Response.json({ error: "Notifications are not set up yet. Check the Upstash and VAPID settings in Vercel, then redeploy." }, { status: 503 });

  const status = async () => ({ subscribers: await countSubscriptions(), quietHours: quietHoursNow(), sentToday: await sentToday() });
  if (body.action === "count") return Response.json({ ok: true, ...(await status()) });

  const title = str("title", 80);
  const message = str("message", 300);
  const url = cleanLink(str("link", 500));
  const topic = isTopic(body.topic) ? body.topic : "announcements";
  if (!title) return Response.json({ error: "Please add a title." }, { status: 400 });
  if (!message) return Response.json({ error: "Please add a message." }, { status: 400 });
  if (!url) return Response.json({ error: "The link must be a page on this site (starting with /) or a full https:// address." }, { status: 400 });

  const result = await sendToAll({ title, body: message, url }, topic);
  return Response.json({ ok: true, ...result, ...(await status()) });
}
