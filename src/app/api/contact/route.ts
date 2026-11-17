import { verifyHuman } from "@/lib/turnstile-server";
import { site } from "@/config/site";

/**
 * Contact form handler. Emails the church using Resend (https://resend.com), called directly
 * over HTTPS so there's no extra package to maintain.
 *
 * Needs these environment variables in Vercel (nothing is sent until they're set):
 *   RESEND_API_KEY     your Resend API key
 *   CONTACT_TO_EMAIL   where messages go, e.g. office@yourchurch.example
 *   CONTACT_FROM_EMAIL a sender on a domain verified in Resend, e.g. website@yourchurch.example
 *
 * Spam protection: hidden "website" field (bots fill it), minimum fill time, length limits,
 * link limit and a simple per-address rate limit.
 */
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  const firstName = str("firstName", 80);
  const lastName = str("lastName", 80);
  const email = str("email", 200);
  const comments = str("comments", 5000);
  const startedAt = Number(body.startedAt ?? 0);

  // Bots: pretend success so they don't retry.
  if (str("website", 200) || (startedAt && Date.now() - startedAt < 3000)) return Response.json({ ok: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (comments.length < 2) return Response.json({ error: "Please add a message." }, { status: 400 });
  if ((comments.match(/https?:\/\//g) ?? []).length > 3) return Response.json({ error: "Please remove some links and try again." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // "Verify you are human" (Cloudflare Turnstile, 17 Nov 2026): checked on the server, so bots cannot skip it.
  if (!(await verifyHuman(body.turnstile, ip))) return Response.json({ error: "Please tick \"Verify you are human\" and try again." }, { status: 403 });
  if (rateLimited(ip)) return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return Response.json({ error: `Form email is not set up yet, so this message was not sent. Please email ${site.email} instead.`, notSetUp: true }, { status: 503 });
  }

  const name = `${firstName} ${lastName}`.trim() || "Website visitor";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${site.shortName} website <${CONTACT_FROM_EMAIL}>`,
      to: [CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `Website message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${comments}`,
      html: `<p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}</p><p>${esc(comments).replace(/\n/g, "<br>")}</p>`,
    }),
  }).catch(() => null);
  if (!res?.ok) return Response.json({ error: `Sorry, your message couldn't be sent. Please email ${site.email}.` }, { status: 502 });
  return Response.json({ ok: true });
}
