import { cleanSubscription, pushConfigured, removeSubscription, saveSubscription } from "@/lib/push";

/** Saves (POST) or removes (DELETE) one device's notification subscription. */

// A simple brake: no more than 20 sign-ups from one address in 10 minutes.
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 20;
}

async function readJson(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!pushConfigured()) return Response.json({ error: "Notifications are not switched on yet." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const body = await readJson(req);
  const sub = cleanSubscription(body?.subscription);
  if (!sub) return Response.json({ error: "Invalid request." }, { status: 400 });
  await saveSubscription(sub);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!pushConfigured()) return Response.json({ ok: true });
  const body = await readJson(req);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint.startsWith("https://")) return Response.json({ error: "Invalid request." }, { status: 400 });
  await removeSubscription(endpoint);
  return Response.json({ ok: true });
}
