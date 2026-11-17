import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { SearchResults } from "@/components/SearchResults";

export const metadata = { title: "Search", robots: { index: false, follow: true }, alternates: { canonical: "/search/" } };

export default function SearchPage() {
  return (
    <>
      
      <PageHero eyebrow="Search" title="Search the site" crumbs={[{ label: "Search", href: "/search/" }]} />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-panel" />}>
          <SearchResults />
        </Suspense>
      </section>
    </>
  );
}
