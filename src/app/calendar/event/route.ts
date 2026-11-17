import { icsEvent, icsFile, icsResponse } from "@/lib/ics";

const ISO = /^\d{4}-\d\d-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?Z?)?$/;

/** One event, for "Add to calendar". Times are read from the link, so nothing is stored. */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const title = (q.get("t") ?? "").slice(0, 200);
  const start = q.get("s") ?? "";
  const end = q.get("e") ?? undefined;
  if (!title || !ISO.test(start) || (end && !ISO.test(end))) return new Response("Invalid event.", { status: 400 });
  const url = q.get("u") ?? undefined;
  const body = icsFile([
    ...icsEvent({
      uid: `${start}-${title}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 60),
      title,
      start,
      end,
      allDay: start.length === 10,
      location: (q.get("l") ?? "").slice(0, 300) || undefined,
      url: url && /^https:\/\//.test(url) ? url.slice(0, 500) : undefined,
    }),
  ]);
  return icsResponse(body, "event.ics");
}
