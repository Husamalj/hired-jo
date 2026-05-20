# Hired.jo — Project Handoff for Future AI Assistants

> **Read this entire file before touching any code.** It is the canonical reference for the project — every file, API, env var, known bug, and historical landmine. If you're tempted to skim, don't. The "Known Bugs & Landmines" section near the end will save you hours.

---

## 1. What this project is

**Hired.jo** is an AI career copilot built for the HU AI Employability Hackathon 2026 (won). The user is now turning it into a real project. Target audience: Jordanian university graduates and entry-level job seekers in the broader Middle East (Jordan / UAE / Saudi Arabia).

Live: https://hired-jo-zrgu.vercel.app
GitHub: https://github.com/Husamalj/hired-jo
Owner: Husam (also referred to as "user" in chats)

**Top-level features:**
- `/build` — interactive CV builder (chat-style or bulk paste). Saves a structured `CV` object to localStorage under key `hired_cv`.
- `/jobs` — live job board aggregating LinkedIn + Akhtaboot + Bayt + Wuzzuf + For9a (Fursa) + JSearch publishers
- `/score` — Hired Score (0–1000) computed from the CV against the live job market
- `/dashboard` — market intelligence charts (sectors, cities, demand)
- `/roast` — Gemini "roast my CV" + actionable advice
- `/cover` — Gemini cover letter generator for a chosen job
- `/cofounder` — embedding-based co-founder matching
- `/leaderboard` — public top scores
- `/learn` — curated learning resources mapped to skill gaps

---

## 2. Stack

- **Framework**: Next.js 16 (App Router, no `src/`). Alias `@/*` → project root.
- **Language**: TypeScript everywhere
- **Styling**: Tailwind v4 (no `tailwind.config.*` file — config lives in `app/globals.css`). Custom utility classes also in `app/globals.css`: `glass`, `gold-grad`, `gold-text-grad`, `text-grad`, `feature-card`, `dot-grid`, `grain`, `paper-bg`.
- **UI primitives**: shadcn (already-installed components live in `components/ui/`)
- **Icons**: lucide-react
- **Database**: **Two databases. Pay attention.**
  - **Neon PostgreSQL** (via `@neondatabase/serverless` + `@prisma/adapter-neon`) — stores the live job cache. Schema in `prisma/schema.prisma`. Models: `CachedJob`, `JobsFetchMeta`.
  - **Supabase Postgres** (via `@supabase/supabase-js`) — stores `leaderboard` and `cofounder_profiles` tables. Used by `/api/score`, `/api/leaderboard`, `/api/cofounder`. Tables created directly in Supabase Dashboard, **not** managed by Prisma.
- **AI**: Google Gemini 2.5 Flash via `@google/generative-ai` (env: `GEMINI_API_KEY`). The Groq SDK is still in `package.json` but unused — leftover from an earlier attempt.
- **Job data API**: JSearch on RapidAPI (env: `RAPIDAPI_KEY`). Free tier ~500 calls/month.
- **Hosting**: Vercel. Repo is public. Vercel auto-deploys on push to `main` in ~30–60s.
- **Vercel plan**: Hobby. **Edge runtime gets 30s timeout**; default Node runtime gets 10s. Always add `export const runtime = "edge"` to any route that calls Gemini or scrapes external HTML.
- **Package manager**: pnpm

---

## 3. Environment variables

Stored in `.env.local` for dev and in Vercel project env for prod. Don't commit `.env.local`.

| Var | What it is | Where used |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio key | All `/api/*` routes that call `@/lib/gemini` (chat, roast, cover, match, parse-cv, build-cv, diverse-jobs) |
| `RAPIDAPI_KEY` | RapidAPI key with JSearch subscription | `app/api/live-jobs/route.ts`, `app/api/jobs-health/route.ts` |
| `DATABASE_URL` | Neon Postgres connection string | All routes that read/write `CachedJob` (live-jobs, scrape-jobs, jobs-health) and anything via `@/lib/db` |
| `SUPABASE_URL` | Supabase project URL | `@/lib/supabase` |
| `SUPABASE_ANON_KEY` | Supabase anon key (public) | `@/lib/supabase` |

> **Keys are never to be hardcoded.** If you see one in a file, treat it as a security incident and ask the user to rotate. The repo is public.

