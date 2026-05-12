# Hired.jo — CLAUDE.md (auto-loaded by Claude Code)

> You are working on **Hired.jo**, an AI career copilot for Jordanian graduates built at HU AI Employability Hackathon 2026.
> Live site: https://hired-jo-zrgu.vercel.app
> GitHub: https://github.com/Husamalj/hired-jo

---

## Read this before touching any file

1. Read `TRACK_B_DONE.md` — full inventory of what Track B built and owns. Contains integration contracts and the list of files you must NOT overwrite.
2. Read `lib/types.ts` — all shared TypeScript types (CV, Job, MatchResult, HiredScore). Never redefine these.
3. Read `app/globals.css` — all custom CSS utility classes. Use them, don't add new ones.

---

## Stack

- **Framework**: Next.js App Router, no `src/` folder. Alias `@/*` → project root.
- **Styling**: Tailwind v4 + custom classes in `app/globals.css`
- **Database**: Neon PostgreSQL via Prisma v7 (`lib/db.ts`). Adapter: `@prisma/adapter-neon`.
- **AI**: Google Gemini 2.0 Flash via `@google/generative-ai`. Key in `GEMINI_API_KEY` env var.
- **Theme**: Dark. Background `#0A0716`, gold `#F5B82E`, purple `#3F2B96`. All pages use these.

---

## File ownership — who owns what

| Area | Owner | Key files |
|---|---|---|
| Types | Track B | `lib/types.ts` |
| Data (jobs, certs, resources) | Track B | `data/*.json` |
| Score engine | Track B | `lib/score.ts`, `app/api/score/` |
| Dashboard charts | Track B | `components/DashboardCharts.tsx`, `app/dashboard/` |
| Jobs listing + filters | Track B | `app/jobs/`, `components/JobCard.tsx` |
| Leaderboard | Track B | `app/leaderboard/`, `app/api/leaderboard/` |
| Co-founder matching | Track B | `app/cofounder/`, `app/api/cofounder/` |
| Navbar + landing | Track B | `components/Navbar.tsx`, `app/page.tsx` |
| In-memory store | Track B | `lib/store.ts` |
| **CV Builder (/build)** | **Track A** | `app/build/page.tsx` |
| **Gemini AI layer** | **Track C** | `lib/gemini.ts`, `lib/embeddings.ts` |
| **CV Roast (/roast)** | **Track C** | `app/roast/`, `app/api/roast/` |
| **Cover letter (/cover)** | **Track C** | `app/cover/`, `app/api/cover/` |

---

## Critical integration contract

### localStorage key
The CV object is stored in the browser under key **`hired_cv`**.
- **Track A writes it** (after the user finishes the CV builder).
- **Track B reads it** on `/jobs` (Check Fit), `/score` (Hired Score).
- **Track C reads it** on `/roast` and `/cover`.
- The value must be a valid `CV` object as defined in `lib/types.ts`. No other shape is accepted.

### Track C must export from `lib/gemini.ts`
```ts
chat(history, userMessage): Promise<string>
roastCv(cv: CV): Promise<string>
matchCvToJob(cv: CV, job: Job): Promise<MatchResult>
enrichJob(job: Job): Promise<Job>
generateCoverLetter(cv: CV, job: Job): Promise<string>
```

### Track C must export from `lib/embeddings.ts`
```ts
embed(text: string): Promise<number[]>
cosine(a: number[], b: number[]): number
```

Once Track C pushes these, Track B stubs in `app/api/match/route.ts` and `app/api/cofounder/route.ts` must be replaced with real imports (the stubs are marked with `// STUB`).

---

## Dev commands

```bash
pnpm dev          # local dev server on localhost:3000
pnpm build        # prisma generate && next build
pnpm dlx prisma migrate dev   # run after schema changes
```

Env vars needed locally — create `.env.local`:
```
DATABASE_URL=<neon postgres connection string>
GEMINI_API_KEY=<google ai studio key>
```

---

## Pages map

| Route | Owner | Status |
|---|---|---|
| `/` | Track B | Done — landing page |
| `/build` | Track A | **Track A builds this** |
| `/jobs` | Track B | Done |
| `/score` | Track B | Done |
| `/dashboard` | Track B | Done |
| `/cofounder` | Track B | Done |
| `/leaderboard` | Track B | Done |
| `/roast` | Track C | **Track C builds this** |
| `/cover` | Track C | **Track C builds this** |

---

## Rules for all tracks

- Always import `<Navbar />` from `@/components/Navbar` and place it at the top of every new page.
- Never create a new CSS file — add classes to `app/globals.css` if truly needed.
- Never redefine types that exist in `lib/types.ts`.
- Commit and push to `main` after each working feature. Vercel auto-deploys in ~30s.
- The QR code on the homepage points to `/roast` — Track C must make that page work.
