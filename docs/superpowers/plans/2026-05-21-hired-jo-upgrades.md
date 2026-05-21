# Hired.jo — Phase 2 Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **⚠️ CONFIDENCE RULE — MANDATORY:** Before executing ANY step, you must be ≥95% confident it matches the user's intent. If confidence < 95%: STOP, state your confidence level ("Confidence: 70% — need clarification on X"), and ask the user before proceeding. Never make silent assumptions.

**Goal:** Ship 9 product upgrades — 2 quick bug fixes, 4 feature additions, 1 major auth system, 1 talent marketplace, and 1 AI CV editor — each independently deployable.

**Architecture:** Supabase Auth (Google OAuth + email/password) becomes the identity layer, linking CV data, cofounder profiles, saved jobs, and score history. All new API routes use `export const runtime = "edge"` unless they need Node APIs (Buffer/fs). New Supabase tables are created in the Supabase Dashboard (not Prisma-managed, matching the existing pattern). The `/talent` route is a new graduated-profile marketplace — free for both sides, no company accounts required.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase Auth + Supabase JS v2 · `@supabase/ssr` (new) · Google Gemini 2.5 Flash · shadcn/ui · lucide-react · pnpm

---

## Execution Order (each task ships independently — do them in order)

| # | Task | Estimated complexity |
|---|---|---|
| 1 | Fix job-card scroll bug | 5 min |
| 2 | Fix roast model date | 5 min |
| 3 | Upload CV shortcut on /jobs | 30 min |
| 4 | Multi-sector filter | 20 min |
| 5 | Auth system (Supabase Auth) | 2–3 h |
| 6 | Persist user data to account | 1–2 h |
| 7 | About / Contact / Donate page + footer | 45 min |
| 8 | Talent marketplace | 2–3 h |
| 9 | AI-assisted CV section editor | 1–2 h |

---

## Task 1: Fix Job-Card Scroll Bug

**Problem:** When the detail panel is revealed on a job card (via hover/tap), the user cannot scroll the description or skills inside it. Root cause: the outer card has `overflow-hidden` (line 111 of `components/JobCard.tsx`) and the inner detail panel also has `overflow-hidden` (line 172). Long descriptions get clipped with no scroll path.

**Files:**
- Modify: `components/JobCard.tsx` lines 111 and 172

- [ ] **Step 1: Open JobCard.tsx and locate both overflow-hidden classes**

  In `components/JobCard.tsx`:
  - Line 111: outer wrapper `className="feature-card group relative min-h-[270px] overflow-hidden rounded-2xl ..."`
  - Line 172: detail panel `className="absolute inset-0 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"`

- [ ] **Step 2: Fix the detail panel — change overflow-hidden to overflow-y-auto**

  The outer card must keep `overflow-hidden` so the circle reveal animation clips correctly. Only the detail panel needs to scroll.

  Change line 172 from:
  ```tsx
  className="absolute inset-0 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"
  ```
  To:
  ```tsx
  className="absolute inset-0 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto"
  ```

  Also change the description line (currently `line-clamp-4`) to remove the line clamp so the full description is visible when scrolling:
  ```tsx
  // Before (line ~202):
  <p className="relative text-xs text-white/68 leading-relaxed line-clamp-4">{job.description}</p>
  // After:
  <p className="relative text-xs text-white/68 leading-relaxed">{job.description}</p>
  ```

- [ ] **Step 3: Test locally**

  ```bash
  pnpm dev
  ```
  Open `http://localhost:3000/jobs`, hover or tap a job card, try scrolling inside the detail panel. The content should scroll freely.

- [ ] **Step 4: Commit**

  ```bash
  git add components/JobCard.tsx
  git commit -m "fix: allow scrolling inside job-card detail panel"
  ```

---

## Task 2: Fix Roast Model Date Hallucination

**Problem:** Gemini doesn't know today's date by default — it defaults to its training cutoff (~2023), so it thinks the user's 2024/2025/2026 achievements are "from the future." Fix: inject today's date into the roast system prompt.

**Files:**
- Modify: `lib/gemini.ts` (the `roastCv` function, lines 88–116)

