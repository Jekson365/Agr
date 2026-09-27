import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.resolve(root, process.argv[2] ?? 'promo/social');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const formats = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

const server = await createServer({ root, logLevel: 'error', server: { port: 5189, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(new URL('social.html', base).href, { waitUntil: 'networkidle0' });

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
    await page.goto(new URL(`social.html?post=${slug}&format=${format}`, base).href, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
    });
    const file = path.join(dir, `${String(index + 1).padStart(2, '0')}-${slug}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, ...size } });
    process.stdout.write(`${path.relative(root, file)}\n`);
  }
}

await browser.close();
await server.close();
