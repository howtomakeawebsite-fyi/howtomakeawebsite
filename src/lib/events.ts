import { cacheLife } from "next/cache";
import { site } from "@/config/site";

/**
 * EVENTS SOURCE: one setting.
 * Paste your calendar's public iCal (.ics) address into the church settings (content/settings.json, "Calendar link"),
 * or set EVENTS_ICS_URL in your host's environment variables. Google Calendar calls it "Public address in iCal format".
 * Repeating events, skipped dates and changed dates are all handled below.
 * With no link set, the site shows clearly labelled sample events instead.
 */
export const EVENTS_ICS_URL = process.env.EVENTS_ICS_URL || site.calendar.icsUrl;

export type ChurchEvent = { sample?: boolean; id: string; title: string; start: string; allDay: boolean; end?: string; location?: string; description?: string; url?: string };

function unfold(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function unescape(v: string) {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

/** Returns an ISO-like string. Floating/TZID times are treated as local time at the church. */
function parseDate(key: string, value: string): { iso: string; allDay: boolean } {
  if (/VALUE=DATE(?!-)/.test(key) || /^\d{8}$/.test(value)) {
    return { iso: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`, allDay: true };
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return { iso: value, allDay: false };
  const [, y, mo, d, h, mi, s, z] = m;
  if (z) return { iso: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString(), allDay: false };
  return { iso: `${y}-${mo}-${d}T${h}:${mi}:${s}`, allDay: false }; // local wall time
}

type RawEvent = ChurchEvent & { rrule?: string; exdates: string[]; recurrenceId?: string; cancelled: boolean };

/** All date values of a property that can appear more than once (EXDATE). */
function allValues(block: string, name: string) {
  const out: { key: string; value: string }[] = [];
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx);
    if (key.split(";")[0].toUpperCase() === name) out.push({ key, value: line.slice(idx + 1).trim() });
  }
  return out;
}

function parseRaw(ics: string): RawEvent[] {
  const text = unfold(ics);
  const blocks = text.split("BEGIN:VEVENT").slice(1).map((b) => b.split("END:VEVENT")[0]);
  return blocks.map((b, i) => {
    const props: Record<string, { key: string; value: string }> = {};
    for (const line of b.split("\n")) {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx);
      const name = key.split(";")[0].toUpperCase();
      if (!props[name]) props[name] = { key, value: line.slice(idx + 1).trim() };
    }
    const start = props.DTSTART ? parseDate(props.DTSTART.key, props.DTSTART.value) : { iso: "", allDay: false };
    const end = props.DTEND ? parseDate(props.DTEND.key, props.DTEND.value) : undefined;
    const exdates = allValues(b, "EXDATE").flatMap(({ key, value }) => value.split(",").map((v) => toWall(parseDate(key, v.trim()).iso)));
    return {
      id: props.UID?.value ?? String(i),
      title: unescape(props.SUMMARY?.value ?? "Event"),
      start: start.iso,
      allDay: start.allDay,
      end: end?.iso,
      location: props.LOCATION ? unescape(props.LOCATION.value) : undefined,
      description: props.DESCRIPTION ? unescape(props.DESCRIPTION.value) : undefined,
      url: props.URL?.value,
      rrule: props.RRULE?.value,
      exdates,
      recurrenceId: props["RECURRENCE-ID"] ? toWall(parseDate(props["RECURRENCE-ID"].key, props["RECURRENCE-ID"].value).iso) : undefined,
      cancelled: props.STATUS?.value.toUpperCase() === "CANCELLED",
    };
  });
}

/* ---------- Repeating events (Google Calendar stores a weekly service as one event with a rule) ---------- */

/** Turns a UTC time ("...Z") into the church's local time, so repeats stay at the same local time across daylight saving. */
function toWall(iso: string) {
  if (!/Z$/.test(iso)) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: site.service.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}`;
}

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const dayMs = 86_400_000;
/** Wall time as a plain number, treating it as if it were UTC (no time zone maths needed). */
const wallMs = (wall: string) => Date.parse(wall.length === 10 ? `${wall}T00:00:00Z` : `${wall}Z`);
const fromWallMs = (ms: number, allDay: boolean) => new Date(ms).toISOString().slice(0, allDay ? 10 : 19);

function matchesByDay(d: Date, byday: string[], monthly: boolean) {
  return byday.some((rule) => {
    const m = rule.match(/^([+-]?\d+)?([A-Z]{2})$/);
    if (!m || DAYS.indexOf(m[2]) !== d.getUTCDay()) return false;
    if (!m[1] || !monthly) return true;
    const n = Number(m[1]);
    const dom = d.getUTCDate();
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    return n > 0 ? Math.ceil(dom / 7) === n : Math.ceil((daysInMonth - dom + 1) / 7) === -n;
  });
}

/** Lists the dates a repeating event falls on, up to `untilMs` (wall time). */
function expand(e: RawEvent, untilMs: number): string[] {
  const rule = Object.fromEntries(e.rrule!.split(";").map((p) => p.split("=")) as [string, string][]);
  const freq = rule.FREQ;
  const interval = Math.max(1, Number(rule.INTERVAL ?? 1));
  const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
  const until = rule.UNTIL ? wallMs(toWall(parseDate("UNTIL", rule.UNTIL).iso)) + (rule.UNTIL.length === 8 ? dayMs - 1 : 0) : Infinity;
  const byday = rule.BYDAY?.split(",");
  const bymonthday = rule.BYMONTHDAY?.split(",").map(Number);
  const bymonth = rule.BYMONTH?.split(",").map(Number);

  const startWall = toWall(e.start);
  const startMs = wallMs(startWall);
  const timeOfDay = startMs % dayMs;
  const s = new Date(startMs);
  const startDay = startMs - timeOfDay;
  // Weeks are counted from the Monday on or before the start (iCalendar's default week start).
  const startWeek = startDay - ((s.getUTCDay() + 6) % 7) * dayMs;

  const out: string[] = [];
  let n = 0;
  const last = Math.min(untilMs, until);
  for (let day = startDay; day + timeOfDay <= last && n < count; day += dayMs) {
    const d = new Date(day);
    const months = (d.getUTCFullYear() - s.getUTCFullYear()) * 12 + d.getUTCMonth() - s.getUTCMonth();
    if (bymonth && !bymonth.includes(d.getUTCMonth() + 1)) continue;
    let ok = false;
    if (freq === "DAILY") ok = Math.round((day - startDay) / dayMs) % interval === 0 && (!byday || matchesByDay(d, byday, false));
    else if (freq === "WEEKLY") ok = Math.floor((day - startWeek) / (7 * dayMs)) % interval === 0 && (byday ? matchesByDay(d, byday, false) : d.getUTCDay() === s.getUTCDay());
    else if (freq === "MONTHLY") ok = months % interval === 0 && (byday ? matchesByDay(d, byday, true) : bymonthday ? bymonthday.includes(d.getUTCDate()) : d.getUTCDate() === s.getUTCDate());
    else if (freq === "YEARLY") {
      const years = d.getUTCFullYear() - s.getUTCFullYear();
      const rightMonth = bymonth ? true : d.getUTCMonth() === s.getUTCMonth();
      ok = years % interval === 0 && rightMonth && (byday ? matchesByDay(d, byday, true) : bymonthday ? bymonthday.includes(d.getUTCDate()) : d.getUTCDate() === s.getUTCDate());
    }
    if (!ok) continue;
    n++; // COUNT includes dates later removed with EXDATE
    out.push(fromWallMs(day + timeOfDay, e.allDay));
  }
  return out;
}

/** Reads an iCalendar feed (for example Google Calendar) into a list of events, with repeating events listed date by date up to `untilMs`. */
export function parseIcs(ics: string, untilMs = Date.now() + 366 * dayMs): ChurchEvent[] {
  const raw = parseRaw(ics);
  // Single changed or cancelled dates of a repeating event (Google stores these separately).
  const overrides = new Set(raw.filter((e) => e.recurrenceId).map((e) => `${e.id}|${e.recurrenceId}`));
  const out: ChurchEvent[] = [];
  for (const e of raw) {
    const { rrule, exdates, recurrenceId, cancelled, ...event } = e;
    if (cancelled) continue;
    // Everything in the church's local time, so a one-off saved in UTC still lines up with a weekly event at the same time.
    if (!rrule || recurrenceId) { out.push(event.allDay ? event : { ...event, start: toWall(event.start), end: event.end ? toWall(event.end) : undefined }); continue; }
    const duration = e.end ? wallMs(toWall(e.end)) - wallMs(toWall(e.start)) : 0;
    const untilWall = wallMs(toWall(new Date(untilMs).toISOString()));
    for (const start of expand(e, untilWall)) {
      if (exdates.includes(start) || overrides.has(`${e.id}|${start}`)) continue;
      out.push({ ...event, id: `${e.id}-${start}`, start, end: e.end ? fromWallMs(wallMs(start) + duration, e.allDay) : undefined });
    }
  }
  return out;
}

/** Made-up events shown until a calendar link is set, so the page never looks empty. */
function sampleEvents(): ChurchEvent[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(site.service.hour)}:${pad(site.service.minute)}:00`;
  const today = wallMs(toWall(new Date().toISOString()).slice(0, 10));
  const next = (weekday: number, weeksAhead = 0) => fromWallMs(today + (((weekday - new Date(today).getUTCDay() + 7) % 7 || 7) + weeksAhead * 7) * dayMs, true);
  const where = site.addressLine;
  return [
    { sample: true, id: "sample-1", title: "Sunday Service (sample event)", start: `${next(site.service.day)}T${time}`, allDay: false, location: where },
    { sample: true, id: "sample-2", title: "Midweek Bible Study (sample event)", start: `${next(3)}T19:00:00`, allDay: false, location: where },
    { sample: true, id: "sample-3", title: "Community Lunch (sample event)", start: `${next(6, 1)}T12:00:00`, allDay: false, location: where },
    { sample: true, id: "sample-4", title: "Youth Evening (sample event)", start: `${next(5, 1)}T18:30:00`, allDay: false, location: where },
  ].sort((a, b) => a.start.localeCompare(b.start));
}

/** Upcoming events for the next `days` days. Cached for an hour. `sample` is true when no calendar link is set. */
export async function getUpcomingEvents(days = 60): Promise<{ events: ChurchEvent[]; ok: boolean; sample: boolean }> {
  "use cache";
  cacheLife("hours");
  if (!EVENTS_ICS_URL) return { events: sampleEvents(), ok: true, sample: true };
  try {
    const res = await fetch(EVENTS_ICS_URL, { headers: { "User-Agent": "ChurchStarterWebsite/1.0" } });
    if (!res.ok) return { events: [], ok: false, sample: false };
    const all = parseIcs(await res.text(), Date.now() + days * 86_400_000);
    const now = Date.now() - 12 * 3_600_000;
    const until = Date.now() + days * 86_400_000;
    const ts = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).getTime();
    const events = all.filter((e) => e.start && ts(e.start) >= now && ts(e.start) <= until).sort((a, b) => ts(a.start) - ts(b.start));
    return { events, ok: true, sample: false };
  } catch {
    return { events: [], ok: false, sample: false };
  }
}
