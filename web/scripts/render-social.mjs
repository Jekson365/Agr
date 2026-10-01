import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const lang = process.argv.includes('--en') ? 'en' : 'ka';
const coverOnly = process.argv.includes('--cover');
const [outArg] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const outDir = path.resolve(root, outArg ?? (lang === 'en' ? 'promo/social/en' : 'promo/social'));
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const formats = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};
const cover = { width: 1640, height: 720 };

const server = await createServer({ root, logLevel: 'error', server: { port: 5189, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();

async function capture(query, size, file) {
  await page.goto(new URL(`social.html?lang=${lang}&${query}`, base).href, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
  });
  await page.screenshot({ path: file, clip: { x: 0, y: 0, ...size } });
  process.stdout.write(`${path.relative(root, file)}\n`);
}

if (!coverOnly) {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(new URL(`social.html?lang=${lang}`, base).href, { waitUntil: 'networkidle0' });

  const slugs = await page.evaluate(() => [
    ...new Set(
      Array.from(document.querySelectorAll('.social-gallery-item'), (link) => new URL(link.href).searchParams.get('post'))
    ),
  ]);

  for (const [format, size] of Object.entries(formats)) {
    const dir = path.join(outDir, `${size.width}x${size.height}`);
    mkdirSync(dir, { recursive: true });
    await page.setViewport({ ...size, deviceScaleFactor: 1 });

    for (const [index, slug] of slugs.entries()) {
      const file = path.join(dir, `${String(index + 1).padStart(2, '0')}-${slug}.png`);
      await capture(`post=${slug}&format=${format}`, size, file);
    }
  }
}

const coverDir = path.join(outDir, 'cover');
mkdirSync(coverDir, { recursive: true });
await page.setViewport({ ...cover, deviceScaleFactor: 1 });
await capture('format=cover', cover, path.join(coverDir, 'facebook-cover.png'));

await browser.close();
await server.close();
