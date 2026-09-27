import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ffmpeg from '@ffmpeg-installer/ffmpeg';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.resolve(root, process.argv[2] ?? 'promo/mtabari-promo.mp4');
const fps = Number(process.env.PROMO_FPS ?? 60);
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = await createServer({ root, logLevel: 'error', server: { port: 5188, hmr: false } });
await server.listen();
const url = new URL('promo.html?render', server.resolvedUrls.local[0]).href;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => typeof window.promoSeek === 'function');

const duration = await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
  return window.promoDuration;
});

mkdirSync(path.dirname(output), { recursive: true });

const encoder = spawn(
  ffmpeg.path,
  [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'image2pipe',
    '-framerate',
    String(fps),
    '-c:v',
    'png',
    '-i',
    '-',
    '-vf',
    'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '16',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-movflags',
    '+faststart',
    output,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] }
);

const finished = new Promise((resolve, reject) => {
  encoder.on('error', reject);
  encoder.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))));
});

const total = Math.round(duration * fps);

for (let frame = 0; frame < total; frame += 1) {
  await page.evaluate((time) => window.promoSeek(time), frame / fps);
  const image = await page.screenshot({ type: 'png', optimizeForSpeed: true });
  if (!encoder.stdin.write(image)) {
    await new Promise((resolve) => encoder.stdin.once('drain', resolve));
  }
  process.stdout.write(`\rframe ${frame + 1}/${total}`);
}

encoder.stdin.end();
await finished;
await browser.close();
await server.close();
process.stdout.write(`\n${output}\n`);
