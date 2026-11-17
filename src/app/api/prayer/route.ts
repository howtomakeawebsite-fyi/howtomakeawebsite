import { verifyHuman } from "@/lib/turnstile-server";
import { site } from "@/config/site";

/**
 * Prayer request handler. Emails the church using Resend, the same way as the contact form
 * (see src/app/api/contact/route.ts for the settings it needs in Vercel).
 * Name and email are optional. A request marked private says so in the subject line.
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
  const name = str("name", 120);
  const email = str("email", 200);
  const request = str("request", 4000);
  const isPrivate = body.visibility !== "team";
  const startedAt = Number(body.startedAt ?? 0);

  if (str("website", 200) || (startedAt && Date.now() - startedAt < 3000)) return Response.json({ ok: true });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "That email address doesn't look right. You can leave it empty." }, { status: 400 });
  if (request.length < 3) return Response.json({ error: "Please write your prayer request." }, { status: 400 });
  if ((request.match(/https?:\/\//g) ?? []).length > 2) return Response.json({ error: "Please remove some links and try again." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // "Verify you are human" (Cloudflare Turnstile, 17 Nov 2026): checked on the server, so bots cannot skip it.
  if (!(await verifyHuman(body.turnstile, ip))) return Response.json({ error: "Please tick \"Verify you are human\" and try again." }, { status: 403 });
  if (rateLimited(ip)) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return Response.json({ error: `Form email is not set up yet, so this message was not sent. Please email ${site.email} instead.`, notSetUp: true }, { status: 503 });
  }

  const who = name || "Anonymous";
  const visibility = isPrivate ? "PRIVATE: pastoral team only" : "OK to share with the prayer team";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${site.shortName} website <${CONTACT_FROM_EMAIL}>`,
      to: [CONTACT_TO_EMAIL],
      ...(email ? { reply_to: email } : {}),
      subject: `Prayer request (${isPrivate ? "private" : "shareable"}) from ${who}`,
      text: `${visibility}\nName: ${who}\nEmail: ${email || "not given"}\n\n${request}`,
      html: `<p><b>${esc(visibility)}</b><br><b>Name:</b> ${esc(who)}<br><b>Email:</b> ${esc(email || "not given")}</p><p>${esc(request).replace(/\n/g, "<br>")}</p>`,
    }),
  }).catch(() => null);
  if (!res?.ok) return Response.json({ error: `Sorry, your request couldn't be sent. Please email ${site.email}.` }, { status: 502 });
  return Response.json({ ok: true });
}
