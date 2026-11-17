import { site } from "@/config/site";

/** Small helpers for "Add to calendar" files (.ics), which Apple, Google and Outlook calendars all open. */

export const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds lines longer than 75 characters, as the iCalendar format requires. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = " " + rest.slice(74); }
  out.push(rest);
  return out.join("\r\n");
}

export function icsFile(lines: string[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${site.name}//Website//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...lines, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}

const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** "2026-11-22T10:00:00" (local time at the church), "2026-11-22T10:00:00Z" or "2026-11-22" (all day) to calendar form. */
function when(prop: "DTSTART" | "DTEND", iso: string) {
  if (/^\d{4}-\d\d-\d\d$/.test(iso)) return `${prop};VALUE=DATE:${iso.replace(/-/g, "")}`;
  const compact = iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  if (/Z$/.test(iso)) return `${prop}:${compact}`;
  return `${prop};TZID=${site.service.timeZone}:${compact.slice(0, 15)}`;
}

export type IcsEvent = { uid: string; title: string; start: string; end?: string; allDay?: boolean; location?: string; description?: string; url?: string; rrule?: string };

export function icsEvent(e: IcsEvent) {
  const lines = ["BEGIN:VEVENT", `UID:${e.uid}@${new URL(site.url).hostname}`, `DTSTAMP:${stamp()}`, when("DTSTART", e.start)];
  if (e.end) lines.push(when("DTEND", e.end));
  if (e.rrule) lines.push(`RRULE:${e.rrule}`);
  lines.push(`SUMMARY:${icsText(e.title)}`);
  if (e.location) lines.push(`LOCATION:${icsText(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${icsText(e.description)}`);
  if (e.url) lines.push(`URL:${e.url}`);
  lines.push("END:VEVENT");
  return lines;
}

export const icsResponse = (body: string, filename: string) =>
  new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "public, max-age=3600" } });

/** A link address for one event (see /calendar/event/). */
export function eventIcsHref(e: { title: string; start: string; end?: string; allDay?: boolean; location?: string; url?: string }) {
  const p = new URLSearchParams({ t: e.title, s: e.start });
  if (e.end) p.set("e", e.end);
  if (e.location) p.set("l", e.location);
  if (e.url) p.set("u", e.url);
  return `/calendar/event/?${p.toString()}`;
}
