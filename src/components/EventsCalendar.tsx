import Link from "next/link";
import { site } from "@/config/site";
import { getUpcomingEvents, type ChurchEvent } from "@/lib/events";
import { Icon } from "./Icon";
import { ids } from "@/lib/seo";
import { eventIcsHref } from "@/lib/ics";
import { JsonLd } from "@/components/JsonLd";

/** Adds the church's UTC offset (for example +12:00) to a local time, for structured data. */
function withOffset(local: string) {
  if (/Z$|[+-]\d\d:\d\d$/.test(local) || local.length === 10) return local;
  const name = new Intl.DateTimeFormat("en", { timeZone: site.service.timeZone, timeZoneName: "longOffset" }).formatToParts(new Date(`${local}Z`)).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  return local + (name.replace("GMT", "") || "Z");
}

/** Event times are stored as the church's local time, so they are shown exactly as written. */
function when(e: ChurchEvent) {
  const d = new Date(e.allDay ? `${e.start}T12:00:00Z` : `${e.start.slice(0, 19)}Z`);
  const day = d.toLocaleDateString("en", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  if (e.allDay) return { day, time: "All day" };
  return { day, time: d.toLocaleTimeString("en", { timeZone: "UTC", hour: "numeric", minute: "2-digit" }) };
}

/**
 * Upcoming events from the calendar link in the church settings.
 * limit: show only the first few. row: small cards side by side (used on the home page).
 */
export async function EventsCalendar({ limit, row = false }: { limit?: number; row?: boolean }) {
  const { events, ok, sample } = await getUpcomingEvents(60);
  if (!ok) {
    return (
      <div className="not-prose my-6 rounded-3xl border border-line bg-panel p-6">
        <p className="font-semibold">We couldn&rsquo;t load the events calendar just now.</p>
        <p className="mt-1 text-muted">Please try again later, or <Link className="font-semibold text-accent underline" href="/contact/">get in touch</Link> and we&rsquo;ll let you know what&rsquo;s on.</p>
      </div>
    );
  }
  const list = limit ? events.slice(0, limit) : events;
  if (list.length === 0) {
    return <p className="not-prose my-6 rounded-3xl border border-line bg-panel p-6">No events are listed for the next 60 days. Please check back soon.</p>;
  }
  const structured = (limit || sample ? [] : events).map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: withOffset(e.start),
    ...(e.end ? { endDate: withOffset(e.end) } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: e.location ? { "@type": "Place", name: e.location, address: e.location } : { "@id": ids.place },
    organizer: { "@id": ids.church },
    ...(e.description ? { description: e.description.slice(0, 300) } : {}),
    ...(e.url ? { url: e.url } : {}),
  }));
  return (
    <>
      {structured.length > 0 && <JsonLd data={structured} />}
      {sample && (
        <p className="not-prose my-4 rounded-2xl border-2 border-dashed border-accent bg-panel px-4 py-3 text-sm" role="note">
          <b>These are sample events.</b> To show your own, paste your calendar&rsquo;s public iCal (.ics) link into the church settings (&ldquo;Calendar link&rdquo;).
        </p>
      )}
      <ol className={row ? "not-prose my-6 grid gap-3 md:grid-cols-3" : "not-prose my-6 space-y-3"} aria-label="Upcoming events">
        {list.map((e) => {
          const w = when(e);
          return (
            <li key={e.id + e.start} data-reveal className={row ? "card flex gap-3 p-4" : "card flex gap-4 p-4 sm:p-5"}>
              <div className={row ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-panel-strong text-ink" : "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-panel-strong text-ink"}><Icon name="calendar" className={row ? "h-5 w-5" : undefined} /></div>
              <div className="min-w-0">
                <p className={row ? "font-display text-base font-semibold leading-snug" : "font-display text-lg font-semibold leading-snug"}>{e.url ? <a href={e.url} target="_blank" rel="noopener" className="hover:underline">{e.title}</a> : e.title}</p>
                <p className="text-sm font-semibold text-muted">{w.day} &middot; {w.time}</p>
                {e.location && <p className="mt-1 text-sm text-muted">{e.location}</p>}
                {!sample && (
                  <a href={eventIcsHref({ title: e.title, start: e.start, end: e.end, location: e.location, url: e.url })} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong underline" aria-label={`Add ${e.title} to your calendar`}><Icon name="calendar" className="h-4 w-4" /> Add to calendar</a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
