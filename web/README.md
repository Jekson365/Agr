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
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build locally