- [ ] **Step 1: Find the roastCv system prompt in lib/gemini.ts**

  It starts at line 92:
  ```ts
  content: `You are a brutally honest but hilarious Jordanian career coach.
  ```

- [ ] **Step 2: Prepend the current date to the system prompt**

  Change the `roastCv` function to build the system string dynamically:

  ```ts
  export async function roastCv(cv: CV): Promise<{ roast: string; advice: string }> {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const text = await ask([
      {
        role: "system",
        content: `Today's date is ${today}. You are a brutally honest but hilarious Jordanian career coach.

  Your response MUST have exactly two sections separated by the marker [ADVICE]:

  SECTION 1 — THE ROAST (before [ADVICE]):
  Roast the CV in 3-4 short punchy paragraphs. Be specific — reference the person's actual company names, project titles, skill list, GPA, etc. Be funny and direct. End with one genuine encouragement sentence.

  [ADVICE]

  SECTION 2 — HOW TO FIX IT (after [ADVICE]):
  Give exactly 5 specific, actionable improvement tips as a numbered list. Each tip must reference something real from this person's CV and give a concrete rewrite example or specific action. Be direct, 1-2 sentences each. Use markdown **bold** for tip titles. No intro sentence.`,
      },
      {
        role: "user",
        content: `Roast this CV and give improvement advice:\n${JSON.stringify(cv)}`,
      },
    ]);

    const parts = text.split("[ADVICE]");
    return {
      roast: parts[0]?.trim() ?? text,
      advice: parts[1]?.trim() ?? "",
    };
  }
  ```

- [ ] **Step 3: Also remove the dead `gemini-2.0-flash` model instance at the top of the file**

  Line 5 of `lib/gemini.ts`:
  ```ts
  // Remove this line — the `model` variable is never used:
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  ```
  Delete that line entirely.

- [ ] **Step 4: Test locally**

  ```bash
  pnpm dev
  ```
  Go to `http://localhost:3000/roast`, upload or paste a CV that has 2025/2026 dates, run the roast. Verify no "ahead of your time" commentary appears.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/gemini.ts
  git commit -m "fix: inject today's date into roast prompt; remove dead gemini-2.0-flash instance"
  ```

---

## Task 3: Upload CV Shortcut on /jobs

**Problem:** Users who already have a CV file (built outside the site, or previously exported) are blocked from the "Check fit" feature because the site shows "Build your CV first." The site already has a full PDF/DOCX parser at `/api/parse-cv` (POST with JSON `{ text }` or multipart file). We need to surface a quick upload entry point on the `/jobs` page.

**Files:**
- Create: `components/CvUploadBanner.tsx`
- Modify: `app/jobs/page.tsx` (add the banner above the job list)

- [ ] **Step 1: Create CvUploadBanner component**

  Create `components/CvUploadBanner.tsx`:

  ```tsx
  "use client";
  import { useRef, useState } from "react";
  import { Upload, CheckCircle2, X } from "lucide-react";
  import type { CV } from "@/lib/types";

  interface Props {
    onCvLoaded: (cv: CV) => void;
  }

  export function CvUploadBanner({ onCvLoaded }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    async function handleFile(file: File) {
      setLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-cv", { method: "POST", body: form });
        if (!res.ok) throw new Error("Failed to parse CV");
        const cv: CV = await res.json();
        localStorage.setItem("hired_cv", JSON.stringify(cv));
        onCvLoaded(cv);
        setDone(true);
      } catch (e: any) {
        setError(e.message ?? "Upload failed");
      } finally {
        setLoading(false);
      }
    }

    if (done) {
      return (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-300/20 bg-green-400/8 px-4 py-3 text-sm text-green-200">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>CV uploaded — Check Fit is now unlocked on all job cards.</span>
          <button onClick={() => setDismissed(true)} className="ml-auto text-white/30 hover:text-white"><X size={15} /></button>
        </div>
      );
    }

    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-yellow-300/5 px-4 py-3 text-sm">
        <Upload size={15} className="shrink-0 text-yellow-200/70" />
        <span className="text-white/55">Already have a CV? Upload it to unlock <strong className="text-white/80">Check Fit</strong>.</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="ml-auto shrink-0 rounded-xl gold-grad px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
        >
          {loading ? "Parsing…" : "Upload CV"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {error && <span className="ml-2 text-red-300 text-xs">{error}</span>}
        <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/50"><X size={14} /></button>
      </div>
    );
  }
  ```

- [ ] **Step 2: Wire it into app/jobs/page.tsx**

  Open `app/jobs/page.tsx`. Find where `cv` state is declared (it reads from localStorage). Add the banner import and render it above the job grid.

  Find the import block at the top and add:
  ```tsx
  import { CvUploadBanner } from "@/components/CvUploadBanner";
  ```

  Find the `cv` state setter (something like `const [cv, setCv] = useState(null)` or a `useMemo` reading localStorage). The component needs a way to refresh cv state. Add a state setter callback:

  Wherever the CV is currently loaded from localStorage (likely in a `useEffect`), extract it into a function:
  ```tsx
  const [cv, setCv] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hired_cv");
      if (raw) setCv(JSON.parse(raw));
    } catch {}
  }, []);

  function handleCvLoaded(newCv: any) {
    setCv(newCv);
  }
  ```

  Then in the JSX, above the job grid/filter row, add:
  ```tsx
  {!cv && <CvUploadBanner onCvLoaded={handleCvLoaded} />}
  ```

- [ ] **Step 3: Test locally**

  ```bash
  pnpm dev
  ```
  Open `/jobs` without a CV in localStorage (open DevTools → Application → Local Storage → delete `hired_cv`). The yellow upload banner should appear. Upload a PDF — it should disappear and job cards' "Check fit" should now work.

- [ ] **Step 4: Commit**

  ```bash
  git add components/CvUploadBanner.tsx app/jobs/page.tsx
  git commit -m "feat: quick CV upload banner on /jobs to unlock Check Fit"
  ```

---

## Task 4: Multi-Sector Filter on /jobs

**Problem:** Users can only select one sector at a time. If someone is interested in both Tech and Design jobs they have to filter twice.

**Files:**
- Create: `components/MultiSelectDropdown.tsx`
- Modify: `app/jobs/page.tsx` (swap single sector dropdown → multi-select)

- [ ] **Step 1: Create MultiSelectDropdown component**

  Create `components/MultiSelectDropdown.tsx`:

  ```tsx
  "use client";
  import { useState, useRef, useEffect } from "react";
  import { ChevronDown, Check } from "lucide-react";

  interface Props {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
  }

  export function MultiSelectDropdown({ label, options, selected, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function onOutside(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", onOutside);
      return () => document.removeEventListener("mousedown", onOutside);
    }, []);

    function toggle(opt: string) {
      if (opt === "All") { onChange([]); return; }
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      onChange(next);
    }

    const displayLabel = selected.length === 0
      ? label
      : selected.length === 1
      ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            selected.length > 0
              ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-100"
              : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80"
          }`}
        >
          {displayLabel}
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-2xl border border-white/10 bg-[#0A0716] shadow-2xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto p-1">
              {["All", ...options].map((opt) => {
                const isSelected = opt === "All" ? selected.length === 0 : selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition ${
                      isSelected ? "bg-yellow-300/12 text-yellow-100" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt}
                    {isSelected && opt !== "All" && <Check size={13} className="text-yellow-300" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Update /jobs page to use MultiSelectDropdown for sectors**

  In `app/jobs/page.tsx`:

  Add import:
  ```tsx
  import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
  ```

  Change the sector state from `string` to `string[]`:
  ```tsx
  // Before:
  const [sector, setSector] = useState("All");
  // After:
  const [sectors, setSectors] = useState<string[]>([]);
  ```

  Replace wherever `FilterDropdown` (or similar) renders the sector filter with:
  ```tsx
  <MultiSelectDropdown
    label="Sector"
    options={sectorOptions}   // whatever array of sector strings was used before
    selected={sectors}
    onChange={setSectors}
  />
  ```

  Update the filter logic (find where `sector` was compared to job.sector):
  ```tsx
  // Before (example):
  .filter((job) => sector === "All" || job.sector === sector)
  // After:
  .filter((job) => sectors.length === 0 || sectors.includes(job.sector))
  ```

- [ ] **Step 3: Test locally**

  ```bash
  pnpm dev
  ```
  Open `/jobs` → click Sector dropdown → select "Tech" then "Design" — both should show as selected, and only Tech + Design jobs should appear in the list.

- [ ] **Step 4: Commit**

  ```bash
  git add components/MultiSelectDropdown.tsx app/jobs/page.tsx
  git commit -m "feat: multi-select sector filter on /jobs"
  ```

---

## Task 5: Auth System (Supabase Auth — Google + Email/Password)

**Why Supabase Auth:** The project already uses Supabase for leaderboard and cofounder data. Supabase Auth is built in — no new service, no new billing. Supports Google OAuth and email/password natively.

**What this task does:** Installs `@supabase/ssr`, sets up browser + server Supabase clients, adds session middleware, adds `/auth/login` page and `/auth/callback` route, adds a Sign In / Sign Out button to the Navbar.

**What this task does NOT do:** Persist user data (that's Task 6). Auth just provides the session.

**Files:**
- Install: `@supabase/ssr`
- Create: `lib/supabase-browser.ts`
- Create: `lib/supabase-server.ts`
- Create: `middleware.ts` (project root)
- Create: `app/auth/login/page.tsx`
- Create: `app/auth/callback/route.ts`
- Modify: `components/Navbar.tsx` (add auth button)
- Modify: `.env.local` (add new env vars)

**Env vars to add:**
```
NEXT_PUBLIC_SUPABASE_URL=<same value as SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same value as SUPABASE_ANON_KEY>
```
Also add these to Vercel project settings.

**Supabase Dashboard setup (do before writing any code):**
1. Go to Supabase Dashboard → Authentication → Providers → Enable **Email** (already on by default)
2. Go to Authentication → Providers → Enable **Google** → paste your Google OAuth client ID + secret
   - Create Google OAuth credentials at https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client ID
   - Authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
3. Go to Authentication → URL Configuration → set Site URL to `https://hired-jo-zrgu.vercel.app` and add `http://localhost:3000` to Additional Redirect URLs

