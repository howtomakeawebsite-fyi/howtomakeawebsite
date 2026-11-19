import { getLiveStatus } from "@/lib/youtube";

/** /api/live/: is the church's YouTube channel live right now? Used by the "Live now" banner and the Sermons page. */
export async function GET() {
  const status = await getLiveStatus();
  return Response.json(status, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
