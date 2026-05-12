> **NOTE FOR AI AGENTS:** This is the original hackathon plan. Some details differ from what was actually built (e.g. the plan uses `src/` folder — the real project has NO `src/` folder; the plan uses SQLite — the real project uses Neon PostgreSQL). For the **current actual state**, read `CLAUDE.md` first, then `TRACK_B_DONE.md`. Use this file for feature goals and context only.

---

# Hired.jo — Implementation Plan

> **For agentic workers (Claude Code × 3 + Codex):** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to execute task-by-task. Checkbox (`- [ ]`) syntax tracks progress. The three tracks (A / B / C) can run in parallel — each member jumps to their anchor.

---

## ⚠️ THE 95% RULE — READ BEFORE ANY ACTION ⚠️

> **DO NOT execute any task in this plan unless you are ≥ 95% sure the action matches the user's intent.**
>
> If confidence < 95%:
> 1. **STOP.**
> 2. Ask the user a clarifying question.
> 3. State your confidence level explicitly: `"Confidence: 70% — need clarification on X before proceeding."`
> 4. Only proceed once confidence reaches **95% or higher**.
>
> This rule overrides default agent behavior. No silent assumptions. No "I'll figure it out as I go." Ask.

---

## Goal

Build **Hired.jo** — an AI career copilot for Jordanian graduates that interviews them to build their CV, scrapes real Jordan jobs, tells them exactly what to learn, scores their hireability 0–1000, generates cover letters, and matches co-founders. Win 1st place at HU AI Employability Hackathon 2026.

## Architecture (one paragraph)

A single Next.js 14 app (TypeScript, App Router) deployed on Vercel. Frontend renders with Tailwind + shadcn/ui. Backend is Next.js API routes calling **Gemini 2.0 Flash** (via `@google/generative-ai`). Job data is pre-scraped from Akhtaboot/Bayt/Wuzzuf into a static `jobs.json` (committed to repo) — no runtime scraping. RAG uses in-memory cosine similarity over Gemini `text-embedding-004` vectors (small corpus, no vector DB). PDFs generated client-side with `jspdf`. Voice = browser Web Speech API. SQLite via Prisma stores user sessions + leaderboard.

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | One deploy, JS/TS, AI-friendly |
| Language | TypeScript | Type safety, AI writes it well |
| Styling | Tailwind CSS + shadcn/ui | Fastest path to a polished UI |
| AI | Gemini 2.0 Flash | Free tier, fast, English-strong |
| Embeddings | `text-embedding-004` | Same provider, one key |
| DB | SQLite + Prisma | Zero setup, works on Vercel |
| PDF | jsPDF | Client-side, no backend cost |
| Voice | Web Speech API | Browser-native, free |
| Charts | Recharts | Plays nice with React |
| Deploy | Vercel (free) | One click, instant URLs, edge fast |
| QR | `qrcode.react` | Generate on slide / live |

## Brand

- **Name:** Hired.jo
- **Tagline:** *"From graduate to hired — your AI career copilot."*
- **Colors:** Deep purple `#3F2B96` + Gold `#F5B82E` (matches hackathon visual identity)
- **Logo concept:** Stylized `H.jo` with a small Jordan-flag-inspired chevron

---

## Feature Map (what we're building)

| # | Feature | Page | Owner Track | AI Used |
|---|---|---|---|---|
| 1 | Chat-to-CV (the showpiece) | `/build` | A + C | Gemini chat + structured JSON |
| 2 | Market Dashboard | `/dashboard` | B | Gemini for job enrichment |
| 3 | Job Fit Simulator | `/jobs` | A + B + C | Gemini + RAG |
| 4 | Get Hired Score (0–1000) | `/score` | B + C | Heuristics + Gemini scoring |
| 5 | Cover Letter / Email Generator | `/jobs` (modal) | C | Gemini |
| 6 | Find My Co-founder | `/cofounder` | B | Embeddings + filtering |
| 7 | Roast My CV (WOW-A) | `/roast` | A + C | Gemini |
| 8 | Voice Mode (WOW-B) | `/build` | A + C | Web Speech API + Gemini |
| 9 | Public Leaderboard | `/leaderboard` | B | DB |

---

## 🅰️ TRACK A — MEMBER 1 (Frontend & UX)

> **Jump here if you are Member 1.** Build the visible product. You own the user's first impression.

