import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type PageMeta = {
  slug: string;
  title: string;
  /** "main" pages are listed for search engines. "hidden" pages still open, but stay out of search results. */
  section: string;
  description?: string;
  seoTitle?: string;
  keywords?: string[];
  draft?: boolean;
};
export type Page = PageMeta & { body: string; plain: string };

/** Rough plain-text version of markdown/MDX, for search and descriptions. */
export function toPlain(md: string) {
  return md
    .replace(/<[A-Z][^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`|]/g, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function describe(plain: string) {
  if (plain.length <= 158) return plain;
  const cut = plain.slice(0, 158);
  return cut.slice(0, cut.lastIndexOf(" ")) + "...";
}

/** Every page file in content/pages. Files whose name starts with "_" are templates and are ignored. */
export function getPages(): Page[] {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(PAGES_DIR, file), "utf8");
      const { data, content } = matter(raw);
      // The page's web address is its file name: about.mdx becomes /about/.
      const slug: string = file.replace(/\.mdx?$/, "");
      const plain = toPlain(content);
      return {
        slug,
        title: data.title ?? slug,
        section: data.section ?? "main",
        description: data.description || describe(plain),
        seoTitle: data.seoTitle || undefined,
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        draft: data.draft ?? false,
        body: content,
        plain,
      };
    })
    .filter((p) => !p.draft);
}

export function getPage(slug: string) {
  return getPages().find((p) => p.slug === slug);
}
