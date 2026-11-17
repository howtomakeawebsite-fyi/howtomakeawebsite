import Link from "next/link";

/** The banner at the top of every page: a soft coloured panel with the page title. */
export function PageHero({ title, eyebrow, intro, crumbs }: { title: string; eyebrow?: string; intro?: string; crumbs?: { label: string; href: string }[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-panel" aria-hidden="true">
        <svg className="absolute -right-24 -top-24 h-96 w-96 text-panel-strong" viewBox="0 0 200 200" fill="currentColor"><circle cx="100" cy="100" r="100" /></svg>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="rise mb-3 text-sm">
            <ol className="flex flex-wrap gap-1 text-muted">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              {crumbs.map((c) => <li key={c.href}>/ <Link href={c.href} className="hover:underline">{c.label}</Link></li>)}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="rise eyebrow">{eyebrow}</p>}
        <h1 className="rise mt-1 max-w-4xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl" style={{ ["--d" as string]: "80ms" }}>{title}</h1>
        {intro && <p className="rise mt-4 max-w-2xl text-lg text-muted" style={{ ["--d" as string]: "160ms" }}>{intro}</p>}
      </div>
    </section>
  );
}
