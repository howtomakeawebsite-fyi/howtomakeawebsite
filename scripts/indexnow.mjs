#!/usr/bin/env node
/**
 * IndexNow: tells Bing (and the other IndexNow search engines, which Bing passes it on to) that pages are new
 * or changed, so they appear in Bing, ChatGPT search and Copilot quickly. Run it after the live site has updated.
 *
 *   npm run indexnow                  sends every address in your sitemap
 *   npm run indexnow -- /faq/ /about/ sends only these pages
 *   npm run indexnow:key              shows your key, your key file's address, and the address to paste into
 *                                     your browser to send your home page by hand
 *   npm run indexnow -- --new-key     makes a new key file of your own (then publish it before sending)
 *
 * The key is the name of a small text file in the public folder, for example public/0123abcd....txt,
 * and the file holds the key itself. If there is no key file yet, this script makes one for you.
 * The website address comes from NEXT_PUBLIC_SITE_URL or, if that is empty, from content/settings.json
 * ("Website address" in Pages CMS).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SAMPLE_URL = "https://howtomakeawebsite.fyi";
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);

/** Key files: a .txt file in public/ whose content is exactly its own name (8 to 128 letters, numbers or dashes). */
function keyFiles() {
  return fs
    .readdirSync(PUBLIC)
    .filter((f) => /^[a-zA-Z0-9-]{8,128}\.txt$/.test(f))
    .filter((f) => fs.readFileSync(path.join(PUBLIC, f), "utf8").trim() === f.replace(/\.txt$/, ""));
}

function makeKey() {
  const key = crypto.randomBytes(16).toString("hex");
  fs.writeFileSync(path.join(PUBLIC, `${key}.txt`), key);
  return key;
}

function siteAddress() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return { url: process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""), fromSettings: false };
  const settings = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "settings.json"), "utf8"));
  return { url: String(settings.url ?? "").trim().replace(/\/$/, ""), fromSettings: true };
}

// 1. The key.
if (flag("--new-key")) {
  for (const f of keyFiles()) fs.rmSync(path.join(PUBLIC, f));
  const key = makeKey();
  console.log(`New IndexNow key made: public/${key}.txt`);
  console.log("Publish it (commit the new file and wait for Vercel to finish), then run: npm run indexnow");
  process.exit(0);
}
let files = keyFiles();
if (!files.length) {
  const key = makeKey();
  console.log(`There was no IndexNow key file yet, so one was made for you: public/${key}.txt`);
  console.log("Publish it first (commit the new file and wait for Vercel to finish), then run: npm run indexnow");
  process.exit(0);
}
if (files.length > 1) console.log(`Note: there are ${files.length} key files in public/. Using ${files[0]}.`);
const KEY = files[0].replace(/\.txt$/, "");

// 2. The website address.
const { url: SITE, fromSettings } = siteAddress();
const keyLocation = `${SITE}/${KEY}.txt`;

if (flag("--key")) {
  console.log(`Your IndexNow key:  ${KEY}`);
  console.log(`Your key file:      ${keyLocation}`);
  console.log("To send your home page by hand, paste this into your browser's address bar:");
  console.log(`https://www.bing.com/indexnow?url=${SITE}/&key=${KEY}`);
  if (fromSettings && SITE === SAMPLE_URL) console.log('Note: the website address is still the sample. Change "Website address" in the church settings to your own domain.');
  process.exit(0);
}

if (!/^https:\/\/[^/]+\.[^/]+/.test(SITE) || /localhost|127\.0\.0\.1|\.vercel\.app/.test(SITE)) {
  console.log(`The website address "${SITE}" is not a live https:// address of your own.`);
  console.log('Fill in "Website address" in the church settings (Pages CMS), or set NEXT_PUBLIC_SITE_URL, and try again.');
  process.exit(1);
}
if (fromSettings && SITE === SAMPLE_URL) {
  console.log(`The website address in content/settings.json is still the sample (${SAMPLE_URL}).`);
  console.log('Change "Website address" in the church settings (Pages CMS) to your own domain, publish, and try again.');
  process.exit(1);
}

// 3. Check the key file is live, so Bing can find it.
try {
  const res = await fetch(keyLocation, { redirect: "follow" });
  const text = (await res.text()).trim();
  if (!res.ok || text !== KEY) {
    console.log(`Your key file is not live yet: ${keyLocation} answered ${res.status}.`);
    console.log("Publish the site (commit the key file and wait for Vercel to finish), then try again.");
    process.exit(1);
  }
} catch (e) {
  console.log(`Could not open ${keyLocation}: ${e.message}`);
  process.exit(1);
}

// 4. The addresses to send: the ones given, or every page in the sitemap.
const host = new URL(SITE).host;
let urlList = args.filter((a) => !a.startsWith("--")).map((a) => (a.startsWith("/") ? `${SITE}${a}` : a));
if (!urlList.length) {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) {
    console.log(`Could not read ${SITE}/sitemap.xml (answer ${res.status}).`);
    process.exit(1);
  }
  const sitemap = await res.text();
  urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => !/\.(webp|png|jpe?g|svg)$/i.test(u));
}
urlList = [...new Set(urlList)].filter((u) => {
  try { return new URL(u).host === host; } catch { return false; }
});
if (!urlList.length) {
  console.log(`No addresses on ${host} to send.`);
  process.exit(1);
}

// 5. Send. Bing's own address is used: the general IndexNow address can refuse brand-new domains (403).
const res = await fetch("https://www.bing.com/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
});
console.log(`IndexNow: sent ${urlList.length} address${urlList.length === 1 ? "" : "es"}, response ${res.status} ${res.statusText}`);
const help = {
  200: "Done. Bing Webmaster Tools shows them under IndexNow, usually within an hour.",
  202: "Done. Bing accepted them and is checking your key file.",
  400: "Bing did not understand the request. Please try again later.",
  403: "Bing could not confirm your key. Check that the key file opens in your browser, then try again.",
  422: "An address is not on your own domain, or has a typing mistake.",
  429: "Too many requests. Please wait a while and try again.",
};
if (help[res.status]) console.log(help[res.status]);
process.exit(res.ok ? 0 : 1);
