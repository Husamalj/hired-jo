# Hired.jo — Project Progress

> Last updated: May 2026  
> Live site: **[hiredjo.com](https://hiredjo.com)**  
> GitHub: https://github.com/Husamalj/hired-jo

---

## ✅ What's Done

### 🌐 Domain & Deployment
- Bought **hiredjo.com** via Cloudflare Registrar (~$10/year, no markup)
- Connected to Vercel via auto-configure (DNS auto-set)
- SSL certificate auto-issued — site is fully HTTPS
- Old `hired-jo-zrgu.vercel.app` still works and redirects

### 🔐 Auth System (Supabase Auth)
- Google OAuth (one-click sign in with Google)
- Email + Password (sign up / sign in / confirm email)
- Session persists across devices
- Auth callback route at `/auth/callback`
- Middleware refreshes session on every request

### 👤 User Profile in Navbar
- Signed-in users see their **name + avatar** (Google pic or gold initials)
- Dropdown menu with: My CV, My Score, Saved Jobs, My Talent Profile, Sign out
- Navbar redesigned: only **Build CV · Find Jobs · Roast CV** visible
- Everything else in a **More ▾** dropdown
- Mobile: fullscreen hamburger menu

### 💾 Data Persistence (Supabase)
- CV syncs to user account on save
- Saved jobs persist to account
- Score history saved to account
- All data loads back when user signs in on a new device

### 🧠 CV Builder (/build)
- AI interview chat — asks questions one at a time
- Auto-focus on input on page load
- Cursor stays in input after pressing Enter (no re-clicking needed)
- Page no longer scrolls down on load
- CV generated using Gemini 2.5 Flash
- PDF + Word download after CV is generated

### 📄 CV Roast (/roast)
- Roast + 5 actionable improvement tips
- AI knows today's date (no more date hallucinations)
- Fixed: model updated to Gemini 2.5 Flash

### 💼 Jobs Page (/jobs)
- Live jobs from Akhtaboot, Bayt, Wuzzuf & 7 more boards
- Fixed scroll bug on job card detail panel
- Multi-sector filter dropdown
- CV upload shortcut banner
- Bookmark / save jobs (filled bookmark icon = saved)
- **Saved Jobs** filter — click from navbar → shows only bookmarked jobs
- URL: `/jobs?saved=1`

### 🏆 Talent Marketplace (/talent)
- Browse tab: filter by field, country, experience, skill
- My Profile tab: create/edit your talent profile (requires sign in)
- Free for both sides (candidates + companies)

### 🤝 Co-founder Matching (/cofounder)
- Match with other builders in Jordan

### 📊 Market Dashboard (/dashboard)
- Live market signals and charts

### 🏅 Leaderboard (/leaderboard)
- Top scored CVs ranked publicly

### ℹ️ About Page (/about)
- Story, Team, Contact sections
- Support/Donate section: "Coming soon" (Jordan payment restrictions — will use Paddle when we launch premium)
- Contact: khalidmasoud4321@gmail.com

### 🦶 Footer
- Site-wide footer on all pages: logo, nav links, copyright

### 🔍 SEO
- Custom meta titles + descriptions on all pages
- Arabic keywords added (وظائف الاردن, سيرة ذاتية, etc.)
- Open Graph + Twitter card tags
- JSON-LD structured data (Organization, WebSite, WebApplication)
- Sitemap at `/sitemap.xml`
- Site URL updated everywhere to `hiredjo.com`
- Already indexed on Google — shows up when searching "hiredjo"!

### 🎨 Branding
- Custom gold **H** favicon (replaces Vercel triangle)
- Dark theme: `#0A0716` bg, `#F5B82E` gold, `#3F2B96` purple

---

## 🔧 Bugs Fixed
| Bug | Fix |
|-----|-----|
| Job card detail panel wouldn't scroll | Changed `overflow-hidden` → `overflow-y-auto` |
| Roast AI gave wrong dates | Injected today's date into system prompt |
| Landing page had old hardcoded navbar | Replaced with shared `<Navbar />` component |
| Google OAuth redirected to localhost | Fixed Supabase Site URL to `hiredjo.com` |
| Google OAuth "test users only" | Published OAuth app to production |
| CV builder: `gemini-2.0-flash` 404 error | Switched to `gemini-2.5-flash` (confirmed working) |
| CV builder: JSON parse error | Fixed model + extractJson function |
| Input lost focus after sending message | Added `inputRef.current.focus()` after send |
| Page scrolled down on CV builder load | Only scroll after first user message |
| Duplicate footer on homepage | Removed inline footer from `app/page.tsx` |

---

## 🚧 In Progress / Next Steps

### Payments (when we add premium features)
- **Paddle** is the plan — works with Jordan, ~5% fee, no Stripe needed
- Set up when we launch paid features (e.g. premium CV templates, recruiter access)
- Ko-fi and BMC don't support Jordan payouts

### Things to test
- [ ] Full CV builder flow end-to-end
- [ ] Google sign in on mobile
- [ ] Saved jobs persist after sign out and back in
- [ ] Talent profile create + edit
- [ ] CV roast on a real CV
- [ ] Score page with a real CV

### Ideas / Future
- [ ] Arabic language support (UI in Arabic)
- [ ] Email notifications for new matching jobs
- [ ] Recruiter-side: post a job, browse talent
- [ ] Premium CV templates
- [ ] LinkedIn import

---

## 🧱 Tech Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router (no `src/`) |
| Styling | Tailwind v4 + custom classes in `globals.css` |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Neon PostgreSQL (jobs cache) + Supabase (user data) |
| ORM | Prisma v7 |
| AI | Google Gemini 2.5 Flash |
| Domain | Cloudflare Registrar + DNS |
| Hosting | Vercel (Hobby) |
| Icons | lucide-react |

---

## 📁 Who Owns What
| Area | Owner | Key files |
|------|-------|-----------|
| CV Builder | Track A | `app/build/page.tsx` |
| Jobs, Score, Dashboard, Leaderboard, Co-founder, Navbar, Landing | Track B | `app/jobs/`, `app/score/`, etc. |
| CV Roast, Cover Letter, Gemini AI | Track C | `app/roast/`, `lib/gemini.ts` |
| Types (shared) | Track B | `lib/types.ts` — never redefine |
| Auth + User data | Added post-hackathon | `lib/supabase-*.ts`, `lib/user-data.ts` |

---

## 🔑 Environment Variables Needed
```
GEMINI_API_KEY=
RAPIDAPI_KEY=
DATABASE_URL=          # Neon PostgreSQL
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
> ⚠️ Never commit `.env.local` — it's in `.gitignore`
