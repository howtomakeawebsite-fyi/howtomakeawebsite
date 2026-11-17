import Link from "next/link";

/** The "page not found" (404) page. */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">We couldn&rsquo;t find that page</h1>
      <p className="mt-4 text-lg text-muted">It may have moved, or the address may have a typing mistake. Try the search, or one of these:</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/plan-your-visit/" className="btn btn-ghost">Plan Your Visit</Link>
        <Link href="/contact/" className="btn btn-ghost">Contact</Link>
      </div>
    </section>
  );
}
