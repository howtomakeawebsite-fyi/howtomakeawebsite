import { Suspense } from "react";
import { getVideos, channelUrl } from "@/lib/youtube";
import { PageHero } from "@/components/PageHero";
import { VideoLibrary } from "@/components/VideoLibrary";
import { pageMetadata, ids, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";

export const metadata = pageMetadata({
  title: "Sermons",
  description: "Watch our recent sermons. New videos from our YouTube channel appear here by themselves.",
  path: "/sermons/",
  keywords: ["sermons online", "church videos", "Bible teaching"],
});

const SAMPLE = ["Sample sermon: Hope for today", "Sample sermon: A fresh start", "Sample sermon: Loving your neighbour", "Sample sermon: Finding rest"];

/** Shown until a YouTube channel ID is added in the church settings. */
function SampleState() {
  return (
    <div>
      <div className="rounded-3xl border-2 border-dashed border-accent bg-panel p-6 sm:p-8" role="note">
        <p className="eyebrow">Sample</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Add your YouTube channel ID to show your sermons</h2>
        <p className="mt-2 max-w-2xl text-muted">This page fills itself with the videos from your church&rsquo;s YouTube channel. It only needs to know which channel is yours.</p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5">
          <li>Open YouTube and sign in with the church account.</li>
          <li>Click your picture (top right), then <b>Settings</b>, then <b>Advanced settings</b>.</li>
          <li>Copy the <b>Channel ID</b>. It starts with the letters <code>UC</code> and is 24 characters long.</li>
          <li>Paste it into the church settings (&ldquo;YouTube channel ID&rdquo;) and save.</li>
        </ol>
      </div>
      <p className="mt-10 text-sm font-semibold text-muted">This is how your videos will look (these are samples, not real videos):</p>
      <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLE.map((title) => (
          <li key={title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sermon-placeholder.svg" alt="" width={1280} height={720} loading="lazy" className="aspect-video w-full rounded-2xl object-cover" />
            <p className="mt-2 font-semibold leading-snug">{title}</p>
            <p className="text-sm text-muted">Sample Pastor</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Library() {
  const { videos, state } = await getVideos();
  if (state === "unset") return <SampleState />;
  if (state === "error") {
    return (
      <div className="rounded-3xl border border-line bg-panel p-8 text-center">
        <p className="font-display text-2xl">We couldn&rsquo;t load the videos just now</p>
        <p className="mx-auto mt-2 max-w-xl text-muted">Please try again in a little while, or watch on our YouTube channel.</p>
        {channelUrl && <a className="btn btn-primary mt-5" href={channelUrl} target="_blank" rel="noopener"><Icon name="play" className="h-4 w-4" /> Open YouTube</a>}
      </div>
    );
  }
  const structured = videos.slice(0, 15).map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: (v.description || v.title).slice(0, 500),
    thumbnailUrl: v.thumbnail,
    uploadDate: v.published,
    contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
    publisher: { "@id": ids.church },
  }));
  return (
    <>
      <JsonLd data={structured} />
      <VideoLibrary videos={videos} />
      {channelUrl && (
        <div className="mt-14 text-center">
          <a className="btn btn-primary" href={channelUrl} target="_blank" rel="noopener"><Icon name="play" className="h-4 w-4" /> See every video on our YouTube channel</a>
        </div>
      )}
    </>
  );
}

export default function SermonsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Sermons", path: "/sermons/" }])} />
      <PageHero title="Sermons" intro="Catch up on recent messages." crumbs={[{ label: "Sermons", href: "/sermons/" }]} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-panel" />}>
          <Library />
        </Suspense>
      </section>
    </>
  );
}
