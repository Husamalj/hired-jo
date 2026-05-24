# Hired.jo — Full Project Handoff (Updated May 2026)

> **This is the single source of truth for the entire project.**
> Read this file before touching anything. It covers everything built, every file that exists, every API route, every integration, and all env vars.
> Live site: https://hiredjo.com (also deployed at https://hired-jo-zrgu.vercel.app)
> GitHub: https://github.com/Husamalj/hired-jo

---

## Stack

- **Framework:** Next.js App Router. No `src/` folder. All imports use `@/*` → project root.
- **Styling:** Tailwind v4 + custom CSS utility classes in `app/globals.css`. Never add new CSS files.
- **Database:** Neon PostgreSQL via Prisma v7. Adapter: `@prisma/adapter-neon`. Client in `lib/db.ts`.
- **Auth:** Supabase Auth (email + Google OAuth). Browser client: `lib/supabase-browser.ts`. Server client: `lib/supabase-server.ts`.
- **AI:** Google Gemini 2.5 Flash via `@google/generative-ai`. All AI logic in `lib/gemini.ts`.
- **Payments:** Lemon Squeezy (replaced Paddle which was rejected). Store ID: 385021 at hiredjo.lemonsqueezy.com.
- **Deployment:** Vercel. Auto-deploys on push to `main`. ~30s deploy time.
- **Theme:** Dark. Background `#0A0716`, gold `#F5B82E`, purple `#3F2B96`.

---

## Environment Variables (all set in Vercel + `.env.local`)

```
# Database
DATABASE_URL=<neon postgres connection string>
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>

# AI
GEMINI_API_KEY=<google ai studio key>

# Jobs APIs
RAPIDAPI_KEY=<jsearch rapidapi key>

# Email
RESEND_API_KEY=<resend api key>

# Payments — Lemon Squeezy
LEMONSQUEEZY_API_KEY=<lemon squeezy jwt key>
LEMONSQUEEZY_STORE_ID=385021
LEMONSQUEEZY_WEBHOOK_SECRET=hiredjo_lms_webhook_2026
LMS_VARIANT_PRO=1694502
LMS_VARIANT_HIRED=1694491
LMS_VARIANT_CV_PACK=1694505
LMS_VARIANT_EDIT_PACK=1694508
LMS_VARIANT_COVER_PACK=1694511

# Admin
ADMIN_EMAILS=khalidmasoud4321@gmail.com
```

---

## Supabase Database Tables

### `user_subscriptions`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | FK to auth.users |
| tier | text | "free" \| "pro" \| "hired" |
| status | text | "active" \| "cancelled" \| "expired" |
| lms_subscription_id | text | Lemon Squeezy subscription ID |
| current_period_end | timestamptz | When subscription expires |
| updated_at | timestamptz | |

### `user_usage`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | FK to auth.users |
| period | text | "YYYY-MM" format |
| cv_builds | int | Monthly count |
| ai_edits | int | Monthly count |
| cover_letters | int | Monthly count |
| cv_builds_lifetime | int | Lifetime total (free tier check) |
| cover_letters_lifetime | int | Lifetime total (free tier check) |
| cv_builds_bonus | int | From purchased packs |
| ai_edits_bonus | int | From purchased packs |
| cover_letters_bonus | int | From purchased packs |
| updated_at | timestamptz | |

### `user_purchases`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| pack_type | text | "cv_pack" \| "edit_pack" \| "cover_pack" |
| quantity | int | Units added |
| lms_order_id | text | Lemon Squeezy order ID |
| created_at | timestamptz | |

### `saved_jobs`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | FK to auth.users |
| job_id | text | Job ID from live-jobs API |
| created_at | timestamptz | |

---

## Tier System

Defined in `lib/tiers.ts`. Never redefine these.

| Feature | Free | Pro (6 JOD/mo) | Hired (15 JOD/mo) |
|---|---|---|---|
| CV builds | 1 lifetime | 5/month | 20/month |
| AI section edits | 2/month | 15/month | 40/month |
| Cover letters | 1 lifetime | 10/month | 30/month |
| Job matching | Basic (score + skills) | Advanced (+ tailored summary + learning plan) | Same as Pro |
| Jobs For You section | ❌ (upsell shown) | ✅ Top 6 auto-matched | ✅ |
| Cover letter pre-fill from job | ❌ | ✅ | ✅ |
| Talent profile visibility | Normal | Mid | High + badge |

