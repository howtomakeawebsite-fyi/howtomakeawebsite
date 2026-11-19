// Server code only: used by the /api/push/ routes. Never import this into a "use client" file.
import { Redis } from "@upstash/redis";
import { sendNotification, setVapidDetails, type PushSubscription } from "web-push";
import { site } from "@/config/site";
import { TOPICS, type Topic } from "./push-topics";
export { TOPICS, isTopic, type Topic } from "./push-topics";

/**
 * Phone notifications (the bell at the top of every page, and the /notifications/ page).
 *
 * Nothing is stored or sent until these environment variables are set in Vercel (see .env.example):
 *   KV_REST_API_URL, KV_REST_API_TOKEN   Upstash Redis. Vercel adds both by itself when you connect
 *                                        Upstash for Redis to the project from the Storage tab.
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   the key pair. Make it once with:  npm run vapid
 *   VAPID_SUBJECT                        mailto: and your church email, for example mailto:office@yourchurch.example
 *   PUSH_ADMIN_PASSWORD                  password for the private /notifications-admin/ page
 *
 * Privacy: we store only what the browser gives us to deliver a notification (an address at the phone
 * maker's push service and two encryption keys) and the topics chosen. No names, emails or IP addresses.
 */

const KEY = "push:subscriptions"; // one Redis hash: push address -> subscription and topics
const LAST_SENT = "push:last-sent"; // when the last notification went out (for the "one a day" reminder)

export type PushMessage = { title: string; body: string; url: string };
type Stored = PushSubscription & { topics?: Topic[] };

const parse = (raw: Stored | string) => (typeof raw === "string" ? (JSON.parse(raw) as Stored) : raw);

let redis: Redis | null = null;
function db() {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return null;
  redis ??= new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });
  return redis;
}

let vapidReady = false;
function vapid() {
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  if (!vapidReady) {
    setVapidDetails(VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidReady = true;
  }
  return true;
}

/** True when both the store and the keys are set up. */
export const pushConfigured = () => Boolean(db()) && vapid();

/** Checks that a subscription from the browser has the expected shape, and returns a clean copy. */
export function cleanSubscription(input: unknown): PushSubscription | null {
  if (!input || typeof input !== "object") return null;
  const s = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const ok =
    typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 &&
    typeof s.keys?.p256dh === "string" && s.keys.p256dh.length < 200 &&
    typeof s.keys?.auth === "string" && s.keys.auth.length < 100;
  return ok ? { endpoint: s.endpoint as string, keys: { p256dh: s.keys!.p256dh as string, auth: s.keys!.auth as string } } : null;
}

async function getStored(endpoint: string) {
  const r = db();
  if (!r) return null;
  const raw = await r.hget<Stored | string>(KEY, endpoint);
  return raw ? parse(raw) : null;
}

/** Saves a device's subscription. A device that turns notifications on again keeps its topic choices. */
export async function saveSubscription(sub: PushSubscription) {
  const r = db();
  if (!r) throw new Error("Notifications are not set up yet.");
  const topics = (await getStored(sub.endpoint))?.topics;
  await r.hset(KEY, { [sub.endpoint]: JSON.stringify({ ...sub, ...(topics ? { topics } : {}) }) });
}

/** The topics one device gets (all of them unless the person switched some off). Null when the device is not signed up. */
export async function getTopics(endpoint: string): Promise<Topic[] | null> {
  const s = await getStored(endpoint);
  if (!s) return null;
  return s.topics ?? TOPICS.map((t) => t.id);
}

/** Saves which topics one device wants. Returns false when the device is not signed up. */
export async function setTopics(endpoint: string, topics: Topic[]) {
  const r = db();
  const s = await getStored(endpoint);
  if (!r || !s) return false;
  await r.hset(KEY, { [endpoint]: JSON.stringify({ ...s, topics }) });
  return true;
}

export async function removeSubscription(endpoint: string) {
  await db()?.hdel(KEY, endpoint);
}

export async function countSubscriptions() {
  return (await db()?.hlen(KEY)) ?? 0;
}

/** Hour (0 to 23) and date ("2027-03-14") in the church's own time zone. */
function churchClock(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: site.service.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: Number(g("hour")) };
}

/** Quiet hours: 9 pm to 6 am in the church's time zone (the time zone in the church settings). */
export const QUIET_HOURS = { from: 21, to: 6 };
export const quietHoursNow = () => {
  const h = churchClock().hour;
  return h >= QUIET_HOURS.from || h < QUIET_HOURS.to;
};

/** True when a notification has already gone out today (church time). Good manners: no more than one a day. */
export async function sentToday() {
  const last = await db()?.get<number | string>(LAST_SENT);
  return last ? churchClock(new Date(Number(last))).date === churchClock().date : false;
}

/**
 * Sends one notification to every device that kept this topic switched on.
 * Devices the push service reports as gone (notifications turned off, or the app removed) are deleted.
 */
export async function sendToAll(message: PushMessage, topic: Topic) {
  const r = db();
  if (!r || !vapid()) throw new Error("Notifications are not set up yet.");
  const all = (await r.hgetall<Record<string, Stored | string>>(KEY)) ?? {};
  const payload = JSON.stringify(message);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const expired: string[] = [];

  const entries = Object.entries(all);
  // Send in small batches so a long list does not open hundreds of connections at once.
  for (let i = 0; i < entries.length; i += 50) {
    await Promise.all(
      entries.slice(i, i + 50).map(async ([endpoint, raw]) => {
        const { topics, ...sub } = parse(raw); // Upstash may hand back the stored JSON already parsed
        if (topics && !topics.includes(topic)) { skipped++; return; } // they switched this topic off
        try {
          await sendNotification(sub, payload, { TTL: 60 * 60 * 24, urgency: "normal" });
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) expired.push(endpoint);
          else failed++;
        }
      }),
    );
  }
  if (expired.length) await r.hdel(KEY, ...expired);
  if (sent) await r.set(LAST_SENT, Date.now());
  return { sent, failed, skipped, removed: expired.length };
}
