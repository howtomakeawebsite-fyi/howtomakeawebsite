import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { pageMetadata, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { faqGroups, faqIntro, faqItems } from "@/lib/faq";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description: `Service time, address, parking, children, what to wear, what we believe and watching online: answers to common questions about ${site.name}.`,
  path: "/faq/",
  keywords: ["church FAQ", "church service times", "what to expect at church"],
});

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "questions";

/** The FAQ page. The questions and answers come from content/faq.json (Pages CMS: "FAQ"). */
export default function FaqPage() {
  return (
    <>
      <JsonLd data={[...(faqItems.length ? [faqJsonLd(faqItems)] : []), breadcrumbJsonLd([{ name: "FAQ", path: "/faq/" }])]} />
      <PageHero eyebrow="Questions" title="Frequently asked questions" intro={faqIntro} crumbs={[{ label: "FAQ", href: "/faq/" }]} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {faqGroups.length > 1 && (
          <nav aria-label="FAQ topics" className="mb-10">
            <ul className="flex flex-wrap gap-2">
              {faqGroups.map((g) => (
                <li key={g.title}><a href={`#${slug(g.title)}`} className="inline-block rounded-full bg-panel px-4 py-2 font-semibold hover:bg-panel-strong">{g.title}</a></li>
              ))}
            </ul>
          </nav>
        )}
        {faqGroups.length === 0 && (
          <p className="rounded-3xl border-2 border-dashed border-accent bg-panel p-6" role="note">No questions yet. Add them in Pages CMS under <b>FAQ</b>.</p>
        )}
        <div className="space-y-12">
          {faqGroups.map((g) => (
            <section key={g.title} id={slug(g.title)} className="scroll-mt-28" aria-labelledby={`h-${slug(g.title)}`}>
              {g.title && <h2 id={`h-${slug(g.title)}`} className="font-display text-3xl font-semibold">{g.title}</h2>}
              <div className="mt-5 divide-y divide-line rounded-3xl border border-line bg-panel">
                {g.items.map((it) => (
                  <details key={it.q} className="group px-5 py-1 sm:px-7">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                      <h3 className="font-sans text-lg font-semibold">{it.q}</h3>
                      <Icon name="chevron" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-5 text-[1.02rem]">
                      <p className="whitespace-pre-line">{it.a}</p>
                      {it.linkHref && it.linkLabel && (
                        <Link href={it.linkHref} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-accent-strong underline underline-offset-4">
                          {it.linkLabel} <Icon name="arrow" className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <p className="text-muted">
            Still have a question? <Link href="/contact/" className="font-semibold text-accent underline underline-offset-4">Get in touch</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