- [ ] **Step 1: Install @supabase/ssr**

  ```bash
  pnpm add @supabase/ssr
  ```

- [ ] **Step 2: Add NEXT_PUBLIC env vars to .env.local**

  Open `.env.local` and add (copy values from existing SUPABASE_URL / SUPABASE_ANON_KEY):
  ```
  NEXT_PUBLIC_SUPABASE_URL=<your supabase url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
  ```

- [ ] **Step 3: Create browser Supabase client**

  Create `lib/supabase-browser.ts`:
  ```ts
  import { createBrowserClient } from "@supabase/ssr";

  export function createSupabaseBrowserClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  ```

- [ ] **Step 4: Create server Supabase client**

  Create `lib/supabase-server.ts`:
  ```ts
  import { createServerClient } from "@supabase/ssr";
  import { cookies } from "next/headers";

  export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(toSet) {
            try {
              toSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
  }
  ```

- [ ] **Step 5: Create middleware for session refresh**

  Create `middleware.ts` at project root:
  ```ts
  import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(toSet) {
            toSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            toSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
  };
  ```

- [ ] **Step 6: Create /auth/callback route**

  Create `app/auth/callback/route.ts`:
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { createSupabaseServerClient } from "@/lib/supabase-server";

  export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }
  ```

- [ ] **Step 7: Create /auth/login page**

  Create `app/auth/login/page.tsx`:
  ```tsx
  "use client";
  import { useState } from "react";
  import { useSearchParams } from "next/navigation";
  import Navbar from "@/components/Navbar";
  import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
  import { Mail, Lock, Chrome } from "lucide-react";

  export default function LoginPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const supabase = createSupabaseBrowserClient();

    async function handleGoogleSignIn() {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback?next=/jobs` },
      });
    }

    async function handleEmailAuth(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setMessage(null);
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setMessage(error.message); setLoading(false); return; }
        location.href = "/jobs";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=/build` },
        });
        if (error) { setMessage(error.message); } else {
          setMessage("Check your email to confirm your account.");
        }
        setLoading(false);
      }
    }

    return (
      <>
        <Navbar />
        <main className="relative min-h-screen flex items-center justify-center px-4">
          <div className="absolute inset-0 dot-grid opacity-[0.04]" />
          <div className="relative w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-extrabold gold-text-grad mb-2">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-white/45 text-sm">Your CV and progress sync across devices.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-400/8 px-4 py-3 text-sm text-red-200">
                Authentication failed. Please try again.
              </div>
            )}

            <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-6 space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                <Chrome size={18} /> Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-yellow-300/40 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-yellow-300/40 focus:outline-none"
                  />
                </div>

                {message && (
                  <p className="text-sm text-yellow-200/80">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl gold-grad px-4 py-3 text-sm font-extrabold text-black disabled:opacity-50"
                >
                  {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>

              <p className="text-center text-xs text-white/35">
                {mode === "login" ? "No account?" : "Already have one?"}{" "}
                <button
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
                  className="text-yellow-200 hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }
  ```

- [ ] **Step 8: Add Sign In / Sign Out to Navbar**

  Open `components/Navbar.tsx`. Add auth state using the browser client. Add a Sign In link and a Sign Out button:

  Near the top of the file (inside the component):
  ```tsx
  "use client";
  // Add at the top with other imports:
  import { useEffect, useState } from "react";
  import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
  import type { User } from "@supabase/supabase-js";

  // Inside component:
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    location.href = "/";
  }
  ```

  In the JSX nav links section, add:
  ```tsx
  {user ? (
    <button
      onClick={signOut}
      className="text-sm text-white/50 hover:text-white transition px-2 py-1"
    >
      Sign out
    </button>
  ) : (
    <a
      href="/auth/login"
      className="rounded-xl gold-grad px-3 py-1.5 text-xs font-extrabold text-black"
    >
      Sign in
    </a>
  )}
  ```

- [ ] **Step 9: Add NEXT_PUBLIC env vars to Vercel project**

  In Vercel Dashboard → your project → Settings → Environment Variables, add:
  - `NEXT_PUBLIC_SUPABASE_URL` = same as `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = same as `SUPABASE_ANON_KEY`

- [ ] **Step 10: Test locally**

  ```bash
  pnpm dev
  ```
  1. Open `http://localhost:3000/auth/login`
  2. Click "Continue with Google" — should redirect to Google, then back to `/jobs` as a logged-in user
  3. Navbar should show "Sign out" button
  4. Click "Sign out" — should return to sign-in state

- [ ] **Step 11: Commit**

  ```bash
  git add lib/supabase-browser.ts lib/supabase-server.ts middleware.ts app/auth/ components/Navbar.tsx
  git commit -m "feat: Supabase Auth with Google OAuth and email/password sign-in"
  ```

---

## Task 6: Persist User Data (CV, Saved Jobs, Score History)

**What this task does:** After Task 5 gives us auth sessions, this task creates Supabase tables to persist each user's CV, saved/hidden jobs, and score history. On sign-in, data is pulled from the DB and written to localStorage. On updates (CV built, job saved, score computed), data is synced to the DB in the background.

**Supabase Dashboard setup (do this before writing code):**

Run these SQL statements in Supabase Dashboard → SQL Editor:

```sql
-- CV storage (one row per user)
CREATE TABLE user_cvs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cv_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own CV" ON user_cvs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved jobs
CREATE TABLE user_saved_jobs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE user_saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved jobs" ON user_saved_jobs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Score history
CREATE TABLE user_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scores" ON user_scores
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Files:**
- Create: `lib/user-data.ts` (sync helpers)
- Modify: `app/build/page.tsx` (sync CV on save)
- Modify: `app/score/page.tsx` (sync score on compute)
- Modify: `app/jobs/page.tsx` (sync saved jobs; show saved state on job cards)

- [ ] **Step 1: Create user-data sync helpers**

  Create `lib/user-data.ts`:
  ```ts
  import { createSupabaseBrowserClient } from "./supabase-browser";
  import type { CV } from "./types";

  const sb = () => createSupabaseBrowserClient();

  export async function syncCvToAccount(cv: CV): Promise<void> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    await sb().from("user_cvs").upsert(
      { user_id: user.id, cv_json: cv, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  export async function loadCvFromAccount(): Promise<CV | null> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return null;
    const { data } = await sb().from("user_cvs").select("cv_json").eq("user_id", user.id).single();
    return data?.cv_json ?? null;
  }

  export async function saveJob(jobId: string): Promise<void> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    await sb().from("user_saved_jobs").upsert({ user_id: user.id, job_id: jobId }, { onConflict: "user_id,job_id" });
  }

  export async function unsaveJob(jobId: string): Promise<void> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    await sb().from("user_saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
  }

  export async function loadSavedJobIds(): Promise<string[]> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return [];
    const { data } = await sb().from("user_saved_jobs").select("job_id").eq("user_id", user.id);
    return data?.map((r) => r.job_id) ?? [];
  }

  export async function syncScoreToAccount(score: number, breakdown: Record<string, unknown>): Promise<void> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    await sb().from("user_scores").insert({ user_id: user.id, score, breakdown });
  }

  export async function loadScoreHistory(): Promise<{ score: number; breakdown: any; created_at: string }[]> {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return [];
    const { data } = await sb().from("user_scores").select("score,breakdown,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    return data ?? [];
  }
  ```

- [ ] **Step 2: Pull CV from account on /build page load**

  In `app/build/page.tsx`, add to the `useEffect` that loads from localStorage:
  ```tsx
  import { loadCvFromAccount, syncCvToAccount } from "@/lib/user-data";

  useEffect(() => {
    // Try localStorage first
    try {
      const raw = localStorage.getItem("hired_cv");
      if (raw) { setCv(JSON.parse(raw)); return; }
    } catch {}
    // Fall back to account sync
    loadCvFromAccount().then((accountCv) => {
      if (accountCv) {
        localStorage.setItem("hired_cv", JSON.stringify(accountCv));
        setCv(accountCv);
      }
    });
  }, []);
  ```

  When the CV is saved (after bulk form submit or chat completes), also call:
  ```tsx
  // After localStorage.setItem("hired_cv", ...)
  syncCvToAccount(cv).catch(console.error); // fire-and-forget
  ```

- [ ] **Step 3: Sync score on /score page**

  In `app/score/page.tsx`, after receiving the score response:
  ```tsx
  import { syncScoreToAccount } from "@/lib/user-data";

  // After: const data = await res.json();
  syncScoreToAccount(data.total, data).catch(console.error);
  ```

- [ ] **Step 4: Add Save Job button to JobCard**

  In `components/JobCard.tsx`, add a bookmark button to the job card actions. Import `saveJob` and `unsaveJob` from `@/lib/user-data`. Add a `saved` prop and `onToggleSave` callback. The parent page (`app/jobs/page.tsx`) manages the saved IDs list via `loadSavedJobIds` on mount.

  In `JobCard.tsx` props:
  ```tsx
  export function JobCard({ job, cv, saved, onToggleSave }: {
    job: Job;
    cv?: any;
    saved?: boolean;
    onToggleSave?: (jobId: string, save: boolean) => void;
  }) {
  ```

  Add a bookmark icon button to the card action row:
  ```tsx
  import { Bookmark } from "lucide-react";

  // In the action row (near Apply / LinkedIn buttons):
  {onToggleSave && (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleSave(job.id, !saved); }}
      className={`rounded-2xl border px-3 py-3 text-xs inline-flex items-center gap-1.5 transition ${
        saved
          ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-200"
          : "border-white/15 bg-white/5 text-white/55 hover:text-white"
      }`}
      aria-label={saved ? "Unsave job" : "Save job"}
    >
      <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
    </button>
  )}
  ```

  In `app/jobs/page.tsx`, load saved job IDs on mount and wire up the toggle:
  ```tsx
  import { loadSavedJobIds, saveJob, unsaveJob } from "@/lib/user-data";

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSavedJobIds().then((ids) => setSavedJobIds(new Set(ids)));
  }, []);

  async function handleToggleSave(jobId: string, save: boolean) {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (save) next.add(jobId); else next.delete(jobId);
      return next;
    });
    if (save) await saveJob(jobId); else await unsaveJob(jobId);
  }
  ```

  Pass to each `JobCard`:
  ```tsx
  <JobCard
    key={job.id}
    job={job}
    cv={cv}
    saved={savedJobIds.has(job.id)}
    onToggleSave={handleToggleSave}
  />
  ```

- [ ] **Step 5: Test locally**

  1. Sign in → go to `/build` → build/upload a CV → it should appear on next sign-in without rebuilding
  2. On `/jobs`, bookmark a job → sign out → sign back in → job should still be bookmarked
  3. On `/score`, compute a score → check Supabase Dashboard `user_scores` table for the new row

- [ ] **Step 6: Commit**

  ```bash
  git add lib/user-data.ts app/build/page.tsx app/score/page.tsx app/jobs/page.tsx components/JobCard.tsx
  git commit -m "feat: persist CV, saved jobs, and score history to user account"
  ```

---

## Task 7: About / Contact / Donate Page + Footer

**What this task does:** Adds `/about` as a dedicated page (linked in the Navbar alongside Jobs, Score, etc.) containing: About Hired.jo, Contact section (email form), and Support/Donate section (placeholder for future payment, using Buy Me a Coffee link for now). Adds a site-wide footer with links.

**Files:**
- Create: `app/about/page.tsx`
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx` (add Footer)
- Modify: `components/Navbar.tsx` (add About link)

