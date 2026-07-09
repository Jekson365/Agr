---
name: verify
description: Build/run/verify recipe for the farm app (Expo RN frontend + ASP.NET Core/Postgres backend, multi-tenant)
---

# Verifying changes in this repo

Two independently runnable halves: `server/` (ASP.NET Core API, per-user Postgres tenant DBs)
and the Expo Router app at the repo root.

## Backend (server/)

- Postgres must be reachable at `localhost:5432` (check with `(echo > /dev/tcp/localhost/5432)`).
  Connection info is in `server/appsettings.json` (`ConnectionStrings:master`, user `postgres`/`123`).
- `Server.exe` may already be running from a prior dev session — a `dotnet build`/`dotnet ef`
  will fail with an MSB3027 file-lock error if so. Check with
  `tasklist //FI "IMAGENAME eq Server.exe"` and confirm with the user before killing it.
- Start it: `cd server && dotnet run --urls http://localhost:5080` (background it, then poll
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:5080/api/auth/me` until it responds).
- **Auth is required for everything except `/api/auth/register` and `/api/auth/login`.**
  Register body is `{"name","email","password"}` (not `fullName`) — returns `{token, user}`.
  Registering (or logging in) provisions/migrates that user's own tenant database
  (`farm_user_{id}`), which is the real way to prove a new EF Core migration applies cleanly —
  no separate "run migrations" step needed.
- Controller routes are pluralized from the resource, e.g. `FarmsController` → `/api/farms`,
  `LivestockController` → `/api/livestock` (not `/api/livestocks`).
- Exercise the API directly with curl + the bearer token — fast, and covers validation paths
  (missing/duplicate params, cascading deletes) that are tedious to hit through the UI.
- EF migrations: `cd server && dotnet ef migrations add <Name> --context AppDbContext -o Migrations/Tenant`
  (needs the server stopped first, see above). Check the generated `AddColumn`/`AlterColumn`
  `defaultValue`s by hand — EF's auto-picked defaults (e.g. `0` for a new non-nullable int) are
  often wrong for backfilling existing rows.

## Frontend (repo root)

- `npx tsc --noEmit` — typecheck, fast, catches prop/type mismatches across screens/components.
- No emulator or browser-automation tool is set up in this environment. As a lighter-weight
  compile/render check: `npx expo start --web --port <port>` in the background, wait for
  "Web Bundled" in its log, then `curl http://localhost:<port>/(tabs)/<route>` — a 200 with no
  error boundary in the SSR shell plus a clean bundle log means the changed screens/components
  at least mount without throwing. This is **not** a substitute for actually tapping through the
  UI — note that gap explicitly in any verification report.
- Locale files: `locales/en.json` and `locales/ka.json` must be kept in sync — every new
  translation key needs an entry in both.
