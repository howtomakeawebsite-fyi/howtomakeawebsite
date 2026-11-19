import { getPages } from "@/lib/content";
import { getVideos } from "@/lib/youtube";
import { faqItems } from "@/lib/faq";

/** Search data for the site search (pages and sermon videos). Rebuilt with each publish, videos hourly. */
export async function GET() {
  const pages = getPages().map((p) => ({ title: p.title, url: `/${p.slug}/`, type: "Page", text: p.plain.slice(0, 1500) }));
  const extra = [
    { title: "Sermons", url: "/sermons/", type: "Page", text: "Sermons, videos, messages, watch online" },
    { title: "Frequently asked questions", url: "/faq/", type: "Page", text: faqItems.map((f) => `${f.q} ${f.a}`).join(" ").slice(0, 1500) },
    ...faqItems.map((f) => ({ title: f.q, url: "/faq/", type: "FAQ", text: f.a })),
  ];
  const { videos } = await getVideos();
  const vids = videos.map((v) => ({ title: v.title, url: `https://www.youtube.com/watch?v=${v.id}`, type: "Video", text: v.description.slice(0, 600) }));
  return Response.json([...extra, ...pages, ...vids]);
}
