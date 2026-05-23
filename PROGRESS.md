# Hired.jo — Project Progress & Handout

> Last updated: May 23, 2026  
> Live site: **[hiredjo.com](https://hiredjo.com)**  
> GitHub: https://github.com/Husamalj/hired-jo  
> Owner: Khalid Masoud — khalidmasoud4321@gmail.com

---

## 🧠 READ THIS FIRST — Context for New Claude Sessions

This file is the full truth about the project. Read it before touching anything.

### What Hired.jo is
AI-powered career copilot for Jordanian/Arab graduates. Built at HU AI Employability Hackathon 2026. Features: AI CV builder (chat interview → Gemini generates CV), CV Roast, Cover Letter, Job listings (Akhtaboot/Bayt/Wuzzuf), Hired Score, Talent Marketplace, Co-founder Matching, Leaderboard.

### Payment situation (IMPORTANT)
- We tried **Paddle** as Merchant of Record. Got approved for KYB then **rejected** because they flagged "CV Builders" and "Job Boards" as unsupported categories.
- We submitted an **appeal** on May 23 2026. Paddle said wait 3 days.
- In parallel we started **Lemon Squeezy** signup as backup. Store name: `hiredjo`, country: Jordan.
- **All Paddle code is still in the codebase** — routes, webhooks, env vars. It is NOT dead code yet — we're keeping it while waiting for the appeal. If appeal fails, we swap to Lemon Squeezy.
- The Paddle products ARE created (5 price IDs exist in `.env.local`). Webhook is registered at `https://hiredjo.com/api/paddle/webhook`. Webhook secret is set.
- **Paddle verification is NOT approved yet** — checkout buttons will fail for real users until either: (a) appeal succeeds, or (b) we swap to Lemon Squeezy.

### What the owner is waiting for
1. **Paddle appeal response** — 3 business days from May 23. Email will come to khalidmasoud4321@gmail.com.
2. **Lemon Squeezy store creation** — got rate-limited (429) during setup. Try again at app.lemonsqueezy.com.
3. **ADMIN_EMAILS env var on Vercel** — needs to be added: Key=`ADMIN_EMAILS`, Value=`khalidmasoud4321@gmail.com`. This gives the owner unlimited usage (no limit modal).
4. **PADDLE_WEBHOOK_SECRET on Vercel** — needs to be added: `ntfset_01ks92309scqtg5x33pm6dxd7j` (already in `.env.local` but must be added to Vercel env vars too).

---

## ✅ What's Built & Working

### 🌐 Domain & Deployment
- **hiredjo.com** — bought via Cloudflare Registrar (~$10/year)
- Connected to Vercel via auto-configure DNS
- SSL auto-issued — fully HTTPS
- Old `hired-jo-zrgu.vercel.app` still resolves
- Already indexed on Google (#1 for "hiredjo")

### 🔐 Auth System (Supabase Auth)
- Google OAuth (one-click)
- Email + Password (sign up / confirm / sign in)
- Session persists across devices
- Auth callback at `/auth/callback`
- Middleware: `middleware.ts` refreshes session on every request

### 👤 Navbar & Profile
- Signed-in: shows name + avatar (Google pic or gold initials)
- Dropdown: My Profile, My CV, My Score, Saved Jobs, My Talent Profile, Sign out
- Primary links: Build CV · Find Jobs · Roast CV
- More ▾ dropdown: Score, Dashboard, Leaderboard, Co-founder, Talent, Cover Letter, Pricing, About
- Mobile: fullscreen hamburger menu
- Profile page at `/profile`: shows tier badge, usage bars (CV builds / AI edits / cover letters), bonus pack credits, quick links

### 💾 Data Persistence (Supabase)
- CV syncs to `user_cvs` table on save
- Saved jobs persist to `user_saved_jobs`
- Score history in `user_scores`
- Talent profiles in `talent_profiles`
- All data loads on sign-in from any device

### 🧠 CV Builder (/build)
- Conversational AI interview — one question at a time
- Gemini 2.5 Flash generates structured CV JSON
- Cursor auto-stays in input after Enter (fixed multiple times — current fix: `useEffect` watches `thinking` + `stepId`)
- Page does NOT scroll on load (fixed: only scrolls when new message added after initial render)
- Draft saves to localStorage key `build_draft`
- CV saves to localStorage key `hired_cv` + syncs to Supabase
- PDF + Word download via `CvPreview` component
- AI section editor (`CvSectionEditor`) — edit any section with AI prompt
- Limit enforced: free users get 1 CV build lifetime, then UpgradeModal

### 📄 CV Roast (/roast)
- Roast + 5 actionable tips
- Gemini knows today's date (injected into system prompt — fixed hallucination bug)
- Model: Gemini 2.5 Flash

### 💼 Jobs (/jobs)
- Live jobs from Akhtaboot, Bayt, Wuzzuf + more via RapidAPI
- Multi-sector filter dropdown
- CV upload shortcut banner
- Bookmark/save jobs (localStorage + Supabase)
- Saved Jobs filter: `/jobs?saved=1` — navbar "Saved Jobs" link goes here
- Check Fit button (matches CV to job using Gemini)

### 🏆 Other Pages
- `/score` — Hired Score calculator
- `/dashboard` — market charts
- `/leaderboard` — top CVs ranked
- `/cofounder` — co-founder matching
- `/talent` — talent marketplace (browse + create profile)
- `/cover` — AI cover letter generator
- `/about` — story, team, contact
- `/pricing` — 3-tier pricing cards with ✓/🔒, one-time packs section
- `/profile` — user tier + usage bars + quick links
- `/terms` — Terms of Service (required for Paddle verification)
- `/privacy` — Privacy Policy
- `/refund` — Refund Policy

---

## 💳 Monetization System (Fully Coded, Payment Pending)

### Tiers
| Tier | Price | CV Builds | AI Edits | Cover Letters |
|------|-------|-----------|----------|---------------|
| Free | 0 JOD | 1 (lifetime) | 2/month | 1 (lifetime) |
| Pro | 6 JOD/mo | 5/month | 15/month | 10/month |
| Hired | 15 JOD/mo | 20/month | 40/month | 30/month |

### One-time packs
| Pack | Price | Quantity |
|------|-------|----------|
| CV Pack | 2 JOD | +3 CV builds |
| Edit Pack | 2 JOD | +10 AI edits |
| Cover Pack | 2 JOD | +5 cover letters |

### Key files
- `lib/tiers.ts` — single source of truth for limits, price IDs, tier types
- `lib/usage.ts` — `checkLimit()`, `incrementUsage()`, `getUserTier()`, `applyPurchasedPack()`, `isAdmin()`
- `hooks/useUsage.ts` — client hook fetching `/api/subscription`
- `components/UpgradeModal.tsx` — shown when 402 returned from API
- `app/api/subscription/route.ts` — GET returns `{ tier, usage, limits }`
- `app/api/paddle/checkout/route.ts` — POST creates Paddle transaction, returns `{ checkoutUrl }`
- `app/api/paddle/webhook/route.ts` — handles Paddle events, updates Supabase

### Supabase tables (already created)
- `user_subscriptions` — tier, status, paddle_subscription_id, paddle_customer_id, current_period_end
- `user_usage` — cv_builds, ai_edits, cover_letters, lifetime counters, bonus fields. Unique on (user_id, period)
- `user_purchases` — pack purchases log. Unique on paddle_transaction_id

### Admin bypass
- `lib/usage.ts` → `isAdmin()` checks `ADMIN_EMAILS` env var
- If user's email is in that list → `checkLimit()` always returns `{ allowed: true, remaining: 999 }`
- Add `ADMIN_EMAILS=khalidmasoud4321@gmail.com` to Vercel env vars (NOT yet done as of May 23)

### Paddle env vars (all in `.env.local`, need to be in Vercel too)
```
PADDLE_WEBHOOK_SECRET=ntfset_01ks92309scqtg5x33pm6dxd7j
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_01bb3772ad8de14104dc6ad3b4f
PADDLE_API_KEY=pdl_live_apikey_***  ← in .env.local, add to Vercel
NEXT_PUBLIC_PADDLE_ENV=production
PADDLE_PRICE_PRO=pri_01ks8zjd2qndbrk324h9fefzs3
PADDLE_PRICE_HIRED=pri_01ks8zn84j2h4gyrra2sxfg7x0
PADDLE_PRICE_CV_PACK=pri_01ks8zwahhx6sk8925casb4tnn
PADDLE_PRICE_EDIT_PACK=pri_01ks8zym2k432tr2dapbj5f2vd
PADDLE_PRICE_COVER_PACK=pri_01ks900bj5tsppdbc8xg4a6wb0
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_01ks8zjd2qndbrk324h9fefzs3
NEXT_PUBLIC_PADDLE_PRICE_HIRED=pri_01ks8zn84j2h4gyrra2sxfg7x0
NEXT_PUBLIC_PADDLE_PRICE_CV_PACK=pri_01ks8zwahhx6sk8925casb4tnn
NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK=pri_01ks8zym2k432tr2dapbj5f2vd
NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK=pri_01ks900bj5tsppdbc8xg4a6wb0
```

---

## 🐛 All Bugs Fixed (Full History)

| Bug | Fix |
|-----|-----|
| Job card detail panel wouldn't scroll | `overflow-hidden` → `overflow-y-auto` |
| Roast AI gave wrong dates | Injected `today's date` into Gemini system prompt |
| Landing page had old hardcoded navbar | Replaced with shared `<Navbar />` |
| Google OAuth redirected to localhost | Fixed Supabase Site URL to `hiredjo.com` |
| Google OAuth "test users only" | Published OAuth app to production |
| CV builder: `gemini-2.0-flash` 404 | Switched to `gemini-2.5-flash` (confirmed via `node test-gemini.mjs`) |
| CV builder: JSON parse error | Fixed model name + `extractJson()` strips markdown fences |
| Input lost focus after Enter | `useEffect` watches `thinking` + `stepId`, calls `inputRef.current?.focus()` |
| Page scrolled down on CV builder load | Track message count with `useRef`, only scroll when count increases |
| Duplicate footer on homepage | Removed inline `<footer>` from `app/page.tsx` |
| Saved Jobs showed all jobs | Added `?saved=1` param + filter in useMemo |
| `runtime = "edge"` broke usage tracking | Changed to `runtime = "nodejs"` on all API routes using Supabase service client |
| Pricing page was comparison table | Reverted to card layout per user preference |
| Paddle checkout failing | Paddle KYB rejected — appeal submitted, Lemon Squeezy as backup |

---

## ⚠️ Known Issues / Dead Code Risks

### Paddle code — NOT dead yet
`app/api/paddle/checkout/route.ts` and `app/api/paddle/webhook/route.ts` are fully coded but **checkout will fail** until Paddle approves the appeal OR we swap to Lemon Squeezy. Do NOT delete this code. Wait for appeal result.

### Lemon Squeezy migration plan (if Paddle appeal fails)
- Create store at app.lemonsqueezy.com (got rate-limited May 23, try again)
- Create 5 products matching current Paddle products
- Add new env vars: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `NEXT_PUBLIC_LS_PRICE_*`
- Replace `app/api/paddle/checkout/route.ts` → `app/api/ls/checkout/route.ts`
- Replace `app/api/paddle/webhook/route.ts` → `app/api/ls/webhook/route.ts`
- Update `app/pricing/page.tsx` to use new price IDs
- Lemon Squeezy webhook events: `order_created` (one-time), `subscription_created`, `subscription_updated`, `subscription_cancelled`

### Cover letter limit enforcement
`/api/cover` route does NOT have limit checking yet (only `/api/build-cv` and `/api/edit-cv-section` do). If you add it, follow same pattern: check limit → 402 → `UpgradeModal`.

### Talent profile visibility levels
Pricing page shows "Normal / Mid / High" visibility per tier, but the actual talent marketplace (`/talent`) does NOT filter or rank by tier yet. This is a planned feature, not yet implemented.

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router (no `src/`, alias `@/*` → root) |
| Styling | Tailwind v4 + custom classes in `app/globals.css` |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Neon PostgreSQL (jobs cache via Prisma) + Supabase (user data) |
| ORM | Prisma v7 with `@prisma/adapter-neon` |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Payments | Paddle (pending approval) / Lemon Squeezy (backup) |
| Domain | Cloudflare Registrar + DNS |
| Hosting | Vercel Hobby plan |
| Icons | lucide-react |

---

## 📁 File Ownership

| Area | Owner | Key Files |
|------|-------|-----------|
| Types (shared) | Track B | `lib/types.ts` — **never redefine** |
| CV Builder | Track A | `app/build/page.tsx` |
| CV Components | Track B | `components/CvPreview.tsx`, `components/CvBulkForm.tsx` |
| Jobs, Score, Dashboard, Leaderboard, Co-founder, Navbar, Landing | Track B | `app/jobs/`, `components/Navbar.tsx`, `app/page.tsx` |
| CV Roast, Cover Letter, Gemini AI | Track C | `app/roast/`, `app/cover/`, `lib/gemini.ts` |
| Auth + User data | Post-hackathon | `lib/supabase-*.ts`, `lib/user-data.ts`, `middleware.ts` |
| Monetization | Post-hackathon | `lib/tiers.ts`, `lib/usage.ts`, `hooks/useUsage.ts`, `components/UpgradeModal.tsx`, `app/api/paddle/` |
| Pricing + Legal | Post-hackathon | `app/pricing/`, `app/profile/`, `app/terms/`, `app/privacy/`, `app/refund/` |

---

## 🔑 All Environment Variables

```bash
# AI
GEMINI_API_KEY=AIzaSyAHtSHdcfOGnI7v-Uf2IQX-Kn0wUazkLag

# Jobs API
RAPIDAPI_KEY=0d844d370cmshc5b46b5b7b0ebccp18e4f9jsnd4d2693ea1cf

# Neon PostgreSQL (jobs cache)
DATABASE_URL=postgresql://neondb_owner:...@ep-still-tree-aqacmpzd-pooler...

# Supabase
SUPABASE_URL=https://wszrnunkgswrwuecwnrk.supabase.co/
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://wszrnunkgswrwuecwnrk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← used in lib/usage.ts to bypass RLS

# Admin (MUST add to Vercel — not done yet as of May 23)
ADMIN_EMAILS=khalidmasoud4321@gmail.com

# Paddle (appeal pending — do NOT delete)
PADDLE_WEBHOOK_SECRET=ntfset_01ks92309scqtg5x33pm6dxd7j  ← add to Vercel too
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_01bb3772ad8de14104dc6ad3b4f
PADDLE_API_KEY=pdl_live_apikey_...
NEXT_PUBLIC_PADDLE_ENV=production
PADDLE_PRICE_PRO=pri_01ks8zjd2qndbrk324h9fefzs3
PADDLE_PRICE_HIRED=pri_01ks8zn84j2h4gyrra2sxfg7x0
PADDLE_PRICE_CV_PACK=pri_01ks8zwahhx6sk8925casb4tnn
PADDLE_PRICE_EDIT_PACK=pri_01ks8zym2k432tr2dapbj5f2vd
PADDLE_PRICE_COVER_PACK=pri_01ks900bj5tsppdbc8xg4a6wb0
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_01ks8zjd2qndbrk324h9fefzs3
NEXT_PUBLIC_PADDLE_PRICE_HIRED=pri_01ks8zn84j2h4gyrra2sxfg7x0
NEXT_PUBLIC_PADDLE_PRICE_CV_PACK=pri_01ks8zwahhx6sk8925casb4tnn
NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK=pri_01ks8zym2k432tr2dapbj5f2vd
NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK=pri_01ks900bj5tsppdbc8xg4a6wb0
```

> ⚠️ `.env.local` is gitignored. Keys above are in `.env.local` locally but must be manually added to Vercel → Settings → Environment Variables.

---

## 📋 Immediate TODO (as of May 23 2026)

- [ ] Add `ADMIN_EMAILS=khalidmasoud4321@gmail.com` to Vercel env vars
- [ ] Add `PADDLE_WEBHOOK_SECRET=ntfset_01ks92309scqtg5x33pm6dxd7j` to Vercel env vars
- [ ] Wait for Paddle appeal email (3 business days)
- [ ] If Paddle appeal approved → test real 2 JOD CV Pack purchase
- [ ] If Paddle appeal rejected → complete Lemon Squeezy setup + swap integration
- [ ] Add cover letter limit check to `/api/cover` route
- [ ] Implement talent profile visibility ranking by tier on `/talent`

## 💡 Future Ideas
- [ ] Arabic UI language toggle
- [ ] Email alerts for new matching jobs
- [ ] Recruiter-side: post jobs, browse talent
- [ ] LinkedIn import
- [ ] Premium CV templates
- [ ] Phone verification on signup (anti-abuse)