- [ ] **Step 1: Create Footer component**

  Create `components/Footer.tsx`:
  ```tsx
  export function Footer() {
    return (
      <footer className="relative mt-20 border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-white/35">
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="gold-text-grad text-lg">Hired</span>
            <span className="text-white/40">.jo</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/" className="hover:text-white/70 transition">Home</a>
            <a href="/jobs" className="hover:text-white/70 transition">Find Jobs</a>
            <a href="/build" className="hover:text-white/70 transition">Build CV</a>
            <a href="/roast" className="hover:text-white/70 transition">Roast CV</a>
            <a href="/leaderboard" className="hover:text-white/70 transition">Leaderboard</a>
            <a href="/about" className="hover:text-white/70 transition">About</a>
          </div>
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Hired.jo — Built in Jordan 🇯🇴</p>
        </div>
      </footer>
    );
  }
  ```

- [ ] **Step 2: Add Footer to root layout**

  In `app/layout.tsx`, import and add `<Footer />` at the bottom of the body:
  ```tsx
  import { Footer } from "@/components/Footer";
  // Inside <body>:
  {children}
  <Footer />
  ```

- [ ] **Step 3: Add About link to Navbar**

  In `components/Navbar.tsx`, add to the nav links list:
  ```tsx
  <a href="/about" className="text-sm text-white/60 hover:text-white transition">About</a>
  ```