**Files you own:**
- `app/page.tsx` (landing) ← already done by Track B
- `app/layout.tsx`, `app/globals.css` ← already done by Track B, do not overwrite
- `app/build/page.tsx` ← YOUR MAIN TASK
- `components/ChatInterview.tsx`
- `components/CVPreview.tsx`
- `components/VoiceRecorder.tsx`
- `lib/pdf.ts`

### A1 — ChatInterview component

Create `components/ChatInterview.tsx`. This is the showpiece:
1. Renders chat bubbles (user + AI).
2. Posts each user message to `/api/chat` (Track C owns the route).
3. Renders a typing indicator while waiting.
4. When the AI returns `{ done: true, cv: CV }`, calls `onComplete(cv)`.

```tsx
"use client";
import { useState } from "react";
import type { CV } from "@/lib/types";

type Msg = { role: "user" | "ai"; text: string };

export function ChatInterview({ onComplete }: { onComplete: (cv: CV) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey! I'll help you build a CV in 5 minutes. What's your full name?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const next = [...msgs, { role: "user" as const, text: input }];
    setMsgs(next);
    setInput("");
    setThinking(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: next }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setThinking(false);
    if (data.done && data.cv) {
      setMsgs([...next, { role: "ai", text: "Got it. Building your CV now…" }]);
      onComplete(data.cv);
    } else {
      setMsgs([...next, { role: "ai", text: data.reply }]);
    }
  }

  return (
    <div className="flex flex-col h-[70vh] max-w-2xl mx-auto glass rounded-2xl p-6">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
              m.role === "user" ? "gold-grad text-black font-medium" : "bg-white/10"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && <div className="text-white/40 text-sm">AI is thinking…</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 outline-none placeholder:text-white/30"
          placeholder="Type your answer…"
        />
        <button onClick={send} className="px-6 py-3 rounded-xl gold-grad text-black font-semibold">
          Send
        </button>
      </div>
    </div>
  );
}
```

### A2 — Build page

Create `app/build/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { ChatInterview } from "@/components/ChatInterview";
import { CvPreview } from "@/components/CvPreview";
import { Navbar } from "@/components/Navbar";
import type { CV } from "@/lib/types";

export default function BuildPage() {
  const [cv, setCv] = useState<CV | null>(null);

  function handleComplete(built: CV) {
    localStorage.setItem("hired_cv", JSON.stringify(built));
    setCv(built);
  }

  return (
    <>
      <Navbar />
      <main className="px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Build your CV</h1>
        <p className="text-white/60 mb-6">Talk or type. I'll write your CV for you in 5 minutes.</p>
        {!cv ? (
          <ChatInterview onComplete={handleComplete} />
        ) : (
          <>
            <CvPreview cv={cv} />
            <div className="mt-6 flex gap-3">
              <a href="/score" className="px-6 py-3 rounded-xl gold-grad text-black font-bold">
                Get My Hired Score →
              </a>
              <a href="/jobs" className="px-6 py-3 rounded-xl purple-grad text-white font-bold">
                Browse Jobs →
              </a>
            </div>
          </>
        )}
      </main>
    </>
  );
}
```

### A3 — VoiceRecorder (WOW-B, optional)

Create `components/VoiceRecorder.tsx` using Web Speech API. Pass `onTranscript` into ChatInterview to fill the input with spoken text.

### A4 — PDF export (optional)

Create `lib/pdf.ts` using jsPDF to export the CV as a downloadable PDF.

---

## 🅱️ TRACK B — Already complete. See TRACK_B_DONE.md.

---

## 🅲 TRACK C — MEMBER 3 (AI Engine)

> **Jump here if you are Member 3.** See CLAUDE.md for exact file contracts.

**Your main deliverables:**

