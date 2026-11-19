import faq from "../../content/faq.json";

/** The questions and answers on the FAQ page, from content/faq.json (edit them in Pages CMS under "FAQ"). */
export type FaqItem = { q: string; a: string; linkLabel?: string; linkHref?: string };
export type FaqGroup = { title: string; items: FaqItem[] };

export const faqIntro: string = faq.intro ?? "";

/** Groups with at least one filled-in question. */
export const faqGroups: FaqGroup[] = (faq.groups ?? [])
  .map((g: FaqGroup) => ({ title: g.title ?? "", items: (g.items ?? []).filter((it) => it.q?.trim() && it.a?.trim()) }))
  .filter((g) => g.items.length > 0);

export const faqItems: FaqItem[] = faqGroups.flatMap((g) => g.items);
