# Focus

A personal operating system: one place for projects, hobbies, routines, events,
checklists, recipes, trips, links and notes.

The point is **returning**. You can disappear from a topic for months and come
back to its page knowing why it exists, where it stands, what is blocking it and
what the next action is.

**Live demo — <https://tomer0017.github.io/focus/>**

---

## Status: local-first, not production

Focus is **not production-ready** and stores nothing on a server.

- There is no database, no account, no login and no synchronisation.
- All data lives in the **browser's `localStorage`**, on the machine you are
  using. Clearing site data deletes it; another browser or device sees nothing.
- Data is not shared between visitors. The demo is seeded from mock data in
  `client/src/mocks/`, and your edits are stored as a diff against that seed.
- The Express server in `server/` is a scaffold. It is **not deployed** and is
  **not running** behind the demo — GitHub Pages serves static files only. The
  client makes no HTTP requests, so nothing fails when no server is running.
- Links, documents and reminders are in a mock state: reminders are **local**,
  meaning the app shows them the next time you open it. Nothing arrives while
  the tab is closed, and every screen that shows a reminder says so.

## Stack

- **Client** — React 19, TypeScript, Vite 7, React Router 7 (`HashRouter`),
  Bootstrap 5, i18next, Vitest.
- **Server** — Node, Express, TypeScript. Scaffold only; MongoDB is not
  connected.
- **Persistence** — `localStorage` behind a repository layer
  (`client/src/repositories/`), which is a stand-in for the API rather than the
  architecture.

## Languages and direction

Focus ships in **Hebrew (default) and English** from one codebase and one
layout. Direction comes from `document.documentElement.dir`, so the whole app
switches between RTL and LTR without a second stylesheet. Interface strings are
translated; your own text is never translated and carries `dir="auto"`, so an
English project title inside a Hebrew page still reads correctly.

## Local development

Requires Node `^20.19` or `>=22.12` (Vite 7).

```bash
npm run install:all     # install client + server dependencies
npm run dev:client      # Vite dev server  → http://localhost:5173
npm run dev:server      # Express          → http://localhost:5001
```

The server is optional — the client runs entirely without it.

## Checks, tests and build

```bash
npm run typecheck       # TypeScript, both sides
npm run lint            # ESLint (client)
npm test                # Vitest (client) + the server's notice
npm run test:client     # Vitest only
npm run check:links     # fails on placeholder destinations in client/src
npm run build           # production build, both sides
npm run build:client    # frontend only — what GitHub Pages deploys
```

Vitest covers the pure logic in `client/src/lib` plus the storage migrations,
translation parity and source hygiene. Rendering is deliberately not covered —
see `CLAUDE.md` → Testing. The **server has no tests**; its script is a notice.

To reproduce the deployed build locally, including the `/focus/` sub-path:

```bash
npm run build:client
npm --prefix client run preview     # → http://localhost:4173/focus/
```

## Deployment

`.github/workflows/deploy-pages.yml` builds `client/` on every push to `main`
and publishes `client/dist` with the official GitHub Pages actions.

Two things make the build work under a sub-path:

- `vite.config.ts` sets `base` to `/focus/` for production builds.
- The app uses `HashRouter`, so a deep link is
  `https://tomer0017.github.io/focus/#/trips/japan-2027`. GitHub Pages has no
  SPA rewrite rule, and without the fragment a refresh on a detail screen would
  return 404 before any JavaScript ran.

## Documentation

- `CLAUDE.md` — the operating manual: product rules, entities, layout and hard
  rules. Read it before changing anything.
- `docs/PROJECT_STATE.md` — living state, updated at the end of every task.
- `docs/ARCHITECTURE.md` — system shape, boundaries and the future auth story.
