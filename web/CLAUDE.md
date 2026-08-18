# web/ — React SPA

Reference for the browser client. The API it talks to is documented in `server/CLAUDE.md`; read
that first for anything about the data model, since almost every type here mirrors a server DTO.

**Stack:** React 19, TypeScript ~6.0, Vite 8, React Router 7 (`BrowserRouter`), Leaflet for maps,
oxlint. **No state library, no data-fetching library, no UI kit, no CSS framework, no chart
library** — all four are hand-rolled and that is deliberate. 55 pages, 78 components, 49 service
modules.

```bash
cd web && npm run dev     # http://localhost:5173, expects the API at http://localhost:5261
npm run build             # tsc -b → vite build → prerender (see §8)
npm run lint              # oxlint
```

---

## 1. Two clients, and this one is ahead

The repo holds two independent frontends against the same API: the Expo app at the repo root and
this SPA. **They share no code** — each has its own `services/` and `types/`, duplicated by hand.

Web has 49 service modules to the Expo app's 32. Everything below exists only on web:

> greenhouse (all 9 services), neighbours, breeding events, livestock movements, livestock kinds,
> configuration/feature switches, seeds, harvest chemicals, harvest seeds, harvest trees,
> production movements, Google sign-in.

The Expo app has four web lacks: `plant-scan-service`, `plant-scan-history-service`,
`weather-service`, `notification-storage`. (The scanner route exists here but is commented out in
`App.tsx`.)

