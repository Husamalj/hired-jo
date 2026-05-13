# Hired.jo — AI Career Copilot for Jordanian Graduates

> Built at **HU AI Employability Hackathon 2026**
> **Live Demo:** https://hired-jo-zrgu.vercel.app

---

## What It Does

Hired.jo is an AI-powered career assistant that helps Jordanian graduates find jobs, build CVs, and prepare for the job market.

**Core user flow:**
1. **Build your CV** → paste your info in one shot, AI structures it into a professional CV (PDF + Word download)
2. **Get your Hired Score** → AI scores your CV 0–1000 based on market demand
3. **Browse live jobs** → real-time jobs from LinkedIn, Indeed, Akhtaboot, Bayt, Wuzzuf, and more
4. **Check job fit** → AI matches your CV against any job and shows matched/missing skills + learning plan
5. **Roast your CV** → AI gives brutally honest feedback
6. **Generate a cover letter** → AI writes a tailored cover letter for any job

---

## AI Integration (Real API Calls)

All AI features use **Google Gemini 2.0 Flash** via live API calls — no mocked responses.

| Feature | How AI is used |
|---|---|
| CV Builder (chat mode) | Gemini conversational interview extracts CV info step by step |
| CV Parser (form mode) | Gemini parses raw pasted text into structured CV JSON |
| CV Roast | Gemini analyzes CV and gives detailed critique |
| Job Fit Check | Gemini matches CV skills vs job requirements, returns score + learning plan |
| Cover Letter | Gemini generates a tailored letter per job |
| Live Job Scraping | Gemini with Google Search grounding scrapes Akhtaboot, Bayt, Wuzzuf, Fursa, Naukrigulf, GulfTalent, Tanqeeb in real time |
| Hired Score | Rule-based engine (0–1000) analyzing skills completeness, experience, education |

Live jobs also pulled via **JSearch RapidAPI** (LinkedIn / Indeed / Glassdoor aggregator).

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with cinematic scroll animation |
| `/build` | CV builder — chat with AI or paste all info at once |
| `/score` | Get your Hired Score (0–1000) |
| `/jobs` | Live jobs feed with filters (sector, country, seniority, source) |
| `/roast` | AI roasts your CV |
| `/cover` | AI generates a cover letter for any job |
| `/dashboard` | Jordan job market analytics charts |
| `/leaderboard` | Top candidates leaderboard |
| `/cofounder` | Find a co-founder by skills match |
| `/learn` | Learning resources and certifications |

---

## Tech Stack

- **Framework**: Next.js 16 App Router (TypeScript)
- **Styling**: Tailwind CSS v4
- **AI**: Google Gemini 2.0 Flash via `@google/generative-ai`
- **Database**: Neon PostgreSQL via Prisma v7 + Supabase
- **Live Jobs**: JSearch RapidAPI + Gemini Search Grounding
- **Deployment**: Vercel

---

## Running Locally

### 1. Clone and install

```bash
git clone https://github.com/Husamalj/hired-jo.git
cd hired-jo
pnpm install
```

### 2. Create `.env.local`

```env
GEMINI_API_KEY=your_google_ai_studio_key
DATABASE_URL=your_neon_postgres_connection_string
RAPIDAPI_KEY=your_rapidapi_key
```

- **GEMINI_API_KEY** → https://ai.google.dev/apikey
- **DATABASE_URL** → Neon PostgreSQL at https://neon.tech
- **RAPIDAPI_KEY** → JSearch at https://rapidapi.com/letscrape-6bJTR3j6Z/api/jsearch

### 3. Run

```bash
pnpm dev
```

Open http://localhost:3000

---

## Try It (For Judges)

1. Go to **https://hired-jo-zrgu.vercel.app/build**
2. Click **"📝 Form"** → paste any career info → click **"Generate CV"**
3. Your professional CV appears → download as PDF or Word
4. Go to **`/score`** → see your Hired Score
5. Go to **`/jobs`** → browse live jobs → click **"Check Fit"** on any job
6. Go to **`/roast`** → get AI feedback on your CV
7. Go to **`/cover`** → generate a tailored cover letter
