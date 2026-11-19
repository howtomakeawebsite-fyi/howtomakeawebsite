import { site, mainNav } from "@/config/site";
import { getPages } from "@/lib/content";
import { faqItems } from "@/lib/faq";

/**
 * /llms.txt: a short, plain-text guide to the site for AI assistants (see llmstxt.org).
 * It is built from the church settings and the page files, so it stays up to date by itself.
 */
export function llmsTxt() {
  const pages = getPages().filter((p) => p.section !== "hidden");
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Key facts",
    "",
    `- Service: ${site.service.label}`,
    `- Address: ${site.venue.name}, ${site.addressLine}`,
    `- Email: ${site.email}`,
    `- Phone: ${site.phone}`,
    `- Website: ${site.url}/`,
    "",
    "## Pages",
    "",
    `- [Home](${site.url}/): welcome, service time, latest sermon and upcoming events`,
    ...pages.map((p) => `- [${p.title}](${site.url}/${p.slug}/): ${p.description ?? ""}`),
    `- [Sermons](${site.url}/sermons/): sermon videos from our YouTube channel`,
    `- [FAQ](${site.url}/faq/): answers to common questions`,
    "",
    ...(faqItems.length ? ["## Frequently asked questions", "", ...faqItems.flatMap((f) => [`### ${f.q}`, "", f.a, ""])] : []),
    "## Menu",
    "",
    ...mainNav.map((n) => `- ${n.label}: ${site.url}${n.href}`),
    "",
  ];
  return lines.join("\n");
}