---

## 4. Database

### Neon (Postgres, primary)

Schema source: `prisma/schema.prisma`.

```prisma
model CachedJob {
  id                String   @id          // e.g. "linkedin-Jordan-12345", "akhtaboot-jordan-166959", "jsearch-10003", "bayt-jordan-5439383"
  title             String
  company           String
  sector            String                 // Tech | Finance | Marketing | Sales | Design | Creative | HR | Healthcare | Education | Legal | Operations | Customer Service | Construction | Other
  city              String
  country           String                 // Jordan | UAE | Saudi Arabia | Egypt | …
  seniority         String                 // Intern | Junior | Mid | Senior
  skills            Json                   // string[]
  salaryMin         Int?
  salaryMax         Int?
  remote            Boolean  @default(false)
  internshipCountry String?
  source            String                 // LinkedIn | Akhtaboot | Bayt | Wuzzuf | Fursa | BeBee | UN Talent | ReliefWeb | Indeed | <company name>
  url               String
  postedAt          String                 // ISO date "YYYY-MM-DD"
  description       String
  fetchedAt         DateTime @default(now())
}

model JobsFetchMeta {
  id          Int      @id @default(1)    // always row id=1, single-row table
  lastFetched DateTime @default(now())
}

model LeaderboardEntry { … }   // unused, see Supabase instead
model CofounderProfile { … }   // unused, see Supabase instead
```

**Important**: `LeaderboardEntry` and `CofounderProfile` in Prisma are NOT used. Leaderboard and co-founder data lives in Supabase. The Prisma models are leftovers from an earlier architecture and would need to be either dropped or wired up properly if you migrate everything to Neon.

### Supabase (Postgres, for users)

Two tables created via Supabase Dashboard (not Prisma-managed):

```sql
-- leaderboard
id BIGSERIAL PRIMARY KEY,
alias TEXT NOT NULL,
score INT NOT NULL,
top_skill TEXT,
created_at TIMESTAMPTZ DEFAULT now()

-- cofounder_profiles
id BIGSERIAL PRIMARY KEY,
alias TEXT,
email TEXT,
skills TEXT,        -- JSON-stringified string[]
interests TEXT,     -- JSON-stringified string[]
vibe TEXT,
embedding TEXT,     -- JSON-stringified number[] (cosine via local TF embed)
created_at TIMESTAMPTZ DEFAULT now()
```

Access via `getSupabase()` from `@/lib/supabase`.

---

## 5. File map — what every file does

### Configuration

