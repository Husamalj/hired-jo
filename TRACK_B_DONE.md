# Track B — Completed Work (for Claude / Codex on teammate machines)

> This file is a machine-readable summary of everything Track B has built.
> Read this before generating any code that touches data, scoring, jobs, leaderboard, or co-founder matching.

---

## Stack
- Next.js App Router (no `src/` prefix). All paths use `@/*` → project root.
- Tailwind v4 + custom CSS in `app/globals.css` (grain bg, glass, gold-grad, purple-grad, text-grad, animations).
- Prisma v7, provider `prisma-client`, output `app/generated/prisma`, driver adapter PrismaNeon (`@prisma/adapter-neon`).
- Database: Neon PostgreSQL (connection string in `DATABASE_URL` env var).
- In-memory global store (`lib/store.ts`) is the working data layer for leaderboard + cofounder during local dev / if DB is unavailable.

---

## Files Track B owns — do not overwrite

### Types
- `lib/types.ts` — all shared types: `CV`, `Job`, `MatchResult`, `HiredScore`, `LeaderboardEntry`. **Import from here, never redefine.**

### Data
- `data/jobs.json` — 60 Jordan jobs (Akhtaboot / Bayt / Wuzzuf / Fursa). Fields: `id, title, company, sector, city, country, seniority, type, salary_min, salary_max, currency, remote, skills[], source, applyUrl, postedAt`.
- `data/learning-resources.json` — 30 free resources (YouTube, freeCodeCamp, Coursera).
- `data/certifications-jo.json` — Jordan-specific certs (INJAZ, Orange Coding Academy, HTU, ZINC).

### Score engine
- `lib/score.ts` — `computeScore(cv: CV): HiredScore`. Returns `{ total(0–1000), breakdown, topSkill, advice[] }`. Pure function, no DB calls.
- `app/api/score/route.ts` — POST `{ cv, alias? }`. Calls `computeScore`, optionally saves to leaderboard store. Returns `HiredScore`.

### Dashboard
- `components/DashboardCharts.tsx` — Recharts bar + pie charts over `jobs.json`. Has hover InsightsPanel (expands card downward, does not cover chart). Uses `"use client"`.
- `app/dashboard/page.tsx` — Layout shell with pulsing LIVE badge.

### Jobs
- `components/JobCard.tsx` — displays one job, "Check fit" button calls `/api/match`.
- `app/jobs/page.tsx` — full filter UI (type, sector, source, country, city, seniority, apply-from, internship toggle, search). Reads CV from `localStorage` key `hired_cv`.
- `app/api/match/route.ts` — POST `{ cv, job }`. Currently stubbed (returns mock match data). **Replace stub with real call to `matchCvToJob` from `lib/gemini.ts` once Track C delivers it.**

### Co-founder
- `app/api/cofounder/route.ts` — POST `{ action: "register"|"match", ... }`. Uses keyword overlap scoring (stub). **Replace stub with `embed`/`cosine` from `lib/embeddings.ts` once Track C delivers it.**
- `app/cofounder/page.tsx` — 3-step form: register → find → results with mailto connect links.

### Leaderboard
- `app/api/leaderboard/route.ts` — GET returns top 20 by score from `lib/store`.
- `app/leaderboard/page.tsx` — auto-refreshes every 5 s. LIVE badge sits top-right of title.

### Shared UI
- `components/Navbar.tsx` — `<Navbar />` with Hired.jo logo + nav links. Already added to all 5 inner pages (dashboard, jobs, score, cofounder, leaderboard).
- `components/HiredScore.tsx` — `<HiredScoreCard s={score} />` gradient score display card.

### DB / Store
- `lib/db.ts` — Prisma singleton using PrismaNeon adapter. Import `prisma` from here if you need direct DB access.
- `lib/store.ts` — in-memory global store. Exports: `addLeaderboardEntry`, `getLeaderboard`, `addCofounder`, `getCofounders`.

### Landing page
- `app/page.tsx` — full landing page (hero, static stats strip, 8-feature grid, QR callout, footer). All nav links wired to real routes.

---

## What Track B is waiting on

| Dependency | From | Needed by |
|---|---|---|
| `lib/gemini.ts` exports `matchCvToJob(cv, job)` | Track C | `/api/match` (remove stub) |
| `lib/gemini.ts` exports `enrichJob(job)` | Track C | `scripts/enrich-jobs.ts` |
| `lib/embeddings.ts` exports `embed(text)`, `cosine(a, b)` | Track C | `/api/cofounder` (remove stub) |
| `/build` page saves CV to `localStorage` key `hired_cv` | Track A | `/jobs` "Check fit", `/score` |

---

## Integration rules for Track A and C

- **localStorage key for CV is `hired_cv`** — Track A must write a `CV` object (matching `lib/types.ts`) to this key.
- **Do not redefine types** — import `CV`, `Job`, `HiredScore`, etc. from `lib/types.ts`.
- **Do not touch** `data/jobs.json`, `lib/score.ts`, `lib/store.ts`, `components/DashboardCharts.tsx`, or `components/Navbar.tsx`.
- When Track C delivers `lib/gemini.ts` and `lib/embeddings.ts`, remove the `// STUB` blocks in `app/api/match/route.ts` and `app/api/cofounder/route.ts`.

---

## Build
```
pnpm build   # runs: prisma generate && next build
```
Required env vars: `DATABASE_URL` (Neon PostgreSQL), `GEMINI_API_KEY` (Track C uses this).
