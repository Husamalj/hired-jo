# Track B — Done ✓

Built for the **HU AI Employability Hackathon 2026** — Hired.jo, an AI career copilot for Jordanian graduates.

## What was built

- **`lib/types.ts`** — shared TypeScript types (CV, Job, MatchResult, HiredScore, etc.)
- **`prisma/schema.prisma`** — LeaderboardEntry + CofounderProfile models (SQLite, Prisma v7)
- **`lib/db.ts`** — Prisma singleton
- **`data/jobs.json`** — 60 jobs: Akhtaboot, Bayt, Wuzzuf, and Fursa (local + international internships)
- **`data/learning-resources.json`** — 30 free resources (YouTube, Coursera, freeCodeCamp)
- **`data/certifications-jo.json`** — 8 Jordan-specific certifications
- **`lib/score.ts`** — Get Hired Score engine (0–1000, 4-component breakdown)
- **`app/score/page.tsx`** + **`app/api/score/route.ts`** — score page + API
- **`components/DashboardCharts.tsx`** — 4 Recharts charts (skills, cities, sectors, seniority)
- **`app/dashboard/page.tsx`** — market dashboard
- **`components/JobCard.tsx`** — card with circle-reveal animation (hover + tap/mobile)
- **`app/jobs/page.tsx`** — jobs listing with full filter bar
- **`app/api/match/route.ts`** — Job Fit API (stub ready for Track C's `matchCvToJob`)
- **`app/cofounder/page.tsx`** + **`app/api/cofounder/route.ts`** — co-founder matching
- **`app/leaderboard/page.tsx`** + **`app/api/leaderboard/route.ts`** — live leaderboard (5s refresh)
- **`scripts/enrich-jobs.ts`** — enrichment script (awaits Track C's `enrichJob`)

## Extras added beyond the original plan

- Fursa as a 4th job source (12 local + 8 international/remote internships)
- Separate Internships mode with "I'm in" + location filters; seniority/country/city auto-hide
- All 12 Jordan governorates + 16 Palestinian cities in cascading country→city filter
- Circle-reveal card animation (clip-path transition, works on desktop hover and mobile tap)

## Awaiting teammates

- **Track C**: `lib/gemini.ts` (matchCvToJob, enrichJob) + `lib/embeddings.ts` (embed, cosine)
- **Track A**: `/build` page saving CV to `localStorage` key `hired_cv`
