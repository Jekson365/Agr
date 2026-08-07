/**
 * Bakes the marketing page into dist/index.html.
 *
 * Vite ships a single empty `<div id="root">`, which is fine for the app — every route behind it
 * needs a signed-in session anyway — but the root URL is the one page meant to be read by
 * strangers, and half of them are robots. Googlebot runs the bundle and eventually sees the page;
 * Bing, the link-preview fetchers and the crawlers behind the AI answers largely do not. To all of
 * them this site currently says nothing at all.
 *
 * So the page is rendered once at build time and written into the shell. Nothing about how the app
 * boots changes: main.tsx still calls createRoot, which discards the baked markup and renders its
 * own. That is deliberate. Hydrating instead would be faster, but the language is read from local
 * storage during the first render, so a visitor who has chosen English would hydrate an English
 * tree onto a Georgian one and React would throw the whole root away — the same work, plus a
 * console full of mismatch errors. Meanwhile the baked markup still earns its keep for real
 * visitors: it paints before the 950 kB bundle has finished parsing.
 *
 * Run by `npm run build`, after the client build and the SSR build it reads.
 */

import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/* The three `useState` initialisers that run during render — theme, font scale, language — read
   storage and the OS colour-scheme preference. Stubbed rather than guarded in the contexts
   themselves: the app is a browser app, and it should not have to carry Node's problems around.
   Storage answering `null` to everything gives exactly the first-time visitor a crawler is. */
const noStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

globalThis.localStorage = noStorage;
globalThis.window = {
  localStorage: noStorage,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};

const SSR_BUNDLE = new URL('../dist-ssr/entry-prerender.js', import.meta.url);
const SHELL = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const ROOT = '<div id="root"></div>';

const { render } = await import(SSR_BUNDLE.href);
const html = render();

const shell = await readFile(SHELL, 'utf8');
if (!shell.includes(ROOT)) {
  /* Loud rather than silent: a build that quietly stopped prerendering would look fine locally and
     take the page's whole indexable body with it. */
  throw new Error(`prerender: could not find ${ROOT} in dist/index.html — has the shell changed?`);
}

await writeFile(SHELL, shell.replace(ROOT, `<div id="root">${html}</div>`));
await rm(fileURLToPath(new URL('../dist-ssr/', import.meta.url)), { recursive: true, force: true });

const bytes = Buffer.byteLength(html);
console.log(`prerendered / into dist/index.html (${(bytes / 1024).toFixed(0)} kB of markup)`);