So: **do not assume a feature here exists on mobile, and do not "sync" the two by copying** unless
that is the actual request. When a shared derivation matters, it is factored into `src/config/`
(e.g. `harvest-analysis.ts` — "kept out of the pages so the web and mobile detail screens can't
drift apart on the maths").

---

## 2. Layout and import conventions

```
src/
  pages/        route-level screens, one per route. Big ones get a folder with their helpers.
  components/   shared UI. farm/ (domain CRUD parts), ui/ (generic), layout/, charts/,
                harvest/, market/, neighbours/, icons/.
  contexts/     the six providers (§4).
  services/     one module per API resource; thin wrappers over apiFetch.
  types/        one module per resource, mirroring the server DTOs in camelCase.
  config/       domain mapping: names → labels, icons, options, and pure derivations (§9).
  locales/      en.json / ka.json / de.json.
  routes/       the three route guards.
  assets/       artwork, organised by domain (goods/, animals/, trees/, properties/, icons/).
```

- **`@/` is the alias for `src/`** (Vite + tsconfig paths). There are **zero** `../` imports in the
  codebase — cross-directory always goes through `@/`, and `./` only for same-directory siblings.
  Two imports at the bottom of `App.tsx` break this; they are the exception, not the pattern.
- TS is strict about unused code: `noUnusedLocals` and `noUnusedParameters` are on, plus
  `verbatimModuleSyntax` (so **type-only imports must say `import type`**) and `erasableSyntaxOnly`
  (no enums, no parameter properties — use union types and plain objects).
- Every domain type is a `type` alias, never an `interface`. Enums from the server arrive as
  **string literal unions** (`type StockUnit = 'Kilogram' | 'Quantity' | 'Liter'`) because the
  server serializes enums by name. Catalog-backed fields are plain `string`, not unions, since
  users add their own kinds — see the comment at the top of `types/stock.ts`.
- Input types are derived, not re-declared: `export type StockInput = Omit<Stock, 'id' | 'isDeleted'>`.

---

## 3. Routing

`App.tsx` is the whole route table. Three nested guards, in this order:

| Guard | File | Behaviour |
|---|---|---|
| `PublicOnlyRoute` | `routes/public-route.tsx` | Signed-in visitors bounce off `/login` to `/main`. |
| `ProtectedRoute` | `routes/protected-route.tsx` | Everything else redirects to `/login`. Renders `null` while `isLoading`. |
| `ConfigRoute` | `routes/config-route.tsx` | Gates a route group behind a tenant feature switch. |

**`/` is the marketing page and sits outside both guards** — signed-in visitors can still read it.
The app proper lives under `/main`. Unmatched paths redirect to `/404`.

`ConfigRoute` has two deliberate non-obvious behaviours, both about not locking a tenant out:
- while `!loaded` it renders `null` (before the settings arrive every name reads as off, and
  redirecting on that would bounce someone off a page they are entitled to);
- when `loadError` it renders `<Outlet/>` — a failed settings request must not become a lockout.
  The sidebar still stops offering the link.

Gating a feature area means **two** edits: a `ConfigRoute` wrapper in `App.tsx` *and*
`requiresConfig` on the nav entry in `config/nav-items.ts`. Hiding the sidebar link alone leaves
the URL reachable by bookmark or old link.

The five switch names are exported as constants from `types/configuration.ts` — import those,
never a string literal. Note **`CROP_FARMING_CONFIG` is `'CropFarming'`, PascalCase**, while the
older four (`greenhouse`, `livestock`, `fruitstock`, `marketplace`, `calendar`) are lowercase.

### Known dead/orphaned routes
- `src/pages/farm/livestock-balance/` (6 files) is **unreachable** — its route and import are
  commented out in `App.tsx`, and the commented import path is stale (the file moved into a folder).
- `/farm/fruits/products` and `/farm/fruits/products/:id` are live routes whose nav entry is
  commented out in `nav-items.ts` — reachable only by URL or from within the fruits page.
- `/scanner` is commented out in both.

---

## 4. Providers and contexts

`main.tsx` nests six providers; **the order is load-bearing** and `entry-prerender.tsx` repeats it
exactly (a different order would be different markup):

```
ThemeProvider → FontSizeProvider → LanguageProvider → AuthProvider → ConfigurationProvider → CurrencyProvider
```

`ConfigurationProvider` is inside `AuthProvider` because the settings live in the signed-in user's
own tenant database and are refetched whenever `user` changes.

| Context | Hook | State | Persists to |
|---|---|---|---|
| auth | `useAuth` | `user`, `isAuthenticated`, `isLoading`, sign-in/up/out, `updateProfile`, `refreshUser` | `localStorage['farm.auth.session']` (token + user) |
| configuration | `useConfiguration` | `configurations`, `loaded`, `loadError`, `isOn(name)`, `setValue` | server only |
| language | `useLanguage` | `language`, `t(key, params)` | `localStorage['farm.language']`, default **`ka`** |
| theme | `useTheme` | `theme`, `toggleTheme` | `localStorage['farm.theme']`, falls back to OS |
| fontSize | `useFontSize` | `scale` ∈ 0.875/1/1.125/1.25 | `localStorage['farm.fontScale']` |
| currency | `useCurrency` | `currency`, `formatPrice` | not persisted; resets to GEL each load |

Every hook throws if used outside its provider. Notes:

- **Session restore + daily bonus.** `AuthProvider`'s mount effect reads the stored session, then
  fires `POST /api/auth/daily-bonus` **off the awaited path**. It has to be here, not at sign-in: a
  token lasts a week, so someone opening the app daily would otherwise collect a daily bonus weekly.
  The call is idempotent server-side; failures are swallowed.
- **Currency is display-only.** Prices are entered and stored in GEL; `GEL_PER_USD = 2.7` is a
  hardcoded constant, not a live FX rate.
- **Font scaling works by setting `documentElement.style.fontSize` as a percentage.** Every size in
  the app is therefore in `rem`. A new stylesheet using `px` for text silently opts out of the
  accessibility control.
- The sidebar keeps its own collapsed-group state in `localStorage['farm.sidebar.collapsed']`,
  storing *collapsed* keys so a group added later still starts open.

---

## 5. Services and data fetching

`services/api-client.ts` is the whole networking layer — ~90 lines, no library.

- `API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5261'`, **baked in at build time**.
- `apiFetch<T>(path, init)` — sets `Content-Type: application/json` and the bearer token, throws
  `ApiError(status, body)` on non-2xx, returns `undefined` for 204.
- `uploadImage(file, endpoint)` / `postImageFormData` — for multipart. **Never set `Content-Type`
  on these**; fetch has to add its own boundary.
- `resolveAssetUrl(path)` — prefixes a server-relative `/uploads/...` path with `API_URL`; passes
  absolute URLs through. Every `<img src>` for user content goes through it.
- The JWT lives in a module-level variable, kept in sync by `AuthProvider` via `setAuthToken`, so
  no request pays a storage read.

**There is no cache, no request dedupe, no retry, no global loading state.** The pattern every page
follows by hand:

```tsx
const [rows, setRows] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => { load(); }, []);

async function load() {
  setLoading(true); setError(null);
  try { setRows(await getThings()); }
  catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  finally { setLoading(false); }
}
```

Pages needing several resources use one `Promise.all` in `load()` (see `balance-page.tsx`, which
fetches ten). **After a mutation, pages patch local state rather than refetching** —
`setRows(prev => isNew ? [...prev, saved] : prev.map(r => r.id === saved.id ? saved : r))`.

Service modules are thin and typed, one exported function per endpoint, with the query-string
shape encoded in the signature (`getStock(includeDeleted = false)`).

---

## 6. Internationalisation

Three languages: **`ka` (Georgian) is the default**, plus `en` and `de`. Dictionaries are plain
JSON imported at build time and bundled — no i18n library, no lazy loading.

- `t('a.b.c')` walks the nested JSON by dots. **A missing key renders the key itself**, silently —
  there is no dev warning, so a typo ships as `farm.stcok` on screen.
- `t(key, { name })` interpolates `{name}` placeholders.
- **All three locale files must stay in sync.** Currently 1158 leaf keys each across 50 top-level
  sections; `ka.json` carries one orphan (`balance.title`) that `en`/`de` lack. Adding a key to one
  file only is the most common way to ship a visible bug here.
- Dates and times are formatted by `components/ui/date-utils.ts` with **the app's own month and
  weekday tables**, never `toLocaleDateString`/`toLocaleTimeString` — the browser locale is usually
  not Georgian even when the in-app language is. English uses a 12-hour clock; ka and de use 24-hour;
  German writes the day as an ordinal (`19. Juli`).
- `parseIsoDay` vs `parseIsoDate`: use **`parseIsoDay`** for a field that carries a plain date but is
  stored as a timestamp (e.g. `AnimalProduction.collectionDate`, saved at UTC midnight). Parsing it
  as a datetime reads back as the previous day for anyone west of UTC — which also moves records
  across year and quarter boundaries when reports are filtered.

---

## 7. Styling and the design system

Plain CSS files imported by the component that owns them. No CSS modules, no Tailwind, no
CSS-in-JS. Class names are global and conventional, so **check for collisions before inventing one**.

- `src/index.css` holds the theme tokens and a small global kit (`.btn`, `.btn-secondary`,
  `.field`, `.field-row`, `.error-banner`, `.field-checkbox`).
- **Theming is `:root` custom properties keyed off `data-theme` on `<html>`.** Both palettes are
  defined in full; anything that was once a literal (`#fff` panels, black shadows, overlay scrims)
  is a token now, so the two themes stay in step. `--color-dark` is a legacy name meaning *primary
  text* — it goes light in dark mode, and keeps the name because ~20 stylesheets reference it.
  **Never hardcode a colour**; add a token to both blocks instead.
- `components/farm/farm-crud.css` (30 KB) is the shared page/card stylesheet — **38 files import it**.
  It owns `.page-header`, `.page-title`, `.back-link`, `.add-button`, `.state-box`, `.retry-button`,
  `.entity-tile*` (the standard card grid), `.list-card*`, `.land-tile*`, `.balance-*`, `.limit-hint`,
  `.form-title`, `.form-fields`, `.empty-state`. Reuse these rather than styling a new page from scratch.
- The Georgian display face (`BPG Boxo`) is `@import`ed from a CDN and **must stay the first rule in
  `index.css`** — `@import` is only honoured before any other statement. Form controls get
  `font: inherit` explicitly, since they do not inherit fonts on their own.
- Charts are hand-drawn (`components/charts/bar-chart.tsx`, `grouped-bar-chart.tsx`) — SVG/DOM, a
  `niceCeil` axis helper, hover tooltips, click-to-select. No chart library is installed.
- Modals go through `components/ui/modal.tsx` (`size: 'default' | 'wide' | 'full'`), with
  `ConfirmModal` for generic yes/no and `ConfirmDeleteModal` for deletions. Note `.btn-danger`,
  `.modal-title`, `.modal-body-text` and `.modal-actions` are defined in `ui/modal.css`, not
  `index.css` — using them outside a component that imports it leaves them unstyled.

---

## 8. The landing page, prerendering and SEO

The root URL is the only page a stranger or a crawler can read, and a lot of the build exists for it.

- **`npm run build` prerenders it.** `vite build --ssr src/entry-prerender.tsx` then
  `scripts/prerender.mjs` injects the rendered HTML into `dist/index.html`'s `<div id="root">`.
  The script **throws loudly** if it cannot find that div — a build that silently stopped
  prerendering would look fine locally and take the whole indexable body with it.
- **The app still boots with `createRoot`, not `hydrateRoot`, and that is intentional.** The
  language is read from `localStorage` during the first render, so a visitor who chose English
  would hydrate an English tree onto a Georgian one and React would throw the root away anyway —
  same work plus a console full of mismatch errors. The baked markup still earns its keep by
  painting before the ~950 kB bundle finishes parsing.
- `entry-prerender.tsx` imports `LandingPage` **directly, not through `App`**: App's route table
  pulls in the map page, and Leaflet touches `window` at import time, which crashes in Node. The
  prerender script stubs `localStorage` and `matchMedia` for the three `useState` initialisers that
  run during render.
- `index.html` carries a **static** Georgian head (title, description, canonical, robots, OG,
  Twitter, theme-color) so a crawler that never runs the bundle still reads a complete one.
  `useLandingSeo` in `landing-page.tsx` rewrites those tags in place when the language changes, and
  the page injects a schema.org JSON-LD graph. **If you change the Georgian copy in
  `locales/ka.json` under `landing.seo.*`, change `index.html` to match** — two descriptions that
  disagree is worse than either alone.
- An inline script in `<head>` applies the stored theme **before first paint**, duplicating
  `theme-context.tsx`'s logic (same storage key, same OS fallback). Keep the two in sync.
- `scripts/optimize-images.mjs` re-encodes landing assets (icons to ≤512 px, the hero photo to
  WebP). `sharp` is deliberately **not** a dependency — `npm install --no-save sharp`, run it, drop it.
- `public/favicon.svg` is an unused starter-template leftover; the real icon is `public/logo.png`.

---

## 9. `src/config/` — the domain-mapping layer

Not app configuration. This is where server data becomes display, and where shared pure logic
lives, so pages stay thin and mobile can borrow the maths.

| Module | Job |
|---|---|
| `stock-kinds` / `fruit-kinds` / `livestock-kinds` / `seed-kinds` | `NAME → icon`, `NAME → translation key`, unit options, `isBuiltIn`. Each exports `xTypeLabel(name, t)` and `xKindImage(name)` that **fall back to the raw name and a generic icon** for user-added kinds. |
| `nav-items` | The sidebar/dashboard tree + `isNavItemVisible(item, plan, isOn)`. |
| `page-help` | Route pattern → `help.<key>`; **order matters**, static segments before parameterised. |
| `plan-benefits` | `isPlanLimitError` (HTTP 402), `isAtLimit`, `isOverLimit`. |
| `production` | Production-type and unit labels, `meatProductionTypeName(groupName, t)`, and `RETIRED_PRODUCTION_TYPE_NAMES` (Meat/Leather — still labelled, no longer offered). |
| `harvest-analysis` | Planned-vs-actual yield rows and harvest economics. Pure; shared with mobile. |
| `report-labels` | Turns the report API's raw names into labels and icons per `ReportGoodKind`. |
| `territory` | Farm boundary JSON → map polygons. |
| `market-listing`, `harvest-status`, `harvest-target`, `crop`, `age`, `configuration-labels` | Option lists and label maps. |
| `landing` | The marketing page's packet/pricing data, reused by `PacketsModal` so caps are stated once. |

The rule this encodes: **the server sends raw catalog names, never display text** — translations and
artwork are client-side, and duplicating either server-side would fork them.

---

## 10. The standard CRUD page recipe

`pages/farm/stock-page.tsx` is the cleanest example. Copy its shape:

1. `useLanguage()` for `t`, `useAuth()` for `user` (plan caps).
2. `load()` + `loading`/`error` state as in §5.
3. `isAtLimit(user?.maxStockKinds, rows.length)` gates **add**;
   `isOverLimit(...)` gates **edit** — only a plan downgrade puts a count past the cap, and that is
   the one state where the server also refuses edits. Being exactly full still allows editing.
4. The add button stays **enabled** at the cap; clicking it opens `PacketsModal` with the cap
   message rather than doing nothing.
5. The form modal takes `onLimitReached` — the client's own check runs against a possibly stale
   `user`, so **the server has the last word**: a 402 raises the same packets modal.
6. Render `.entity-tile-grid` of `.entity-tile` cards, each with a `CardMenu` (edit/delete).
7. `ConfirmDeleteModal` with a **custom `body`** wherever deletion is a soft delete — the default
   "cannot be undone" line overstates what happens to the history behind a stock, fruit or herd.
8. `handleSaved(item, isNew)` patches local state; no refetch.

---

## 11. Build, deploy, verify

- `npm run build` = `tsc -b` → `vite build` → prerender. The typecheck is part of the build, so a
  type error fails it. For a fast check on its own: `npx tsc -b`.
- `npm run lint` — oxlint with the `react`, `typescript` and `oxc` plugins;
  `react/rules-of-hooks` is an error, `react/only-export-components` a warning.
- **`VITE_API_URL` is compiled into the bundle.** `.env` is gitignored (`.env.example` is the
  template), so a build made without it silently falls back to `http://localhost:5261` — the local
  `dist/` in this repo has exactly that baked in. The production build runs on the deploy box
  (`.github/workflows/deploy.yml` → `dotnet publish` + `vite build`), so that box needs its own
  `.env`; that file is outside the repo and cannot be verified from here.
- `VITE_GOOGLE_CLIENT_ID` blank disables the "Continue with Google" button. The GIS script is
  loaded on demand by `services/google-identity.ts`, once, and yields an ID token that the backend
  verifies at `POST /api/auth/google`.
- The deploy health check expects `/` → 200 and `/api/farms` → **401** (401 proves auth is enforced).
- There are **no tests** — no runner, no test files. Verification is typecheck + lint + clicking
  through. `.claude/skills/verify/SKILL.md` at the repo root covers the Expo app, not this one.

---

## 12. Traps

1. **A missing translation key renders as the key.** No warning, no fallback language. Add to all
   three locale files together.
2. **`type` imports must be `import type`** (`verbatimModuleSyntax`), and **enums are unavailable**
   (`erasableSyntaxOnly`). Use string-literal unions.
3. `noUnusedLocals`/`noUnusedParameters` are errors, so a half-finished edit fails the build rather
   than warning.
4. **Gating a feature needs both the `ConfigRoute` and the `requiresConfig` nav flag.** Either alone
   leaves a hole.
5. **`CropFarming` is PascalCase**; the other switch names are lowercase. Use the constants.
6. Class names are global. `farm-crud.css` alone defines ~70 of them and is imported by 38 files.
7. Never hardcode a colour or a `px` font size — tokens and `rem`, or theming and the font-scale
   control silently break.
8. Don't set `Content-Type` on multipart uploads.
9. `entry-prerender.tsx` must keep `main.tsx`'s exact provider order, and must not reach anything
   that touches `window` at import time (Leaflet is why it bypasses `App`).
10. Soft-deleted rows are absent from list endpoints. A page that must *name* a historical
    reference has to pass `includeDeleted` — `getStock(true)`, `getLivestock(true)` — and the
    `isDeleted` flag only ever arrives on those calls.
11. `src/pages/farm/livestock-balance/` is dead code reachable from nothing; don't assume edits
    there are visible anywhere.