One-time packs (2 JOD each): CV Pack (+3 builds), Edit Pack (+10 edits), Cover Pack (+5 letters).

Admin emails (set in `ADMIN_EMAILS` env var) bypass all limits and have no usage tracking.

---

## localStorage Keys (browser)

| Key | Written by | Read by | Contents |
|---|---|---|---|
| `hired_cv` | `/build` page | `/jobs`, `/score`, `/roast`, `/cover`, `/profile` | Full `CV` object (see `lib/types.ts`) |
| `hired_cv_draft` | `/build` page | `/build` page on mount | Partial answers + stepId for resume |
| `hired_prefill_job` | `JobCard` (after check fit) | `/cover` page on mount | Full `Job` object for cover letter pre-fill |

---

## All Pages

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page. Scroll-driven canvas animation (145 JPEG frames in `/public/frames/`). Frame 0 shows instantly, rest load in background. Feature grid, stats, QR code → `/roast`. |
| `/build` | `app/build/page.tsx` | CV builder. Conversational AI interview (structured questions, not free-form chat). Voice input supported. Requires auth — 401 redirects to `/auth/login?next=/build`. Draft saved to localStorage. |
| `/jobs` | `app/jobs/page.tsx` | Live job board. Filters: type, sector, source, country, city, seniority, remote, sort. "Jobs For You" section for Pro/Hired auto-ranks jobs by CV match. Free users see upsell. |
| `/score` | `app/score/page.tsx` | Hired Score 0-1000 across 4 dimensions. Saves to leaderboard. |
| `/dashboard` | `app/dashboard/page.tsx` | Market dashboard with Recharts charts over live job data. |
| `/roast` | `app/roast/page.tsx` | AI CV roast — brutal but funny feedback + 5 actionable tips. |
| `/cover` | `app/cover/page.tsx` | Cover letter generator. Reads `hired_prefill_job` from localStorage for pre-fill from job board. Auth + usage limits enforced. |
| `/cofounder` | `app/cofounder/page.tsx` | Co-founder matching via embeddings. 3-step form. |
| `/leaderboard` | `app/leaderboard/page.tsx` | Top scores. Auto-refreshes every 5s. |
| `/talent` | `app/talent/page.tsx` | Talent marketplace. Profiles sorted by tier (Hired → Pro → Free). |
| `/profile` | `app/profile/page.tsx` | User profile. Shows CV, usage bars, subscription tier, saved jobs, settings. |
| `/pricing` | `app/pricing/page.tsx` | Pricing page. Free/Pro/Hired + one-time packs. Lemon Squeezy checkout. |
| `/auth/login` | `app/auth/login/page.tsx` | Login/signup. Google OAuth + email/password. Reads `?next=` param for redirect after auth. |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase OAuth callback handler. |
| `/about` | `app/about/page.tsx` | About page. |
| `/terms` | `app/terms/page.tsx` | Terms of service (references Lemon Squeezy). |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy. |
| `/refund` | `app/refund/page.tsx` | Refund policy (references Lemon Squeezy). |
| `/learn` | `app/learn/page.tsx` | Learning roadmap page. |
| `/sitemap.xml` | `app/sitemap.ts` | XML sitemap pointing to hiredjo.com. |
| `/robots.txt` | `app/robots.ts` | Robots rules, allows all, sitemap link. |

---

## All API Routes

### CV & AI

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/build-cv` | POST | Required (401) | Builds CV from structured answers. Checks + increments `cv_builds` limit. Body: `{ answers: StructuredAnswers }`. Returns `{ cv: CV }`. |
| `/api/edit-cv-section` | POST | Required (401) | AI rewrites one CV section. Checks + increments `ai_edits` limit. Body: `{ cv, section, prompt }`. Returns `{ section, edited }`. |
| `/api/roast` | POST | None | Roasts CV with Gemini. Body: `{ cv }`. Returns `{ roast, advice }`. |
| `/api/cover` | POST | Required (401) | Generates cover letter. Checks + increments `cover_letters` limit. Body: `{ cv, jobId? }` or `{ cv, job? }` (full job object for live job pre-fill). Returns `{ letter }`. |
| `/api/score` | POST | None | Computes HiredScore. Body: `{ cv, alias? }`. Returns `HiredScore`. |
| `/api/parse-cv` | POST | None | Parses uploaded CV text into CV object using Gemini. Body: `{ text }`. Returns `{ cv }`. |

### Jobs

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/live-jobs` | GET | None | Returns live jobs from JSearch + Gemini grounding. Cached 1 hour. Falls back to `data/jobs.json`. |
| `/api/match` | POST | None (tier from cookie) | CV-to-job matching. Free: score + matched/missing skills (lite Gemini prompt). Pro/Hired: full match + rewritten summary + learning plan. Body: `{ cv, job }`. Returns `MatchResult + { tier }`. |
| `/api/scrape-jobs` | GET | None | Background scraper. `?all=1` runs all scrapers. |
| `/api/diverse-jobs` | GET | None | Fetches diverse/non-tech jobs. |

