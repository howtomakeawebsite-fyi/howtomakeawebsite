import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPage, getPages } from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { PageHero } from "@/components/PageHero";
import { pageMetadata, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

/** Every file in content/pages becomes a page here: about.mdx is shown at /about/. */

export function generateStaticParams() {
  return getPages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  const meta = pageMetadata({ title: page.seoTitle ?? page.title, description: page.description, path: `/${slug}/`, keywords: page.keywords });
  if (page.section === "hidden") meta.robots = { index: false };
  return meta;
}

// The address is read inside <Suspense> so moving between pages stays instant. Every page is still pre-built.
export default function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-16 sm:px-6"><div className="h-12 w-2/3 animate-pulse rounded-2xl bg-panel" /></div>}>
      <ContentPageBody params={params} />
    </Suspense>
  );
}

async function ContentPageBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  const path = `/${slug}/`;
  const structured = [
    webPageJsonLd({ title: page.seoTitle ?? page.title, description: page.description ?? "", path, type: slug === "contact" ? "ContactPage" : slug === "about" ? "AboutPage" : "WebPage" }),
    breadcrumbJsonLd([{ name: page.title, path }]),
  ];
  return (
    <>
      <JsonLd data={structured} />
      <PageHero title={page.title} crumbs={[{ label: page.title, href: path }]} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <article className="prose-church min-w-0 flow-root">
          <Mdx source={page.body} />
        </article>
      </div>
    </>
  );
}
