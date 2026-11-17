import { site } from "@/config/site";
import { icsEvent, icsFile, icsResponse } from "@/lib/ics";

const CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** The weekly service, for "Add to calendar". Repeats every week on the service day from the church settings. */
export function GET() {
  // 4 January 2026 was a Sunday; calendars repeat weekly from the matching weekday.
  const first = `2026-01-${String(4 + site.service.day).padStart(2, "0")}`;
  const pad = (n: number) => String(n).padStart(2, "0");
  const endMinutes = site.service.hour * 60 + site.service.minute + site.service.durationMinutes;
  const body = icsFile(
    icsEvent({
      uid: "weekly-service",
      title: `${site.service.dayName} service at ${site.name}`,
      start: `${first}T${pad(site.service.hour)}:${pad(site.service.minute)}:00`,
      end: `${first}T${pad(Math.floor(endMinutes / 60) % 24)}:${pad(endMinutes % 60)}:00`,
      rrule: `FREQ=WEEKLY;BYDAY=${CODES[site.service.day]}`,
      location: `${site.venue.name}, ${site.addressLine}`,
      description: `Join us for our service. More details: ${site.url}/plan-your-visit/`,
      url: `${site.url}/plan-your-visit/`,
    }),
  );
  return icsResponse(body, "weekly-service.ics");
}
