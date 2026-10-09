import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ffmpeg from '@ffmpeg-installer/ffmpeg';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const VIDEOS = { harvest: 'harvest-cycle', reports: 'harvest-reports', packets: 'packets', finances: 'finances', winery: 'winery' };
const video = Object.keys(VIDEOS).find((name) => process.argv.includes(`--${name}`)) ?? null;
const post = video === 'finances' || video === 'winery';
const square = post && process.argv.includes('--square');
const mobile = !video && process.argv.includes('--mobile');
const lang = process.argv.includes('--en') ? 'en' : 'ka';
const [outputArg] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const size = post
  ? { width: 1080, height: square ? 1080 : 1350 }
  : mobile
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
const variant = post ? `-${size.width}x${size.height}` : mobile ? '-mobile' : '';
const fileName = `mtabari-${video ? VIDEOS[video] : 'promo'}${variant}${lang === 'en' ? '-en' : ''}.mp4`;
const output = path.resolve(root, outputArg ?? `promo/${fileName}`);
const fps = Number(process.env.PROMO_FPS ?? 60);
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = await createServer({ root, logLevel: 'error', server: { port: 5188, hmr: false } });
await server.listen();
const format = mobile ? '&format=mobile' : square ? '&format=square' : '';
const query = `render&lang=${lang}${format}${video ? `&video=${video}` : ''}`;
const url = new URL(`promo.html?${query}`, server.resolvedUrls.local[0]).href;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ ...size, deviceScaleFactor: 1 });
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
