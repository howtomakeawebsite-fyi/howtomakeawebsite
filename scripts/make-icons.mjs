#!/usr/bin/env node
/**
 * Makes the app icons and the social preview picture from the drawings in public/.
 * Run it again after you replace a drawing with your own:   npm run icons
 *
 *   public/brand/logo-mark.svg      -> public/icons/icon-192.png, icon-512.png, src/app/icon.png, src/app/apple-icon.png
 *   public/brand/icon-maskable.svg  -> public/icons/maskable-512.png (Android crops this one into a circle)
 *   public/images/og-card.svg       -> src/app/opengraph-image.png, public/opengraph-image.png (picture shown when a link is shared)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...parts) => path.join(ROOT, ...parts);

const jobs = [
  ["public/brand/logo-mark.svg", "public/icons/icon-192.png", 192, 192],
  ["public/brand/logo-mark.svg", "public/icons/icon-512.png", 512, 512],
  ["public/brand/logo-mark.svg", "src/app/icon.png", 256, 256],
  ["public/brand/logo-mark.svg", "src/app/apple-icon.png", 180, 180],
  ["public/brand/icon-maskable.svg", "public/icons/maskable-512.png", 512, 512],
  ["public/images/og-card.svg", "src/app/opengraph-image.png", 1200, 630],
  ["public/images/og-card.svg", "public/opengraph-image.png", 1200, 630],
];

for (const [from, to, w, h] of jobs) {
  await sharp(p(from), { density: 300 }).resize(w, h).png().toFile(p(to));
  console.log(`made ${to}`);
}