- [ ] **Step 4: Create /about page**

  Create `app/about/page.tsx`:
  ```tsx
  import Navbar from "@/components/Navbar";
  import { Mail, Heart, Users, Target } from "lucide-react";

  export const metadata = { title: "About — Hired.jo" };

  export default function AboutPage() {
    return (
      <>
        <Navbar />
        <main className="relative min-h-screen px-4 py-20">
          <div className="absolute inset-0 dot-grid opacity-[0.04]" />
          <div className="relative mx-auto max-w-3xl space-y-16">

            {/* Hero */}
            <section className="text-center space-y-4">
              <h1 className="font-display text-5xl font-extrabold gold-text-grad">About Hired.jo</h1>
              <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto">
                An AI career copilot built for Jordanian graduates — helping you land your first job faster.
              </p>
            </section>

            {/* Story */}
            <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-4">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                <Target size={22} className="text-yellow-300" /> Our Story
              </h2>
              <p className="text-white/60 leading-relaxed">
                Hired.jo was built in 48 hours at the HU AI Employability Hackathon 2026 — and won. We saw that Jordanian graduates had strong skills but struggled to present them, understand the market, and compete with polished CVs.
              </p>
              <p className="text-white/60 leading-relaxed">
                So we built the tool we wished existed: AI that interviews you, builds your CV, scores your hireability against real live job data, and tells you exactly what to learn next.
              </p>
            </section>

            {/* Team */}
            <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-4">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                <Users size={22} className="text-yellow-300" /> Team
              </h2>
              <p className="text-white/60 leading-relaxed">
                We are a team of students from Hashemite University passionate about using AI to solve real problems in Jordan and the Arab world. Hired.jo is our contribution to bridging the gap between graduates and employers.
              </p>
            </section>

            {/* Contact */}
            <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-6" id="contact">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                <Mail size={22} className="text-yellow-300" /> Contact Us
              </h2>
              <p className="text-white/55">Got feedback, a bug to report, or a partnership idea? Reach us at:</p>
              <a
                href="mailto:khalidmasoud4321@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl gold-grad px-4 py-2.5 text-sm font-bold text-black"
              >
                <Mail size={15} /> khalidmasoud4321@gmail.com
              </a>
            </section>

            {/* Support / Donate */}
            <section className="feature-card rounded-2xl border border-yellow-300/20 bg-yellow-300/5 p-8 space-y-4" id="support">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                <Heart size={22} className="text-yellow-300" /> Support the Project
              </h2>
              <p className="text-white/60 leading-relaxed">
                Hired.jo is free and will stay free for graduates. If it helped you land a job or prepare better, consider supporting us to keep the servers running and the AI powered up.
              </p>
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl gold-grad px-4 py-2.5 text-sm font-bold text-black"
              >
                ☕ Buy us a coffee
              </a>
              <p className="text-white/30 text-xs">A proper donation page is coming soon as part of our business plan.</p>
            </section>

          </div>
        </main>
      </>
    );
  }
  ```

  **Note:** Replace the `buymeacoffee.com` href with your actual Buy Me a Coffee profile URL once created. Replace the contact email if needed.

