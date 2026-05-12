# Track B — Completed Work (for Claude / Codex on teammate machines)

> This file is a machine-readable summary of everything Track B has built.
> Read this before generating any code that touches data, scoring, jobs, leaderboard, or co-founder matching.

---

## Stack
- Next.js App Router (no `src/` prefix). All paths use `@/*` → project root.
- Tailwind v4 + custom CSS in `app/globals.css` (grain bg, glass, gold-grad, purple-grad, text-grad, animations).
- Prisma v7, provider `prisma-client`, output `app/generated/prisma`, driver adapter PrismaNeon (`@prisma/adapter-neon`).
- Database: Neon PostgreSQL (connection string in `DATABASE_URL` env var).
- In-memory global store (`lib/store.ts`) is the working data layer for leaderboard + cofounder during local dev.

---

## Files Track B owns — do not overwrite

### Types
- `lib/types.ts` — all shared types: `CV`, `Job`, `MatchResult`, `HiredScore`, `LeaderboardEntry`. **Import from here, never redefine.**
- `Job.source` union includes: `"Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa" | "LinkedIn" | "Indeed" | "Glassdoor" | "Naukrigulf" | "GulfTalent" | "Tanqeeb"`

### Data
- `data/jobs.json` — 60 seed jobs (Jordan). Static fallback only — live data comes from APIs.
- `data/learning-resources.json` — 30 free resources.
- `data/certifications-jo.json` — Jordan-specific certs.

### Live Jobs System
- `app/api/live-jobs/route.ts` — fetches real-time jobs from **7 sources** on every request (cached 1 hour):
  - **JSearch (RapidAPI)** → LinkedIn, Indeed, Glassdoor — queries Jordan + UAE + Saudi Arabia
  - **Gemini Search Grounding** → Akhtaboot, For9a, Bayt, Wuzzuf, Naukrigulf, GulfTalent, Tanqeeb
  - Falls back to `data/jobs.json` if all APIs fail
- Required env vars: `RAPIDAPI_KEY`, `GEMINI_API_KEY`

### Score engine
- `lib/score.ts` — `computeScore(cv: CV): HiredScore`. Pure function, no DB calls.
- `app/api/score/route.ts` — POST `{ cv, alias? }`. Returns `HiredScore`, optionally saves to leaderboard.

### Dashboard
- `components/DashboardCharts.tsx` — Recharts charts over `data/jobs.json`. Hover InsightsPanel expands card downward. Uses `"use client"`.
- `app/dashboard/page.tsx` — Layout shell with pulsing LIVE badge.

### Jobs
- `components/JobCard.tsx` — Displays one job. "Check fit" calls `/api/match`. Apply → smart search URL per source. LinkedIn "in" button on every card.
- `app/jobs/page.tsx` — Full filter UI: type, sector, source, country (Jordan/UAE/Saudi Arabia/Palestine), city, seniority, search. Fetches live from `/api/live-jobs` on mount. Skeleton loading state. Countries + cities:
  - Jordan: Amman, Irbid, Zarqa, Aqaba + 8 more
  - UAE: Dubai, Abu Dhabi, Sharjah + 4 more
  - Saudi Arabia: Riyadh, Jeddah, Mecca, Medina, Dammam + 12 more
  - Palestine: Ramallah, Jerusalem + 14 more
- `app/api/match/route.ts` — POST `{ cv, job }`. Stubbed. **Replace stub with `matchCvToJob` from `lib/gemini.ts` once Track C delivers it.**

### Co-founder
- `app/api/cofounder/route.ts` — POST register/match. Stubbed. **Replace with `embed`/`cosine` from `lib/embeddings.ts` once Track C delivers it.**
- `app/cofounder/page.tsx` — 3-step form: register → find → results with mailto connect links.

### Leaderboard
- `app/api/leaderboard/route.ts` — GET top 20 by score from `lib/store`.
- `app/leaderboard/page.tsx` — Auto-refreshes every 5s. LIVE badge top-right.

### Shared UI
- `components/Navbar.tsx` — `<Navbar />` with Hired.jo logo + all nav links. On every page.
- `components/HiredScore.tsx` — `<HiredScoreCard s={score} />` gradient score card.

### DB / Store
- `lib/db.ts` — Prisma singleton using PrismaNeon adapter.
- `lib/store.ts` — In-memory store. Exports: `addLeaderboardEntry`, `getLeaderboard`, `addCofounder`, `getCofounders`.

### Landing page
- `app/page.tsx` — Full landing page. Static stats strip, 8-feature grid, QR callout → `/roast`, footer.

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
- **Do not redefine types** — import from `lib/types.ts`.
- **Do not touch** `data/jobs.json`, `lib/score.ts`, `lib/store.ts`, `components/DashboardCharts.tsx`, `components/Navbar.tsx`, `app/api/live-jobs/route.ts`.
- When Track C delivers `lib/gemini.ts` and `lib/embeddings.ts`, remove `// STUB` blocks in `app/api/match/route.ts` and `app/api/cofounder/route.ts`.

---

## Build
```
pnpm build   # runs: prisma generate && next build
```
Required env vars: `DATABASE_URL`, `GEMINI_API_KEY`, `RAPIDAPI_KEY`.

## Live site
https://hired-jo-zrgu.vercel.app
