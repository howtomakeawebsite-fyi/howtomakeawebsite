import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import team from "../../content/team.json";
import { Icon } from "./Icon";
import { LiteYouTube } from "./LiteYouTube";

/**
 * Ready-made blocks you can drop into a page file (content/pages/*.mdx).
 * Write them on their own line, exactly like this:  <ServiceInfo />
 */

/** Service day, time and place, from the church settings. */
export function ServiceInfo() {
  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-panel p-6 sm:p-8">
      <p className="eyebrow">Join us</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        <li className="flex gap-3"><Icon name="clock" className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span><b className="block">When</b>{site.service.label}</span></li>
        <li className="flex gap-3"><Icon name="map" className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span><b className="block">Where</b>{site.venue.name}, {site.addressLine}</span></li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/plan-your-visit/" className="btn btn-primary">Plan your visit <Icon name="arrow" className="h-4 w-4" /></Link>
        <a /* eslint-disable-line @next/next/no-html-link-for-pages */ href="/calendar/sunday-service/" className="btn btn-ghost"><Icon name="calendar" className="h-4 w-4" /> Add to calendar</a>
      </div>
    </div>
  );
}

/** Google map of the church. Shows a friendly note until "Map search words" is filled in in the church settings. */
export function MapEmbed() {
  if (!site.mapEmbed) {
    return (
      <div className="not-prose my-8 overflow-hidden rounded-3xl border-2 border-dashed border-accent bg-panel" role="note">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/map-placeholder.svg" alt="" width={1200} height={420} className="h-48 w-full object-cover sm:h-64" />
        <div className="p-6">
          <p className="eyebrow">Sample</p>
          <p className="mt-1 font-display text-xl font-semibold">Your map will show here</p>
          <p className="mt-2 text-muted">Open the church settings and fill in &ldquo;Map search words&rdquo; with what you would type into Google Maps to find your church (for example the building name and street). The map then appears by itself.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="not-prose my-8">
      <div className="overflow-hidden rounded-3xl border border-line">
        <iframe title={`Map showing ${site.venue.name}`} src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-80 w-full border-0 sm:h-96" />
      </div>
      <a href={site.mapsLink} target="_blank" rel="noopener" className="btn btn-ghost mt-4"><Icon name="map" className="h-4 w-4" /> Open in Google Maps</a>
    </div>
  );
}

/** A dashed box that marks text or a section you still need to replace. Delete it when you are done. */
export function EditMe({ title = "Edit me", children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="not-prose my-8 rounded-3xl border-2 border-dashed border-accent bg-panel p-6" role="note">
      <p className="eyebrow">Sample text</p>
      <p className="mt-1 font-display text-xl font-semibold">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

/** A YouTube video inside a page:  <YouTube id="the 11 letters after v= in the video's address" title="What it is" /> */
export function YouTube({ id, title = "YouTube video" }: { id: string; title?: string }) {
  return <div className="not-prose my-8"><LiteYouTube id={id} title={title} /></div>;
}

/** A Bible verse:  <Scripture reference="Book 1:1" version="ESV" text="The words of the verse" /> */
export function Scripture({ reference, text, version }: { reference: string; text: string; version?: string }) {
  return (
    <figure className="not-prose my-8 rounded-3xl border-l-4 border-accent bg-panel p-6">
      <blockquote className="font-display text-xl leading-relaxed">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="mt-3 text-sm font-semibold text-muted">{reference}{version ? ` (${version})` : ""}</figcaption>
    </figure>
  );
}

/** Leaders and team, from content/team.json. A person with no photo gets a simple drawn avatar. */
export function TeamGrid() {
  return (
    <ul className="not-prose my-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {team.people.map((p, i) => (
        <li key={`${p.name}-${i}`} className="card p-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photo || "/images/avatar.svg"} alt={p.photo ? p.name : ""} width={160} height={160} loading="lazy" className="mx-auto h-28 w-28 rounded-full object-cover" />
          <p className="mt-4 font-display text-xl font-semibold">{p.name}</p>
          <p className="text-sm font-semibold text-muted">{p.role}</p>
          {p.bio && <p className="mt-3 text-[0.95rem]">{p.bio}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Phone, email and address, from the church settings. */
export function ContactDetails() {
  return (
    <ul className="not-prose my-8 grid gap-4 sm:grid-cols-3">
      <li className="card flex gap-3 p-5"><Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span className="min-w-0"><b className="block">Email</b><a className="break-words underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a></span></li>
      <li className="card flex gap-3 p-5"><Icon name="phone" className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span><b className="block">Phone</b><a className="underline underline-offset-4" href={site.phoneHref}>{site.phone}</a></span></li>
      <li className="card flex gap-3 p-5"><Icon name="map" className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span><b className="block">Address</b>{site.venue.name}, {site.addressLine}</span></li>
    </ul>
  );
}