- [ ] **Step 5: Test locally**

  ```bash
  pnpm dev
  ```
  Visit `http://localhost:3000/about` — all sections should render. Footer should appear on every page. Navbar should have "About" link.

- [ ] **Step 6: Commit**

  ```bash
  git add app/about/ components/Footer.tsx app/layout.tsx components/Navbar.tsx
  git commit -m "feat: add /about page with contact and support sections + site footer"
  ```

---

## Task 8: Talent Marketplace (/talent — Graduates List Themselves, Companies Browse)

**What this task does:** Adds a `/talent` page where graduates can opt-in to be listed publicly with their CV summary + contact info. Companies (or anyone) can browse the talent pool with filters: field/sector, graduation year, city/country, years of experience, skills. No company account needed. The graduate must be logged in to create a profile. Viewing the talent pool is public.

**Supabase Dashboard setup (do before code):**

```sql
CREATE TABLE talent_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  alias TEXT NOT NULL,
  email TEXT NOT NULL,
  field TEXT,
  graduation_year INT,
  years_experience INT,
  city TEXT,
  country TEXT DEFAULT 'Jordan',
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  cv_json JSONB,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible profiles
CREATE POLICY "Public read visible profiles" ON talent_profiles
  FOR SELECT USING (is_visible = true);

-- Owners can do anything to their own profile
CREATE POLICY "Owners manage own profile" ON talent_profiles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Files:**
- Create: `app/talent/page.tsx` (combined: opt-in form + browse section)
- Create: `app/api/talent/route.ts`

- [ ] **Step 1: Create /api/talent route**

  Create `app/api/talent/route.ts`:
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { getSupabase } from "@/lib/supabase";

  export const runtime = "edge";

  // GET /api/talent?field=Tech&country=Jordan&year=2024&experience=0&skill=React
  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const field = searchParams.get("field");
    const country = searchParams.get("country");
    const year = searchParams.get("year");
    const experience = searchParams.get("experience");
    const skill = searchParams.get("skill");

    const sb = getSupabase();
    let query = sb.from("talent_profiles").select("*").eq("is_visible", true);

    if (field && field !== "All") query = query.eq("field", field);
    if (country && country !== "All") query = query.eq("country", country);
    if (year && year !== "All") query = query.eq("graduation_year", parseInt(year));
    if (experience && experience !== "All") query = query.eq("years_experience", parseInt(experience));
    if (skill) query = query.contains("skills", [skill]);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // POST /api/talent  { action: "upsert" | "delete", profile: {...} }
  export async function POST(req: NextRequest) {
    const body = await req.json();
    const sb = getSupabase();

    if (body.action === "upsert") {
      const { error } = await sb.from("talent_profiles").upsert(body.profile, { onConflict: "user_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete") {
      const { error } = await sb.from("talent_profiles").delete().eq("user_id", body.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  ```

