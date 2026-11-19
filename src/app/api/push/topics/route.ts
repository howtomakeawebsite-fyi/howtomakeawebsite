import { getTopics, isTopic, pushConfigured, setTopics } from "@/lib/push";

/**
 * Which notification topics one device gets.
 *   POST { endpoint }          -> { topics }   (all topics unless the person switched some off)
 *   POST { endpoint, topics }  -> saves them
 * The endpoint is the device's own push address, known only to that device.
 */
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 60;
}

export async function POST(req: Request) {
  if (!pushConfigured()) return Response.json({ error: "Notifications are not switched on yet." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  let body: { endpoint?: unknown; topics?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const endpoint = typeof body.endpoint === "string" && body.endpoint.startsWith("https://") && body.endpoint.length < 1000 ? body.endpoint : "";
  if (!endpoint) return Response.json({ error: "Invalid request." }, { status: 400 });
  if (Array.isArray(body.topics)) {
    const topics = [...new Set(body.topics.filter(isTopic))];
    if (!(await setTopics(endpoint, topics))) return Response.json({ error: "This device is not signed up. Turn notifications on first." }, { status: 404 });
    return Response.json({ ok: true, topics });
  }
  const topics = await getTopics(endpoint);
  if (!topics) return Response.json({ error: "This device is not signed up." }, { status: 404 });
  return Response.json({ ok: true, topics });
}