### Auth & User

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/subscription` | GET | Optional | Returns `{ tier, realTier, usage, limits, isAdmin }`. Admin gets `realTier` vs `tier` (which may be overridden by `admin_view_as` cookie). |
| `/api/admin/set-view` | POST | Admin only | Sets `admin_view_as` cookie to simulate a tier. Body: `{ tier: "free"\|"pro"\|"hired"\|"real" }`. |

### Payments

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/lemonsqueezy/checkout` | POST | Required | Creates Lemon Squeezy hosted checkout. Body: `{ variantId }`. Returns `{ checkoutUrl }`. |
| `/api/lemonsqueezy/webhook` | POST | HMAC verified | Handles LMS events: `subscription_created/updated/resumed/cancelled/expired`, `order_created`. Upserts `user_subscriptions`, applies packs to `user_usage`. |

### Other

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/leaderboard` | GET | None | Top 20 leaderboard entries. |
| `/api/cofounder` | POST | None | Co-founder register/match via embeddings. |
| `/api/talent` | GET/POST | Optional | Talent marketplace. GET returns profiles. POST registers/updates profile. |
| `/api/chat` | POST | None | Chat endpoint (legacy CV builder chat mode). |

---

## All Components

| Component | File | Description |
|---|---|---|
| `Navbar` | `components/Navbar.tsx` | Top nav with logo + all links + auth state. Import on every page. |
| `Footer` | `components/Footer.tsx` | Site footer. Added to root layout. |
| `AdminBar` | `components/AdminBar.tsx` | Floating pill bar (admin only). Buttons: Real / Free / Pro / Hired. Sets `admin_view_as` cookie and reloads. Only renders when `isAdmin: true` from `/api/subscription`. |
| `JobCard` | `components/JobCard.tsx` | Job card with flip animation. "Check fit" calls `/api/match`. Free: shows locked Pro panel. Pro/Hired: shows tailored summary + learning plan + cover letter pre-fill button (📄). |
| `CvPreview` | `components/CvPreview.tsx` | White CV template. Smart section ordering. PDF + Word download. Hides empty sections. |
| `CvBulkForm` | `components/CvBulkForm.tsx` | Single-page form for all CV fields. Auto-saves to `hired_cv` localStorage. |
| `CvSectionEditor` | `components/CvSectionEditor.tsx` | AI section editor. Sections: Summary, Experience, Projects, Skills (skillCategories), Education, Certifications, Achievements, Languages. Syncs `skillCategories` ↔ `skills` flat array. Auth required (shows inline error). Usage limit: UpgradeModal on 402. Lemon Squeezy checkout. |
| `CvUploadBanner` | `components/CvUploadBanner.tsx` | Banner on `/jobs` for users without a CV. Upload or paste existing CV. |
| `UpgradeModal` | `components/UpgradeModal.tsx` | Modal shown when usage limit hit. Shows Pro (6 JOD) + Hired (15 JOD) + one-time pack option. Calls Lemon Squeezy checkout. |
| `DashboardCharts` | `components/DashboardCharts.tsx` | Recharts charts for dashboard. |
| `HiredScore` | `components/HiredScore.tsx` | Score card component. |
| `VoiceRecorder` | `components/VoiceRecorder.tsx` | Mic button for voice input in CV builder. Uses Web Speech API. |
| `SourceFilter` | `components/SourceFilter.tsx` | Job source filter dropdown with counts. |
| `FilterDropdown` | `components/FilterDropdown.tsx` | Generic filter dropdown. |
| `MultiSelectDropdown` | `components/MultiSelectDropdown.tsx` | Multi-select dropdown (used for sector filter). |

---

## Key Library Files

| File | Description |
|---|---|
| `lib/types.ts` | All shared TypeScript types. **Never redefine — always import from here.** `CV`, `Job`, `MatchResult`, `HiredScore`, `LearningStep`, `LeaderboardEntry` |
| `lib/tiers.ts` | Tier constants: `TIERS`, `LIMITS`, `PACK_QUANTITIES`, `UsageKey`, `Tier`. `getMonthlyLimit()`, `getTierLabel()`. |
| `lib/usage.ts` | Server-side usage functions: `getUserTier()`, `getUsage()`, `checkLimit()`, `incrementUsage()`, `applyPurchasedPack()`. Uses Supabase service role. Admin bypass built in. |
| `lib/gemini.ts` | All Gemini AI functions: `chat()`, `roastCv()`, `matchCvToJob()`, `matchCvToJobLite()`, `enrichJob()`, `generateCoverLetter()`, `parseCvFromText()`. |
| `lib/embeddings.ts` | `embed(text)` → `number[]`, `cosine(a, b)` → similarity 0–1. |
| `lib/score.ts` | `computeScore(cv: CV): HiredScore`. Pure function. |
| `lib/db.ts` | Prisma singleton with PrismaNeon adapter. |
| `lib/store.ts` | In-memory store for leaderboard + cofounder (dev). |
| `lib/user-data.ts` | Client-side user data: `loadCvFromAccount()`, `syncCvToAccount()`, `loadSavedJobIds()`, `saveJob()`, `unsaveJob()`. |
| `lib/supabase-browser.ts` | `createSupabaseBrowserClient()` — for client components. |
| `lib/supabase-server.ts` | `createSupabaseServerClient()` — for API routes (uses cookies). |

---

## CV Builder — How It Works

The `/build` page is a conversational AI interview. **Not** free-form chat — uses a structured question flow.

### Question flow (in order)
1. Template: fresher or experienced?
2. Name, phone, email, location
3. University, degree, major, grad year, GPA (optional)
4. Target role
5. Work experience (loops per company: role, dates, description) — skipped for freshers
6. Projects (loops: name, description, tools, result, GitHub link)
7. Skills split into 5 categories: Programming Languages, Frameworks, Tools, Networking/Cloud, Soft Skills
8. Certifications loop (up to 5): name, issuer, year — or "skip"
9. Awards
10. Volunteering
11. Coursework (freshers only)
12. Languages
13. LinkedIn, GitHub, Portfolio URLs
14. Done → "Build my CV" button

### Draft system
- Every answer saves to `localStorage` key `hired_cv_draft` as `{ answers: StructuredAnswers, stepId, history }`
- On page load: restores draft. If `stepId === "done"` → shows "Build my CV" button immediately
- If user has existing `hired_cv` in localStorage → shows existing CV (no re-interview)

### Auth requirement
- Checks Supabase session on mount
- If not logged in: shows sticky gold banner "Sign in required"
- On 401 from `/api/build-cv`: shows message, redirects to `/auth/login?next=/build` after 1.8s
- Draft is saved before redirect so answers are preserved

### `buildCvFromDraft()` 
Calls `/api/build-cv` with `StructuredAnswers`. The API uses Gemini to generate a full CV object matching `lib/types.ts`. Result saved to `localStorage` under `hired_cv` AND synced to Supabase via `syncCvToAccount()`.

---

## Job Matching — Tier Behavior

`/api/match` POST `{ cv, job }`:

**Free / anonymous:** Calls `matchCvToJobLite()` — cheaper Gemini prompt, returns only `{ jobId, score, matchedSkills, missingSkills, tier: "free" }`.

**Pro / Hired:** Calls `matchCvToJob()` — full Gemini prompt, returns `{ jobId, score, matchedSkills, missingSkills, rewrittenSummary, learningPlan, tier: "pro"|"hired" }`.

In `JobCard.tsx`:
- Free result: shows score + skills + locked purple panel "Pro: AI-tailored summary + 3-step learning plan"
- Pro/Hired result: shows score + skills + rewritten summary + learning plan with resource links
- Pro/Hired result: shows 📄 cover letter button → stores job in `hired_prefill_job` localStorage → navigates to `/cover`

---

## Admin View-As System

Allows admin to simulate any tier without changing their actual subscription.

**How it works:**
1. `AdminBar` component (in root layout) fetches `/api/subscription`
2. If `isAdmin: true`, renders floating pill at bottom-center: `[Real] [Free] [Pro] [Hired]`
3. Clicking a tier POSTs to `/api/admin/set-view` → sets cookie `admin_view_as`
4. Page reloads — `/api/subscription` returns overridden tier
5. All tier-gated UI reflects the selected view (Jobs For You, match depth, upgrade prompts)
6. "Real" removes the cookie → reverts to actual tier
7. Cookie lasts 24 hours

---

## Lemon Squeezy Payment Flow

### Checkout
1. User clicks upgrade button anywhere → calls `/api/lemonsqueezy/checkout` with `variantId`
2. API creates hosted checkout via LMS API, passes `user_id` as custom data
3. Returns `checkoutUrl` → client redirects

### Webhook (`/api/lemonsqueezy/webhook`)
Verifies HMAC-SHA256 signature via `x-signature` header.

Events handled:
- `subscription_created` / `subscription_updated` / `subscription_resumed` → upsert `user_subscriptions` with tier + status
- `subscription_cancelled` / `subscription_expired` → set status to cancelled/expired
- `order_created` → if variant matches a pack → calls `applyPurchasedPack()` + inserts `user_purchases`

Variant → tier/pack mapping via env vars (`LMS_VARIANT_PRO`, `LMS_VARIANT_HIRED`, etc.)

### Lemon Squeezy Products
| Product | Variant ID | Price |
|---|---|---|
| Pro Plan | 1694502 | 6 JOD/month |
| Hired Plan | 1694491 | 15 JOD/month |
| CV Pack | 1694505 | 2 JOD one-time |
| Edit Pack | 1694508 | 2 JOD one-time |
| Cover Pack | 1694511 | 2 JOD one-time |

---

## Landing Page Performance Fix

`app/page.tsx` scroll-driven canvas animation:
- **145 JPEG frames** in `/public/frames/f000.jpg` → `f144.jpg`
- Frame 0 loads and displays immediately (< 200ms) — no more black loading screen
- Scroll listener attaches as soon as frame 0 is ready
- Remaining frames load in background; small corner progress bar shows `XX%`
- Once all frames loaded, corner bar disappears

---

## SEO / Meta

- `app/sitemap.ts` → `/sitemap.xml` pointing to hiredjo.com
- `app/robots.ts` → `/robots.txt` allowing all crawlers
- Full OpenGraph + Twitter card meta in `app/layout.tsx`
- JSON-LD schema: Organization, WebSite, WebApplication
- Arabic keywords included for Jordanian search traffic
- Bing verification: `msvalidate.01` in layout head

---

## Rules — Never Break These

1. **Never redefine types.** Always import from `lib/types.ts`.
2. **Never create new CSS files.** Add to `app/globals.css` only if truly needed.
3. **Always import `<Navbar />`** from `@/components/Navbar` on every new page.
4. **CV localStorage key is `hired_cv`** — always a valid `CV` object from `lib/types.ts`.
5. **`skillCategories` and `skills` must stay in sync** — when editing skills via AI, update both. `skillCategories` is the source of truth for display; `skills` (flat array) is used by scoring/matching.
6. **Auth in API routes:** Use `createSupabaseServerClient()` and check `user`. Return 401 if not authenticated for protected routes.
7. **Usage limits:** Always call `checkLimit()` before AI operations, `incrementUsage()` after success.
8. **Lemon Squeezy only** — Paddle was rejected. All checkout/webhook code uses LMS.
9. **Do not touch** `data/jobs.json`, `lib/score.ts`, `lib/store.ts`, `components/DashboardCharts.tsx` without understanding their downstream effects.

---

## Dev Commands

```bash
pnpm dev                        # local dev on localhost:3000
pnpm build                      # prisma generate + next build
pnpm dlx prisma migrate dev     # run after schema changes
```

---

## Pending / Known Issues

- **Lemon Squeezy identity review** — still pending approval. Once approved: connect bank, disable test mode.
- **Paddle appeal** — submitted ~May 2026, response expected ~May 28. If approved, could use as backup.
- **support@hiredjo.com** — set up via Cloudflare Email Routing → forwards to Gmail. DNS records need adding.
- **Resend domain verification** — add DNS records in Cloudflare for hiredjo.com so email confirmation works.
- **"Priority support"** label on pricing page — no backend enforcement, just a label.
- **JSearch location filtering** — JSearch sometimes returns jobs in wrong country. City validation should be added to `app/api/live-jobs/route.ts` (see original PLAN.md for the fix).