| File | Purpose |
|---|---|
| `package.json` | Deps + scripts. Note: includes Groq SDK and other dead imports — don't assume something is used because it's listed. |
| `next.config.ts` | `ignoreDuringBuilds: true` for both ESLint and TS errors. The build is intentionally permissive. |
| `vercel.json` | Custom install + build commands for pnpm + `app/api/build-cv` gets 60s maxDuration. |
| `prisma/schema.prisma` | Neon schema (see Section 4). |
| `prisma.config.ts` | Prisma config to load `.env.local`. |
| `tsconfig.json` | Standard Next.js TS config. |
| `components.json` | shadcn config (don't manually edit — `pnpm shadcn add ...`). |

### Top-level docs

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions auto-loaded by Claude Code. Multi-track ownership boundaries from the hackathon (Track A / B / C). Read it but note: the project has moved past those tracks. |
| `PLAN.md` | Original hackathon plan. Mostly historical now. |
| `TRACK_B_DONE.md` | Inventory of Track B work, integration contracts. |
| `README.md` | Public-facing readme. |
| **`HANDOFF.md`** | **This file. The canonical project context for future AI assistants.** |

### `app/` — pages (Next.js App Router)

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Root layout: fonts, theme color, html lang |
| `app/page.tsx` | Landing page (large, ~640 lines) |
| `app/build/page.tsx` | CV builder. Two modes: chat (via `/api/chat`) and bulk paste (via `/api/parse-cv`). Output → `localStorage.hired_cv`. |
| `app/jobs/page.tsx` | **Live job board** — the heaviest page. Fetches from `/api/live-jobs`, fires `/api/scrape-jobs?all=1` in background. Has 5 filter dropdowns + Remote toggle + sort. |
| `app/score/page.tsx` | Hired Score visualization. Reads CV from localStorage, POSTs to `/api/score`. |
| `app/dashboard/page.tsx` | Market intelligence charts. Currently reads `data/jobs.json` (static demo data), not the live DB. **Could be a future improvement: switch to live data.** |
| `app/roast/page.tsx` | "Roast my CV" — uploads or reads CV, POSTs to `/api/roast`. |
| `app/cover/page.tsx` | Cover letter generator. Reads `data/jobs.json` (static), CV from localStorage, POSTs to `/api/cover`. |
| `app/cofounder/page.tsx` | Co-founder matching via embeddings. |
| `app/leaderboard/page.tsx` | Public top scores from Supabase. |
| `app/learn/page.tsx` | Skill-gap learning resources from `data/learning-resources.json`. |
| `app/test/page.tsx` | Internal test page — harmless, can be ignored. |
| `app/sitemap.ts`, `app/robots.ts` | SEO helpers. |
| `app/*/layout.tsx` | Per-page metadata (titles, descriptions). Mostly identical structure. |

### `app/api/` — API routes

| Path | Method | What it does | Env / external |
|---|---|---|---|
| `app/api/live-jobs/route.ts` | GET, GET `?force=1` | Reads `CachedJob` table, returns the job list sorted by `postedAt DESC`. On `?force=1` or when data is >2h stale, fires JSearch refresh (4 regional queries: Jordan, UAE, Saudi, internships). Has a background refresh path for stale data via `refreshInBackground()`. **edge runtime.** | `RAPIDAPI_KEY`, `DATABASE_URL` |
| `app/api/scrape-jobs/route.ts` | GET `?all=1`, `?source=…`, `?force=1` | The direct scrapers. Hits LinkedIn (public guest endpoint, geoId per country), Akhtaboot (RSS feed), Bayt (HTML), Wuzzuf (HTML), For9a/Fursa (`__NEXT_DATA__` JSON). Throttled to once per 2 hours; `?force=1` overrides. **edge runtime.** | `DATABASE_URL` |
| `app/api/jobs-health/route.ts` | GET, GET `?testQuery=…` | Visibility endpoint. Returns source breakdown, fresh-vs-stale counts, last-fetched times. `?testQuery=…` runs an ad-hoc JSearch and shows what publishers come back. **edge runtime.** | `RAPIDAPI_KEY`, `DATABASE_URL` |
| `app/api/parse-cv/route.ts` | POST | Two modes: (1) multipart form with PDF/DOCX file → extracts text with `unpdf`/`mammoth`, then Gemini parses to CV; (2) JSON `{ text: string }` → Gemini parses to CV. Returns `CV` object. **nodejs runtime** (needs `Buffer`). | `GEMINI_API_KEY` |
| `app/api/build-cv/route.ts` | POST | Takes a structured intake form, returns a polished CV JSON. Used by the `/build` chat flow. **edge runtime, maxDuration 30.** | `GEMINI_API_KEY` |
| `app/api/chat/route.ts` | POST | Conversational CV interview. Wraps `chat()` from `@/lib/gemini`. Returns either `{ done: false, reply: string }` or `{ done: true, cv: CV }`. | `GEMINI_API_KEY` |
| `app/api/roast/route.ts` | POST | `{ cv }` → `{ roast: string, advice: string }`. Two-section response split by `[ADVICE]` marker. | `GEMINI_API_KEY` |
| `app/api/cover/route.ts` | POST | `{ cv, jobId }` → `{ letter: string }`. **Reads `data/jobs.json` (static)**, not live DB. Will return 404 if `jobId` not in static file. | `GEMINI_API_KEY` |
| `app/api/match/route.ts` | POST | `{ cv, job }` → full `MatchResult` with score, matched/missing skills, rewritten summary, learning plan. Called from `JobCard` "Check fit" button. | `GEMINI_API_KEY` |
| `app/api/score/route.ts` | POST | `{ cv, alias? }` → computes `HiredScore` locally (no AI). Optionally writes to Supabase leaderboard if `alias` provided. **DB failure does NOT block the score response.** | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `app/api/leaderboard/route.ts` | GET, POST | GET returns top 20 from Supabase. POST inserts an entry. | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `app/api/cofounder/route.ts` | POST | Two actions: `action=register` inserts profile with embedding, `action=match` returns ranked matches via cosine similarity. | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `app/api/diverse-jobs/route.ts` | GET | Gemini-grounded search for 10 niche sectors (videography, healthcare, education, …). 1h in-memory cache. Fires from `/jobs` when user selects sector "Other". | `GEMINI_API_KEY` |

### `lib/` — shared utilities

| File | Purpose |
|---|---|
| `lib/types.ts` | **Single source of truth for all shared types.** `CV`, `Job`, `MatchResult`, `HiredScore`, `LearningResource`, `CofounderProfile`, etc. **Never redefine these types elsewhere.** |
| `lib/gemini.ts` | All Gemini calls live here. Exports: `chat`, `roastCv`, `matchCvToJob`, `enrichJob`, `generateCoverLetter`, `parseCvFromText`. Uses `gemini-2.5-flash`. **Bug**: the top of the file initializes a model with `gemini-2.0-flash` but `ask()` uses 2.5 — the 2.0 instance is never used, dead code. |
| `lib/db.ts` | Prisma client factory with Neon adapter. **Avoid using this in API routes** — instead use direct `new Pool({ connectionString: DATABASE_URL })` from `@neondatabase/serverless`. Reason: Prisma init was unreliable in early dev (initializes at module load, before env vars are wired up in some Vercel cold starts). All live-jobs/scrape-jobs routes use direct Pool. |
| `lib/supabase.ts` | `getSupabase()` factory, lazy-initialized, cached on `globalThis`. |
| `lib/embeddings.ts` | Local sparse-vector embeddings (no external API). Maps keywords to a fixed vocabulary, returns count vector, cosine similarity. Used by cofounder matching only. |
| `lib/score.ts` | `computeScore(cv)` — deterministic, no AI. Maps CV quality + skill demand + market fit + completeness to a 0–1000 score with breakdown. Reads `data/jobs.json` (static) for the "demand" component. |
| `lib/store.ts` | **Dead code.** In-memory store that was used before Supabase. Safe to delete but listed for awareness. |
| `lib/utils.ts` | Just `cn()` (className merger). |

### `components/`

| File | Purpose |
|---|---|
| `components/Navbar.tsx` | Top nav, links to all pages. Mobile-scrollable. Used on every page. |
| `components/JobCard.tsx` | Job card with hover-reveal back panel. Uses `clipPath: circle()` for the reveal animation. Includes "Check fit" (POST /api/match), "Apply" (smart URL — uses real `job.url` only when it has a numeric job id, else falls back to the source's search page), and LinkedIn search button. Has a `postedLabel()` helper for "Today / 3 days ago / 2mo ago". |
| `components/SourceFilter.tsx` | **Custom grouped dropdown** for the Source filter. Classifies sources as `board` / `aggregator` / `company`. Job Boards section is open by default; Company Career Pages are collapsed behind an expander. Includes a `sourceMatches()` helper and a `COMPANY_PAGES_VALUE` sentinel. The sentinel is how "All company pages" filters all non-major-board sources at once. |
| `components/FilterDropdown.tsx` | Generic styled dropdown for Sector / Country / City / Level / Location. Same dark/gold theme as SourceFilter. |
| `components/CvPreview.tsx` | Big component (~448 lines) — renders the white CV template, supports PDF & DOCX download (via `jspdf` and `docx`). Smart section reordering for fresh vs experienced. |
| `components/CvBulkForm.tsx` | Paste-CV-text form on `/build`. POSTs to `/api/parse-cv` as JSON. |
| `components/HiredScore.tsx` | Small composable score widget used on /score and home page. |
| `components/DashboardCharts.tsx` | recharts-based market charts on /dashboard. Reads static `data/jobs.json`. |
| `components/VoiceRecorder.tsx` | Used in CV builder for voice input. Browser MediaRecorder, then Gemini transcription. |
| `components/ui/*` | shadcn primitives. Don't edit manually. |

### `data/`

| File | Purpose |
|---|---|
| `data/jobs.json` | **Static demo job data.** Used by `/dashboard`, `/cover`, and `/api/score` (for skill-demand calculation). **NOT** the live job source — that's the `CachedJob` Neon table. |
| `data/learning-resources.json` | Curated learning resources for `/learn`. |
| `data/certifications-jo.json` | Local cert recommendations. |

### `scripts/`

| File | Purpose |
|---|---|
| `scripts/enrich-jobs.ts` | One-off script (tsx) to enrich `data/jobs.json` with Gemini. Not part of the runtime path. |

---

## 6. Data flow — how a job gets onto the page

```
                      ┌────────────────────┐
                      │  user opens /jobs  │
                      └─────────┬──────────┘
                                ▼
                      ┌────────────────────┐
                      │ GET /api/live-jobs │   reads CachedJob table, returns rows
                      └─────────┬──────────┘
                                │
       ┌────────────────────────┼─────────────────────────┐
       ▼                        ▼                         ▼
  if dbCount == 0          if data stale          background scrape
  block on JSearch         (>2h since           POST /api/scrape-jobs?all=1
  refresh                  lastFetched), kick                │
                           off background          ┌─────────┴─────────┐
                           refresh                 │ throttle: skip if │
                                                   │ any scraper row   │
                                                   │ fetched <2h ago   │
                                                   └─────────┬─────────┘
                                                             ▼
                                            ┌────────────────────────────────────┐
                                            │ parallel:                          │
                                            │  • scrapeLinkedIn(JO/AE/SA)         │
                                            │  • scrapeAkhtaboot(JO/AE/SA) — RSS  │
                                            │  • scrapeBayt(JO/AE/SA) — HTML      │
                                            │  • scrapeWuzzuf() — HTML            │
                                            │  • scrapeFor9a() — __NEXT_DATA__    │
                                            └─────────┬──────────────────────────┘
                                                      ▼
                                            DELETE source's rows,
                                            INSERT fresh ones.
                                            Each scraper applies a
                                            60-day freshness gate.
```

**Two refresh layers that act independently:**

1. **JSearch refresh** (in `live-jobs/route.ts`): driven by `JobsFetchMeta.lastFetched`. Fires when stale (>2h) and only operates on `id LIKE 'jsearch-%'` rows.
2. **Scraper refresh** (in `scrape-jobs/route.ts`): driven by `MAX(fetchedAt) WHERE source IN (…)`. Throttled to once per 2 hours. Operates on `linkedin-*`, `akhtaboot-*`, `bayt-*`, `wuzzuf-*`, `fursa-*` rows.

Both layers respect each other — neither deletes rows belonging to the other.

---

## 7. The job board filter UI (Phase 1–5 redesign, 2026-05-21)

Filter row on `/jobs`:
1. **Search box** — fuzzy match on title and company
2. **Type** segmented control: All / Jobs / Internships
3. **Remote only** toggle button (works in every type mode — fixed a bug where it was hidden in Jobs view)
4. **Sort** toggle: Newest / Oldest (by `postedAt`)
5. **Source** dropdown — uses `SourceFilter`, grouped into Job Boards / Aggregators / Company Career Pages (collapsed)
6. **Sector** dropdown — derived from actual data, not hardcoded
7. **Country** / **City** / **Level** — `FilterDropdown` components, dynamic city list per country
8. **Location** (only shown in Internships mode) — Anywhere / Jordan / UAE / Saudi / Egypt

State lives in the page component. All filters compose into a single `filter()` call that runs against `sourcePool` (which is `allJobs` or `allJobs + diverseJobs` when sector="Other").

---

## 8. CV / localStorage contract

The CV object is stored in `localStorage` under key **`hired_cv`** as JSON. Shape must match `CV` from `lib/types.ts` exactly.

**Who writes**: `/build` (both modes), `/roast` (after upload-parse).
**Who reads**: `/jobs` (for Check Fit), `/score`, `/roast`, `/cover`.

**Never invent a different shape.** If you need to add a field, update `lib/types.ts` first and migrate all readers/writers in the same commit.

---

## 9. Job sources currently working

| Source | How we get it | Volume | Notes |
|---|---|---|---|
| **LinkedIn** | Direct scrape of `linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?geoId=…` (public, no auth) | ~10 per country | GeoIds: Jordan=`103710677`, UAE=`104305776`, Saudi=`100459316`. Discovered via LinkedIn's typeahead API. |
| **Akhtaboot** | Direct RSS feed at `akhtaboot.com/en/{country}/jobs.rss` | 20-30 per country | Cleanest source — RSS has title, company, city, country, sector tags, pubDate |
| **Bayt** | Direct HTML scrape of `bayt.com/en/{country}/jobs/` parsed via `<li data-js-job>` regex | Variable, sometimes 0 | **Sometimes returns 0** — Bayt may block Vercel edge IPs. See Known Bugs. |
| **Wuzzuf** | Direct HTML scrape of `wuzzuf.net/jobs/p/` | Variable, sometimes 0 | Egyptian site, brings Egypt + Gulf jobs. Same IP-blocking risk. |
| **For9a / Fursa** | `for9a.com/en/opportunity/recently-added` HTML, parsed via `__NEXT_DATA__` JSON | ~15 | Internships, scholarships, fellowships |
| **JSearch publishers** (BeBee, ReliefWeb, UN Talent, GulfTalent, Naukrigulf, Indeed, plus company career pages like FedEx/GSK/PepsiCo/etc.) | JSearch API, source tagged from `j.job_publisher` | ~10 per regional query | The "Company Career Pages" group |

**LinkedIn does NOT come from JSearch.** JSearch (backed by Google Jobs) has zero LinkedIn results for ME regions — verified empirically. Confusingly, the OLD code (pre-2026-05-21) hardcoded `source: "LinkedIn"` on every JSearch result, which made it look like LinkedIn was working when it wasn't. The current code uses `job_publisher` for source tagging, and LinkedIn jobs come from the direct scraper.

---

## 10. AI prompts — where they live

All Gemini prompts are inline in the route or `lib/gemini.ts`. There's no central prompts directory. Notable prompts:

- `lib/gemini.ts::chat()` — CV interview, asks questions one at a time, emits `[CV_READY]` marker when done
- `lib/gemini.ts::roastCv()` — two-section response split by `[ADVICE]`
- `lib/gemini.ts::matchCvToJob()` — strict JSON output for skill matching
- `lib/gemini.ts::parseCvFromText()` — extract structured CV from raw text
- `lib/gemini.ts::generateCoverLetter()` — 180-220 word cover letter, no filler phrases
- `app/api/build-cv/route.ts::buildPrompt()` — final CV polish for the structured form mode
- `app/api/diverse-jobs/route.ts::fetchSectorJobs()` — Gemini grounded search for niche sectors

**When you modify a prompt**, also bump the model temperature/expectations in mind. Gemini 2.5 Flash will obediently follow strict JSON instructions; it tends to wrap output in `` ```json `` fences — always strip them with `.replace(/```json|```/g, "").trim()` before parsing.

---

## 11. Error handling patterns

- **Score**: DB write failures are non-fatal. `/api/score` returns the score regardless and surfaces a `dbError` field if Supabase write failed.
- **Gemini routes**: wrapped in `try / catch`, log to console, return 500 with `{ error: "X failed" }`. The UI shows a "Something went wrong" banner.
- **Scrapers**: any thrown exception in a single scraper is swallowed and that source returns `[]`. Other scrapers continue (`Promise.allSettled`). Database delete-and-insert is gated on `jobs.length > 0` so a failing scrape doesn't wipe the DB.
- **JSearch refresh** (`live-jobs/route.ts`): if JSearch returns 0, we keep the existing DB jobs and still bump `lastFetched` (so we don't retry every page load).
- **localStorage parse**: every reader wraps `JSON.parse` in try/catch. If corrupted, treats CV as missing.

---

## 12. Known bugs & landmines (read this before debugging)

### Active / known issues

- **Bayt & Wuzzuf return 0 jobs from Vercel edge.** Works locally with `curl`, fails on Vercel. Likely Cloudflare/Imperva blocking Vercel's IP ranges. Diagnostic: check Vercel logs for the route, look for `[bayt-jordan] HTTP 4xx` or `suspiciously small body` messages we added. **Possible fixes**: proxy through Cloudflare Workers, accept JSearch's Bayt publisher results as the only Bayt source, or pay for a scraping API.
- **`data/jobs.json` is still the source of truth for `/dashboard`, `/cover`, and `/api/score`'s skill-demand calculation.** This is a static file from the hackathon. To make the project "fully real", we should replace those references with reads from the `CachedJob` table.
- **`lib/store.ts` is dead code** (replaced by Supabase). Safe to delete.
- **Prisma models `LeaderboardEntry` and `CofounderProfile`** in `prisma/schema.prisma` are NOT used — leaderboard/cofounders live in Supabase. Either drop them or migrate everything to Neon.
- **The `gemini-2.0-flash` constant at top of `lib/gemini.ts:5`** is never used (the actual model is set inside `ask()`). Dead code worth removing.
- **JSearch free tier**: ~500 calls/month. Each `live-jobs` refresh uses 4 calls. So we can do ~125 refreshes/month → ~4 refreshes/day. Hence the 2h staleness window. If we burn through quota, JSearch returns errors and the route falls back to existing DB rows.

### Historical landmines (things we already fixed but that bit us during dev)

These are documented so you don't re-introduce them.

| Bug | Fix | Commit |
|---|---|---|
| `\bare\b` regex matched English word "are", mis-tagging US/UK jobs as UAE | Remove `\bare\b` from UAE regex | 637dee9 |
| `saudi arabia` regex didn't match `saudi-arabia` URLs | Use plain `/saudi/` | baae85a |
| `manager` keyword tagged everything as Senior | Stricter regex with word boundaries; only `senior manager`/`head`/etc are Senior | 22ad452 |
| `inferSector` emitted `"FinTech"` but UI filter had `"Finance"` → 0 results | Normalize to `"Finance"` | 22ad452 |
| Skill extraction returned `[]` for every job because `.match()` was called on a joined empty string | Properly mine qualifications + description | 22ad452 |
| 31 jobs falsely labeled `"LinkedIn"` because we hardcoded the source in `fetchJSearch` calls | Use real `job_publisher` from JSearch response | 4f0ae98 |
| `syncToDb` deleted any DB job not in JSearch results, wiping Gemini-sourced rows every 2h | Only delete rows with `id LIKE 'jsearch-%'` | bd52d5b |
| Refresh-gemini route timed out at 8s (Vercel Hobby Node runtime limit) | `export const runtime = "edge"` for 30s budget | 0737006 |
| `memCache` lived in module scope, lied about being "cached" in serverless (Vercel function instances are ephemeral) | Removed; use DB-backed staleness check | 22ad452 |
| Source filter dropdown was clipped by parent `<section overflow-hidden>` | Removed overflow-hidden | 5c12ec3 |
| Dropdown was see-through over job cards | Solid background + z-index 30 on filter section | 6e080d1 |
| Page refresh triggered scrape every time, causing visible count drift | 2h scrape throttle | d7bdcb7 |
| Gemini refused to scrape Akhtaboot (content policy) | Abandoned Gemini scraping; use direct HTML scrapers + RSS | b555451 |
| Gemini took >8s for Bayt/Fursa, timed out | Same — replaced with direct scrapers | b555451 |

### Things that look wrong but are intentional

- `next.config.ts` ignores TypeScript and ESLint errors during build. Deliberate — hackathon mode. If you want strictness, flip the booleans.
- `lib/db.ts::prisma` is a `Proxy` that lazily instantiates Prisma. Was a workaround for module-load-time env var issues. Still works, but most code now uses `Pool` directly.
- The free `getPrisma()` and proxied `prisma` exports look duplicative. They are. Don't refactor without checking callers.

---

## 13. Vercel deployment specifics

- **Edge runtime** is the default for routes that scrape or call Gemini. **You MUST add `export const runtime = "edge"`** to:
  - Any route calling Gemini (Gemini calls often exceed 10s)
  - Any route doing external HTTP scrapes
  - The JSearch refresh route (because it does 4 parallel HTTP calls)
- **Node runtime** is required for routes that use `Buffer`, `fs`, or other Node-only APIs. The only one that needs Node is `/api/parse-cv` (because of PDF/DOCX libraries).
- Vercel Hobby limits:
  - Edge: 30s wall time, 1MB response
  - Node: 10s wall time
- **No Vercel Cron** (Pro feature). Refresh happens on user visit. If traffic dies for >2h, the next visitor pays the refresh latency.

---

## 14. Dev workflow

```bash
pnpm dev                    # localhost:3000
pnpm build                  # runs prisma generate + next build, useful to catch TS errors
pnpm dlx prisma migrate dev # apply schema changes to Neon
```

`.env.local` must include all 5 env vars (see Section 3).

For ad-hoc scrape testing without redeploying: `pnpm tsx scripts/enrich-jobs.ts` is one example pattern. You can also use the deployed `/api/jobs-health?testQuery=…` and `/api/scrape-jobs?source=akhtaboot` to probe specific sources.

---

## 15. Brand and visual rules

- **Background**: `#0A0716` (dark indigo-black)
- **Gold accent**: `#F5B82E` (CTA, "Hired" wordmark)
- **Purple accent**: `#3F2B96` (secondary gradient)
- All pages use the same gradient + dot-grid + grain texture stack
- All pages start with `<Navbar />` then a `<main className="relative min-h-screen overflow-x-hidden …">` shell
- Custom CSS classes only in `app/globals.css`. Never add a new CSS file.

---

## 16. How to debug the live job board specifically

1. **Hit `/api/jobs-health`** — shows per-source counts, fresh-vs-stale split, last fetch time. First stop for "why is X not showing".
2. **Hit `/api/jobs-health?testQuery=jobs+in+Jordan`** — ad-hoc JSearch call, shows what publishers come back.
3. **Hit `/api/scrape-jobs?source=linkedin&force=1`** — forces a single scraper to run, reports fetched count. Repeat for `akhtaboot`, `bayt`, `wuzzuf`, `fursa`, plus `_ae` / `_sa` variants for LinkedIn/Akhtaboot/Bayt.
4. **Hit `/api/scrape-jobs?all=1&force=1`** — runs every scraper in parallel.
5. **Hit `/api/live-jobs?force=1`** — wipes JSearch-sourced rows and re-fetches.
6. **Check Vercel logs** (Deployments → latest → Functions tab → click the route) for the `console.error` messages we added for Bayt/Wuzzuf failures.

---

## 17. Glossary

- **Hired Score**: 0–1000, computed deterministically from CV against the static `data/jobs.json` market. See `lib/score.ts`.
- **Track A / B / C**: original hackathon split — Track A (CV builder UI), Track B (jobs/score/dashboard), Track C (Gemini AI features). The split is fading; treat as historical.
- **JSearch**: third-party RapidAPI service backed by Google Jobs. Returns aggregated job listings with a `job_publisher` field identifying the origin board.
- **GeoId**: LinkedIn's internal location ID. Discovered via their typeahead API.
- **Throttle**: in this project, "throttle" refers to the 2-hour cool-down between refreshes for both JSearch and scrapers.
- **memCache**: in-memory cache (REMOVED). Was unreliable in serverless. Don't reintroduce.
- **`hired_cv`**: the localStorage key for the user's CV object.

---

## 18. Suggested next-feature priorities (from the user's recent direction)

1. Replace `data/jobs.json` reads in `/dashboard`, `/cover`, `/api/score` with live DB reads
2. Fix Bayt/Wuzzuf scraping (likely needs a proxy or different headers)
3. Drop dead code: `lib/store.ts`, unused Prisma models, the `gemini-2.0-flash` constant
4. Move all Supabase tables to Neon for a single source of truth (or vice versa)
5. Add background cron-job.org pinger (free) to auto-refresh every 2h without depending on user visits
6. Add "Save job" / "Hide job" buttons with localStorage persistence
7. Polish the cofounder embedding matcher — currently uses a tiny hardcoded vocab; could swap to Gemini text embeddings

---

## 19. When in doubt

- Re-read `lib/types.ts` before touching anything that handles a CV or Job
- Re-read `app/api/live-jobs/route.ts` and `app/api/scrape-jobs/route.ts` before changing job-fetching logic — there are TWO refresh paths that must respect each other
- Don't reintroduce module-level caches — Vercel functions are ephemeral
- Don't hardcode source names on JSearch results — use `job_publisher`
- Don't tighten regex too much (the `\bare\b` matching "are" is a cautionary tale)
- Don't fall back to a busy-loop scrape on every page load — there's a throttle
- Always add `export const runtime = "edge"` to new routes that scrape or call Gemini

End of handoff.