- [ ] **Step 2: Create /talent page**

  Create `app/talent/page.tsx`:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import Navbar from "@/components/Navbar";
  import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
  import { Search, UserCheck, MapPin, GraduationCap, Briefcase, Eye, EyeOff, Mail } from "lucide-react";
  import type { User } from "@supabase/supabase-js";

  const FIELDS = ["All", "Computer Science", "Engineering", "Business", "Design", "Marketing", "Finance", "Healthcare", "Education", "Law", "Other"];
  const COUNTRIES = ["All", "Jordan", "UAE", "Saudi Arabia", "Egypt"];
  const YEARS = ["All", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
  const EXPERIENCES = ["All", "0", "1", "2", "3", "4", "5"];

  interface TalentProfile {
    id: number;
    user_id: string;
    alias: string;
    email: string;
    field: string;
    graduation_year: number;
    years_experience: number;
    city: string;
    country: string;
    skills: string[];
    bio: string;
    is_visible: boolean;
  }

  export default function TalentPage() {
    const [user, setUser] = useState<User | null>(null);
    const [myProfile, setMyProfile] = useState<TalentProfile | null>(null);
    const [profiles, setProfiles] = useState<TalentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"browse" | "my-profile">("browse");

    // Filters
    const [field, setField] = useState("All");
    const [country, setCountry] = useState("All");
    const [year, setYear] = useState("All");
    const [experience, setExperience] = useState("All");
    const [skillSearch, setSkillSearch] = useState("");

    // My profile form
    const [form, setForm] = useState({ alias: "", email: "", field: "", graduation_year: "", years_experience: "", city: "", country: "Jordan", skills: "", bio: "" });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const sb = createSupabaseBrowserClient();

    useEffect(() => {
      sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    }, []);

    useEffect(() => {
      fetchProfiles();
    }, [field, country, year, experience]);

    async function fetchProfiles() {
      setLoading(true);
      const params = new URLSearchParams();
      if (field !== "All") params.set("field", field);
      if (country !== "All") params.set("country", country);
      if (year !== "All") params.set("year", year);
      if (experience !== "All") params.set("experience", experience);
      const res = await fetch(`/api/talent?${params}`);
      setProfiles(await res.json());
      setLoading(false);
    }

    async function saveProfile(e: React.FormEvent) {
      e.preventDefault();
      if (!user) return;
      setSaving(true);
      setSaveMsg(null);
      const profile = {
        user_id: user.id,
        alias: form.alias,
        email: form.email,
        field: form.field,
        graduation_year: parseInt(form.graduation_year) || null,
        years_experience: parseInt(form.years_experience) || 0,
        city: form.city,
        country: form.country,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        bio: form.bio,
        is_visible: true,
      };
      const res = await fetch("/api/talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", profile }),
      });
      setSaving(false);
      if (res.ok) setSaveMsg("Profile saved! You're now visible to companies.");
      else setSaveMsg("Save failed — please try again.");
    }

    const filtered = profiles.filter((p) =>
      !skillSearch || p.skills.some((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))
    );

    return (
      <>
        <Navbar />
        <main className="relative min-h-screen px-4 py-20">
          <div className="absolute inset-0 dot-grid opacity-[0.04]" />
          <div className="relative mx-auto max-w-6xl">

            <div className="mb-10 text-center">
              <h1 className="font-display text-4xl font-extrabold gold-text-grad mb-3">Talent Marketplace</h1>
              <p className="text-white/50 max-w-xl mx-auto">
                Graduates list themselves. Companies find them. Free for everyone.
              </p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
              <button
                onClick={() => setTab("browse")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "browse" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}
              >
                Browse Talent
              </button>
              <button
                onClick={() => setTab("my-profile")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "my-profile" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}
              >
                {user ? "My Profile" : "List Yourself"}
              </button>
            </div>

            {/* Browse tab */}
            {tab === "browse" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[["Field", FIELDS, field, setField], ["Country", COUNTRIES, country, setCountry], ["Grad Year", YEARS, year, setYear], ["Experience (yrs)", EXPERIENCES, experience, setExperience]].map(([label, opts, val, setter]: any) => (
                    <select
                      key={label}
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-yellow-300/40"
                    >
                      {opts.map((o: string) => <option key={o} value={o} className="bg-[#0A0716]">{label === "Experience (yrs)" && o !== "All" ? `${o} yr${o === "1" ? "" : "s"}` : o}</option>)}
                    </select>
                  ))}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Filter by skill…"
                      className="rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
                    />
                  </div>
                </div>

                {loading ? (
                  <p className="text-white/30 text-center py-20">Loading talent pool…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-white/30 text-center py-20">No profiles match these filters yet.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((p) => (
                      <div key={p.id} className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">{p.alias}</p>
                            <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                              <GraduationCap size={12} /> {p.field} · {p.graduation_year}
                            </p>
                          </div>
                          <span className="text-xs rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/40">
                            {p.years_experience} yr{p.years_experience === 1 ? "" : "s"} exp
                          </span>
                        </div>
                        {p.city && (
                          <p className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin size={11} /> {p.city}, {p.country}
                          </p>
                        )}
                        {p.bio && <p className="text-xs text-white/55 leading-relaxed line-clamp-3">{p.bio}</p>}
                        <div className="flex flex-wrap gap-1">
                          {p.skills.slice(0, 4).map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 border border-white/10 text-white/55">{s}</span>
                          ))}
                        </div>
                        <a
                          href={`mailto:${p.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-yellow-200 hover:underline"
                        >
                          <Mail size={12} /> Contact
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Profile tab */}
            {tab === "my-profile" && (
              <div className="max-w-xl mx-auto">
                {!user ? (
                  <div className="text-center py-20 space-y-4">
                    <p className="text-white/50">Sign in to create your talent profile.</p>
                    <a href="/auth/login" className="inline-block rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black">Sign in</a>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-6 space-y-4">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><UserCheck size={18} className="text-yellow-300" /> Your Talent Profile</h2>
                    <p className="text-white/45 text-sm">This info is public and visible to companies browsing the talent pool.</p>
                    {[
                      ["Display name", "alias", "text", "Your name or pseudonym"],
                      ["Contact email", "email", "email", "Shown to companies"],
                      ["City", "city", "text", "e.g. Amman"],
                      ["Bio", "bio", "text", "One sentence about yourself"],
                      ["Skills (comma-separated)", "skills", "text", "React, Python, SQL…"],
                      ["Graduation year", "graduation_year", "number", "e.g. 2025"],
                      ["Years of experience", "years_experience", "number", "0 if fresh graduate"],
                    ].map(([label, key, type, placeholder]) => (
                      <div key={key as string}>
                        <label className="block text-xs text-white/40 mb-1">{label}</label>
                        <input
                          type={type as string}
                          placeholder={placeholder as string}
                          value={(form as any)[key as string]}
                          onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Field of study</label>
                      <select
                        value={form.field}
                        onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0A0716] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
                      >
                        {FIELDS.filter(f => f !== "All").map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Country</label>
                      <select
                        value={form.country}
                        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0A0716] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
                      >
                        {COUNTRIES.filter(c => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {saveMsg && <p className="text-sm text-yellow-200/80">{saveMsg}</p>}
                    <button type="submit" disabled={saving} className="w-full rounded-xl gold-grad py-3 text-sm font-extrabold text-black disabled:opacity-50">
                      {saving ? "Saving…" : "Save & Go Live"}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </main>
      </>
    );
  }
  ```

- [ ] **Step 3: Add Talent link to Navbar**

  In `components/Navbar.tsx`, add:
  ```tsx
  <a href="/talent" className="text-sm text-white/60 hover:text-white transition">Talent</a>
  ```

- [ ] **Step 4: Test locally**

  1. Open `/talent` — Browse tab should show an empty state with filters
  2. Sign in → My Profile tab → fill in the form → Save → profile appears in Browse tab
  3. Test all filters — results should narrow correctly

- [ ] **Step 5: Commit**

  ```bash
  git add app/talent/ app/api/talent/ components/Navbar.tsx
  git commit -m "feat: talent marketplace — graduates opt-in to be found by companies"
  ```

---

## Task 9: AI-Assisted CV Section Editor

**What this task does:** After a CV is built/displayed on `/build`, adds an editing panel below the CV preview. The user selects a CV section (Summary, Experience, Education, Skills, Projects, Certifications), types a prompt ("make this more concise", "add more action verbs"), and the AI rewrites just that section. The updated section is merged back into the CV, localStorage is updated, and the preview re-renders.

**Files:**
- Create: `app/api/edit-cv-section/route.ts`
- Create: `components/CvSectionEditor.tsx`
- Modify: `app/build/page.tsx` (add editor below CvPreview)

- [ ] **Step 1: Create /api/edit-cv-section route**

  Create `app/api/edit-cv-section/route.ts`:
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { GoogleGenerativeAI } from "@google/generative-ai";
  import type { CV } from "@/lib/types";

  export const runtime = "edge";

  export async function POST(req: NextRequest) {
    const { cv, section, prompt } = await req.json() as {
      cv: CV;
      section: keyof CV;
      prompt: string;
    };

    if (!cv || !section || !prompt) {
      return NextResponse.json({ error: "Missing cv, section, or prompt" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const m = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are an expert CV editor. The user will give you one section of a CV and a specific editing instruction. 
Return ONLY the edited content for that section in the exact same JSON format it was provided — no commentary, no markdown fences, just the raw JSON value.
The current date is ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`,
    });

    const sectionValue = cv[section];
    const chat = m.startChat({ history: [] });
    const result = await chat.sendMessage(
      `CV Section: "${String(section)}"\nCurrent content: ${JSON.stringify(sectionValue)}\n\nEditing instruction: ${prompt}\n\nReturn only the edited value as raw JSON.`
    );

    const raw = result.response.text().replace(/```json|```/g, "").trim();

    let edited: unknown;
    try {
      edited = JSON.parse(raw);
    } catch {
      // If AI returned plain text for a string field, use it directly
      edited = raw;
    }

    return NextResponse.json({ section, edited });
  }
  ```

- [ ] **Step 2: Create CvSectionEditor component**

  Create `components/CvSectionEditor.tsx`:
  ```tsx
  "use client";
  import { useState } from "react";
  import { Wand2, ChevronDown } from "lucide-react";
  import type { CV } from "@/lib/types";

  const SECTIONS: { key: keyof CV; label: string }[] = [
    { key: "summary", label: "Summary / Objective" },
    { key: "experience", label: "Work Experience" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
    { key: "projects", label: "Projects" },
    { key: "certifications", label: "Certifications" },
    { key: "languages", label: "Languages" },
  ];

  const QUICK_PROMPTS = [
    "Make this more concise",
    "Add stronger action verbs",
    "Make it sound more professional",
    "Quantify achievements with numbers",
    "Tailor this for a tech company",
  ];

  interface Props {
    cv: CV;
    onCvUpdated: (cv: CV) => void;
  }

  export function CvSectionEditor({ cv, onCvUpdated }: Props) {
    const [section, setSection] = useState<keyof CV>("summary");
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastEdit, setLastEdit] = useState<string | null>(null);

    async function handleEdit(e: React.FormEvent) {
      e.preventDefault();
      if (!prompt.trim()) return;
      setLoading(true);
      setError(null);
      setLastEdit(null);

      try {
        const res = await fetch("/api/edit-cv-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv, section, prompt }),
        });
        if (!res.ok) throw new Error("Edit failed");
        const { edited } = await res.json();
        const updatedCv = { ...cv, [section]: edited };
        localStorage.setItem("hired_cv", JSON.stringify(updatedCv));
        onCvUpdated(updatedCv);
        setLastEdit(`"${SECTIONS.find(s => s.key === section)?.label}" updated.`);
        setPrompt("");
      } catch (e: any) {
        setError(e.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="mt-8 feature-card rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.03] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-yellow-300" />
          <h2 className="font-display text-lg font-bold text-white">AI Section Editor</h2>
          <span className="ml-auto text-xs text-white/30 border border-white/10 rounded-full px-2 py-0.5">Premium soon</span>
        </div>
        <p className="text-white/45 text-sm">Select a section, describe what to change, and the AI will rewrite it instantly.</p>

        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Section to edit</label>
            <div className="relative">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as keyof CV)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
              >
                {SECTIONS.map(({ key, label }) => (
                  <option key={key} value={key} className="bg-[#0A0716]">{label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Quick suggestions</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-yellow-300/30 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Your instruction</label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Make this more concise and add action verbs"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          {lastEdit && <p className="text-green-300 text-sm">✓ {lastEdit}</p>}

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full rounded-xl gold-grad py-3 text-sm font-extrabold text-black disabled:opacity-40"
          >
            {loading ? "AI is editing…" : "Edit with AI"}
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 3: Add CvSectionEditor to /build page**

  In `app/build/page.tsx`, import and place the editor below the CV preview:

  ```tsx
  import { CvSectionEditor } from "@/components/CvSectionEditor";
  import { syncCvToAccount } from "@/lib/user-data";

  // In JSX, where CvPreview is rendered:
  {cv && (
    <>
      <CvPreview cv={cv} />
      <CvSectionEditor
        cv={cv}
        onCvUpdated={(updated) => {
          setCv(updated);
          syncCvToAccount(updated).catch(console.error);
        }}
      />
    </>
  )}
  ```

- [ ] **Step 4: Test locally**

  ```bash
  pnpm dev
  ```
  1. Go to `/build` → build or paste a CV → the CV preview renders
  2. Scroll down — the AI Section Editor panel should appear
  3. Select "Summary" → click "Make this more concise" quick prompt → click "Edit with AI"
  4. The CV preview should re-render with the updated summary

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/edit-cv-section/ components/CvSectionEditor.tsx app/build/page.tsx
  git commit -m "feat: AI-assisted CV section editor on /build — select section, prompt, AI rewrites"
  ```

---

## Bonus Tasks (not in original scope, but recommended additions)

These were identified during planning as high-value additions that complete the product experience:

### Bonus A: Add /talent link to landing page feature grid

The landing page (`app/page.tsx`) likely has a grid of features. Add Talent Marketplace to it so visitors know it exists.

### Bonus B: Clean up dead code

- Delete `lib/store.ts` (confirmed dead — replaced by Supabase)
- Remove the unused `const model = ...` line 5 in `lib/gemini.ts` (done in Task 2)
- Remove unused Prisma models `LeaderboardEntry` and `CofounderProfile` from `prisma/schema.prisma`

### Bonus C: Connect /dashboard and /cover to live DB

`app/dashboard/page.tsx` and `app/cover/page.tsx` currently read `data/jobs.json` (static hackathon file). A future task should replace this with a read from the `CachedJob` Neon table via `GET /api/live-jobs`.

---

## Self-Review Against Spec

| User requirement | Covered in |
|---|---|
| Sign in (CV / cofounder / saved jobs / score persist) | Task 5 + Task 6 |
| Job detail card scroll bug | Task 1 |
| Upload CV on /jobs to unlock Check Fit | Task 3 |
| Multi-sector filter | Task 4 |
| Roast thinks it's 2023 | Task 2 |
| About / Contact / Donate page + footer | Task 7 |
| Talent marketplace (graduates listed, companies browse) | Task 8 |
| AI CV section editor on /build | Task 9 |
| Checklist plan format | This doc |
| Add anything important | Bonus A, B, C |

All 9 original requirements covered. No gaps found.
