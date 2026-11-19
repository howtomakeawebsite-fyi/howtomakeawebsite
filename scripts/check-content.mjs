#!/usr/bin/env node
/**
 * Quick content checks:  npm run check
 *  1. The settings files are valid (a missing comma in a JSON file would break the site).
 *  2. Colour contrast of the main text/background pairs (WCAG AA = 4.5:1 for normal text).
 *     If you change the colours in src/app/globals.css, change them in the list below too.
 *  3. SEO basics on every public page: seoTitle (under 60 characters), description (120 to 160) and keywords.
 */
import fs from "node:fs";
import matter from "gray-matter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let problems = 0;

console.log("Settings files:");
for (const f of ["settings.json", "home.json", "team.json", "faq.json"]) {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, "content", f), "utf8"));
    console.log(`pass  content/${f}`);
  } catch (e) {
    problems++;
    console.log(`FAIL  content/${f}: ${e.message}`);
  }
}

console.log("\nSEO (titles, descriptions, keywords):");
let seoProblems = 0;
const pagesDir = path.join(ROOT, "content", "pages");
for (const f of fs.readdirSync(pagesDir).filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_"))) {
  const { data } = matter(fs.readFileSync(path.join(pagesDir, f), "utf8"));
  if (data.section === "hidden") continue;
  const issues = [];
  const title = data.seoTitle ?? "";
  const desc = data.description ?? "";
  if (!title) issues.push("no seoTitle");
  else if (title.length >= 60) issues.push(`seoTitle is ${title.length} characters (keep under 60)`);
  if (desc.length < 120 || desc.length > 160) issues.push(`description is ${desc.length} characters (aim for 120 to 160)`);
  if (!Array.isArray(data.keywords) || !data.keywords.length) issues.push("no keywords");
  if (issues.length) { seoProblems++; console.log(`FAIL  content/pages/${f}: ${issues.join("; ")}`); }
}
problems += seoProblems;
if (!seoProblems) console.log("pass  every public page has a good title, description and keywords");

const lum = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ["Light: text on cream", "#3b2a18", "#faf6ee"],
  ["Light: muted text on cream", "#6b5638", "#faf6ee"],
  ["Light: muted text on panel", "#6b5638", "#f3ebdc"],
  ["Light: muted text on sand", "#6b5638", "#e8dcc4"],
  ["Light: oak links on cream", "#8b6b3e", "#faf6ee"],
  ["Light: dark oak links on panel", "#6f5430", "#f3ebdc"],
  ["Light: cream on oak button", "#faf6ee", "#8b6b3e"],
  ["Light: text on sand", "#3b2a18", "#e8dcc4"],
  ["Dark: text on background", "#faf6ee", "#1d150d"],
  ["Dark: muted on background", "#d5c6a8", "#1d150d"],
  ["Dark: accent on background", "#d9b77e", "#1d150d"],
  ["Dark: accent on panel", "#d9b77e", "#2a1f14"],
  ["Dark: button text on accent", "#1d150d", "#d9b77e"],
  ["Footer: text on deep oak", "#e9dcc3", "#3b2a18"],
  ["Footer: small print on deep oak", "#d9c8a8", "#3b2a18"],
  ["Footer: link on deep oak", "#f2d9ac", "#3b2a18"],
];
console.log("\nContrast (AA needs 4.5):");
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) problems++;
  console.log(`${ok ? "pass" : "FAIL"}  ${r.toFixed(2)}  ${name}`);
}
console.log(problems ? `\n${problems} problem(s) found.` : "\nAll checks passed.");
process.exit(problems ? 1 : 0);
