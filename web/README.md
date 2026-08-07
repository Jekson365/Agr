# Mtabari Web

Web client for the Mtabari farm app, built with React + TypeScript + Vite. Talks to the same ASP.NET Core API as the Expo mobile app (see `../server`).

## Getting started

```bash
npm install
npm run dev
```

Set the API base URL in `.env` (see `.env.example`):

```
VITE_API_URL=http://localhost:5261
```

## Structure

```
src/
  components/   shared UI (layout, form controls, ...)
  contexts/     React context providers (auth, ...)
  pages/        route-level screens
  routes/       route guards (protected/public)
  services/     API client + per-resource service functions
  types/        shared TypeScript types mirroring the server DTOs
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check, build for production, then prerender
- `npm run prerender` — the last step of the build, on its own
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build locally

## The public page

The root URL is the marketing page, and it is the only page a stranger — or a crawler — can read;
everything else redirects to sign-in. Two things about the build exist for its sake:

- **It is prerendered.** `npm run build` renders the page to HTML and writes it into
  `dist/index.html`, so what the server hands back is the page rather than an empty div. Googlebot
  runs the bundle and would have got there eventually; Bing, the link-preview fetchers and the
  crawlers behind the AI answers largely do not. See `scripts/prerender.mjs`, which explains why
  the app still boots with `createRoot` rather than hydrating.
- **Its images are kept small.** `scripts/optimize-images.mjs` re-encodes them; the header comment
  says how to run it. Worth doing after adding an asset — an untouched export from a design tool is
  routinely twenty times larger than it needs to be, and this page's load time is its ranking.

The head lives in `index.html` (static, so a crawler that never runs the bundle still reads a whole
one); `pages/landing-page.tsx` rewrites it to match the language on screen and carries the
schema.org graph.