### C1 — `lib/gemini.ts`

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CV, Job, MatchResult } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function chat(messages: { role: "user" | "ai"; text: string }[]) {
  const SYSTEM = `You are Hired.jo — a friendly career coach building a CV for a Jordanian graduate. Ask one question at a time. Cover: name, email, phone, university, degree, graduation year, GPA, projects (name/tech/outcome), work experience, skills, languages. When you have enough data, output "[CV_READY]" then a JSON object matching the CV type from lib/types.ts exactly. Write bullets as action verb + specific deliverable + quantified impact.`;

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "ai" ? "model" as const : "user" as const,
    parts: [{ text: m.text }],
  }));
  const session = model.startChat({
    history: [{ role: "user", parts: [{ text: SYSTEM }] }, ...history],
  });
  const last = messages[messages.length - 1].text;
  const r = await session.sendMessage(last);
  const text = r.response.text();
  if (text.includes("[CV_READY]")) {
    const json = text.split("[CV_READY]")[1].trim().replace(/```json|```/g, "");
    return { done: true, cv: JSON.parse(json) as CV };
  }
  return { done: false, reply: text };
}

export async function roastCv(cv: CV): Promise<string> {
  const r = await model.generateContent(
    `You are a brutally honest Jordanian career coach. Roast this CV in 3-5 short paragraphs. Be funny but constructive. Use markdown.\n\nCV: ${JSON.stringify(cv)}`
  );
  return r.response.text();
}

export async function matchCvToJob(cv: CV, job: Job): Promise<MatchResult> {
  const r = await model.generateContent(
    `Match this CV to the job. Return ONLY JSON: { "score": 0-100, "pros": [...], "cons": [...], "tip": "..." }\nCV: ${JSON.stringify(cv)}\nJOB: ${JSON.stringify(job)}`
  );
  return JSON.parse(r.response.text().replace(/```json|```/g, ""));
}

export async function enrichJob(job: Job): Promise<Job> {
  const r = await model.generateContent(
    `Extract from this job: skills (array, max 8), seniority (Junior/Mid/Senior), salaryMin (JOD int or null), salaryMax (JOD int or null), summary (one sentence). Return ONLY JSON.\nJOB: ${JSON.stringify(job)}`
  );
  const enriched = JSON.parse(r.response.text().replace(/```json|```/g, ""));
  return { ...job, ...enriched };
}

export async function generateCoverLetter(cv: CV, job: Job): Promise<string> {
  const r = await model.generateContent(
    `Write a tight cover letter (180-220 words) from ${cv.name} to ${job.company} for the ${job.title} role. Connect 2 CV items to 2 job needs. End with interview CTA. No buzzwords. Plain text.\nCV: ${JSON.stringify(cv)}\nJOB: ${JSON.stringify(job)}`
  );
  return r.response.text();
}
```

### C2 — `lib/embeddings.ts`

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });

export async function embed(text: string): Promise<number[]> {
  const r = await embedModel.embedContent(text);
  return r.embedding.values;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
```

### C3 — `app/api/chat/route.ts`

```ts
import { NextResponse } from "next/server";
import { chat } from "@/lib/gemini";
export async function POST(req: Request) {
  const { messages } = await req.json();
  return NextResponse.json(await chat(messages));
}
```

### C4 — Remove stubs in Track B files

After writing lib/gemini.ts and lib/embeddings.ts:
- Open `app/api/match/route.ts` — find `// STUB` and replace mock return with real `matchCvToJob` call
- Open `app/api/cofounder/route.ts` — find `// STUB` and replace keyword overlap with real `embed`/`cosine` calls

### C5 — `/roast` page + API

Page reads CV from `localStorage.getItem("hired_cv")`, calls `/api/roast`, shows result in a glass card with typewriter effect.
The homepage QR code points to `/roast` — this page must work.

### C6 — `/cover` page + API

Page shows a job dropdown (from `data/jobs.json`), reads CV from localStorage, generates a cover letter, shows it in a copyable glass card.

---

## 🎤 WOW DEMO PLAN

Two devices on stage:

**Device 1:** Voice demo — speak for 60 seconds, CV builds itself, download PDF.
**Device 2:** QR code → `/roast` — audience scans, pastes their CV, gets roasted in 10 seconds.
Second QR → `/leaderboard` — live updating as audience submits scores.

**Failure-mode insurance:** Record a 60-second screen-capture demo video. If wifi dies, play the video.

---

## ✅ SUBMISSION CHECKLIST

- [ ] GitHub repo public with README
- [ ] Live URL on Vercel working
- [ ] Pitch deck downloaded as PDF
- [ ] Backup demo video (60 sec) recorded
- [ ] QR code printed or in slide
- [ ] `.env.example` committed, real `.env.local` NOT committed
- [ ] All three members have the live URL on their phone

---

*End of plan. Build something the judges remember.*
