import { getPages } from "@/lib/content";
import { getVideos } from "@/lib/youtube";

/** Search data for the site search (pages and sermon videos). Rebuilt with each publish, videos hourly. */
export async function GET() {
  const pages = getPages().map((p) => ({ title: p.title, url: `/${p.slug}/`, type: "Page", text: p.plain.slice(0, 1500) }));
  const extra = [{ title: "Sermons", url: "/sermons/", type: "Page", text: "Sermons, videos, messages, watch online" }];
  const { videos } = await getVideos();
  const vids = videos.map((v) => ({ title: v.title, url: `https://www.youtube.com/watch?v=${v.id}`, type: "Video", text: v.description.slice(0, 600) }));
  return Response.json([...extra, ...pages, ...vids]);
}
