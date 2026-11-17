import Link from "next/link";
import { Suspense } from "react";
import home from "../../content/home.json";
import { getVideos, channelUrl } from "@/lib/youtube";
import { Icon } from "@/components/Icon";
import { LiteYouTube } from "@/components/LiteYouTube";
import { EventsCalendar } from "@/components/EventsCalendar";
import { site } from "@/config/site";

/** Home page. The words come from content/home.json; the church details from content/settings.json. */

async function LatestSermon() {
  const { videos, state } = await getVideos();
  const v = videos[0];
  if (v) {
    return (
      <div>
        <LiteYouTube id={v.id} title={v.title} />
        <p className="mt-3 font-semibold">{v.title}</p>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-3xl bg-deep-oak text-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/sermon-placeholder.svg" alt="" width={1280} height={720} className="aspect-video w-full object-cover opacity-60" />
      {/* The picture already has a play button in the middle, so the words sit underneath it. */}
      <div className="absolute inset-0 flex items-end justify-center p-6 pb-8 text-center">
        <div>
          {state === "unset" ? (
            <>
              <p className="mt-3 font-display text-2xl">Your latest sermon will show here</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[#f1e6d2]">Sample: add your YouTube channel ID in the church settings and your newest video appears by itself.</p>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-2xl">Watch on YouTube</p>
              {channelUrl && <a href={channelUrl} target="_blank" rel="noopener" className="btn btn-light mt-4">Open our channel</a>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { hero, welcome, verse, cards } = home;
  return (
    <>
      {/* Hero: a drawn valley at sunrise (public/images/hero-valley.svg). Replace the file with your own picture if you like. */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-valley.svg" alt="" width={1600} height={900} className="hero-zoom absolute inset-0 -z-20 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 -z-10" style={{ background: "var(--hero-overlay)" }} />
        <div className="mx-auto flex min-h-[460px] max-w-7xl flex-col justify-end px-4 pb-14 pt-24 text-cream sm:min-h-[540px] sm:px-6">
          <p className="rise eyebrow !text-[#f1e6d2]">{hero.eyebrow}</p>
          <h1 className="rise mt-2 max-w-4xl font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl" style={{ ["--d" as string]: "80ms" }}>{hero.title}</h1>
          <p className="rise mt-4 max-w-2xl text-lg text-[#f1e6d2]" style={{ ["--d" as string]: "160ms" }}>{hero.text}</p>
          <div className="rise mt-7 flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "240ms" }}>
            <Link href={hero.buttonLink} className="btn btn-light">{hero.buttonLabel} <Icon name="arrow" className="h-4 w-4" /></Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f1e6d2]/60 px-4 py-2 font-semibold"><Icon name="clock" className="h-4 w-4" /> {site.service.label}</span>
          </div>
        </div>
      </section>

      {/* Service time and place */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6" aria-label="Service time and place">
        <div data-reveal className="grid gap-5 rounded-3xl border border-line bg-panel p-6 sm:grid-cols-3 sm:p-8">
          <div className="flex gap-3"><Icon name="clock" className="mt-1 h-5 w-5 shrink-0 text-accent" /><p><b className="block">When</b>{site.service.label}</p></div>
          <div className="flex gap-3"><Icon name="map" className="mt-1 h-5 w-5 shrink-0 text-accent" /><p><b className="block">Where</b>{site.venue.name}, {site.addressLine}</p></div>
          <div className="flex items-center sm:justify-end"><Link href="/plan-your-visit/" className="btn btn-primary">Plan your visit <Icon name="arrow" className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* Welcome text and cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div data-reveal className="max-w-3xl">
          <p className="eyebrow">Welcome</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{welcome.title}</h2>
          <p className="mt-4 text-lg text-muted">{welcome.text}</p>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <li key={c.link} data-reveal>
              <Link href={c.link} className="card block h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-panel-strong text-ink"><Icon name={c.icon} /></span>
                <span className="mt-4 block font-display text-xl font-semibold">{c.title}</span>
                <span className="mt-1 block text-muted">{c.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Latest sermon */}
      <section className="bg-panel">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div data-reveal>
            <p className="eyebrow">Sermons</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Latest sermon</h2>
            <p className="mt-4 text-lg text-muted">Missed a Sunday, or want to hear it again? Watch our most recent message here, or browse them all.</p>
            <Link href="/sermons/" className="btn btn-primary mt-6">All sermons <Icon name="arrow" className="h-4 w-4" /></Link>
          </div>
          <div data-reveal>
            <Suspense fallback={<div className="aspect-video animate-pulse rounded-3xl bg-panel-strong" />}>
              <LatestSermon />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">What&rsquo;s on</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Upcoming events</h2>
          </div>
          <Link href="/events/" className="btn btn-ghost">All events <Icon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <Suspense fallback={<div className="mt-6 h-32 animate-pulse rounded-3xl bg-panel" />}>
          <EventsCalendar limit={3} row />
        </Suspense>
      </section>

      {/* Verse */}
      <section className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
        <figure data-reveal className="rounded-3xl border-l-4 border-accent bg-panel p-8 sm:p-10">
          <blockquote className="font-display text-2xl leading-relaxed">&ldquo;{verse.text}&rdquo;</blockquote>
          <figcaption className="mt-4 font-semibold text-muted">{verse.reference}</figcaption>
        </figure>
      </section>
    </>
  );
}
