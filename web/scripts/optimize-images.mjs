/**
 * Re-encodes the images the public landing page loads.
 *
 * The page was shipping 5.5 MB of them: a 2.6 MB PNG photograph behind the hero, and illustrated
 * icons drawn at 2000x2000 to be displayed at twenty pixels. That is the page's Core Web Vitals
 * score, so it is its search ranking.
 *
 * Two jobs, and they are deliberately different:
 *
 *   - The icons keep their names and their format. A dozen files across the app import them, and
 *     none of those imports should have to care that the file behind them got smaller. Shrinking
 *     to 512px and quantising the palette is invisible at every size the app draws them.
 *   - The hero photograph becomes WebP, because PNG is the wrong container for a photograph and no
 *     amount of quantising fixes that. Only two files import it, so the rename is cheap.
 *
 * sharp is not a dependency of this project: it is a large native package for a job that runs
 * about once a year, when someone adds an asset. Install it for the run and drop it again.
 *
 *   npm install --no-save sharp
 *   node scripts/optimize-images.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ASSETS = fileURLToPath(new URL('../src/assets/', import.meta.url));
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));

/**
 * The largest any of these is ever drawn is the 188px icon in a "what you can manage" row, so 512
 * covers even that on a 2x screen. Everything else on the page draws them between 19 and 64px.
 */
const ICON_MAX = 512;

/** Icons, by directory. Names and extensions are preserved — nothing that imports them changes. */
const ICONS = [
  'logo.png',
  'seed.png',
  ...['calendar', 'camera', 'farm', 'greenhouse', 'harvest', 'map', 'market', 'report'].map(
    (name) => `icons/${name}.png`
  ),
  ...['animals', 'balance', 'equipment', 'fruits', 'land', 'plants'].map((name) => `properties/${name}.png`),
  ...['cabbage', 'cucumber', 'tomato'].map((name) => `goods/${name}.png`),
  ...['chicken', 'cow', 'goat', 'sheep'].map((name) => `animals/${name}.png`),
];

/* The favicon, the apple-touch icon and the og:image all point at this one. Its 512x512 is quoted
   in index.html's og:image:width, so it is re-encoded at that size rather than resized. */
const PUBLIC_ICONS = ['logo.png'];

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`;

let before = 0;
let after = 0;

/** Shrinks to `ICON_MAX` (never up), then re-encodes as a palette PNG. Kept only if it won. */
async function optimiseIcon(root, name) {
  const file = path.join(root, name);
  const original = await readFile(file);
  const { width, height } = await sharp(original).metadata();

  const encoded = await sharp(original)
    .resize({
      width: Math.min(width, ICON_MAX),
      height: Math.min(height, ICON_MAX),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer();

  before += original.length;

  if (encoded.length >= original.length) {
    after += original.length;
    console.log(`  = ${name.padEnd(28)} ${kb(original.length)} — already smaller, left alone`);
    return;
  }

  await writeFile(file, encoded);
  after += encoded.length;
  const size = await sharp(encoded).metadata();
  console.log(
    `  ✓ ${name.padEnd(28)} ${kb(original.length)} → ${kb(encoded.length)}` +
      `  (${width}x${height} → ${size.width}x${size.height})`
  );
}

/**
 * The hero backdrop. It sits behind a scrim with the headline over it, so it is the one image on
 * the page whose fidelity nobody can inspect — quality is set accordingly.
 */
async function optimiseHero() {
  const source = path.join(ASSETS, 'farmland-wide.png');
  const target = path.join(ASSETS, 'farmland-wide.webp');
  const original = await readFile(source);
  const { width, height } = await sharp(original).metadata();

  const encoded = await sharp(original)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toBuffer();

  await writeFile(target, encoded);
  before += original.length;
  after += encoded.length;

  const size = await sharp(encoded).metadata();
  console.log(
    `  ✓ ${'farmland-wide.png → .webp'.padEnd(28)} ${kb(original.length)} → ${kb(encoded.length)}` +
      `  (${width}x${height} → ${size.width}x${size.height})`
  );
  console.log('    delete farmland-wide.png once nothing imports it');
}

console.log('\nsrc/assets');
for (const name of ICONS) await optimiseIcon(ASSETS, name);

console.log('\npublic');
for (const name of PUBLIC_ICONS) await optimiseIcon(PUBLIC, name);

console.log('\nhero');
await optimiseHero();

console.log(`\n${kb(before)} → ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)\n`);
