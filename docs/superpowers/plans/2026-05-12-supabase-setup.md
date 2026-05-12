# Supabase Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory store and placeholder Prisma/Neon setup with Supabase (Postgres + JS client), persisting co-founder profiles and leaderboard entries across deploys.

**Architecture:** Install `@supabase/supabase-js`, create two tables in Supabase (`cofounder_profiles`, `leaderboard`), rewrite `lib/db.ts` as a Supabase client singleton, update `app/api/cofounder/route.ts` to use Supabase directly (drop Prisma), update `app/api/leaderboard/route.ts` to use Supabase (drop in-memory store). No auth — lightweight alias+email only.

**Tech Stack:** Next.js 14 App Router, Supabase JS v2, TypeScript

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/supabase.ts` | Create | Supabase client singleton |
| `lib/db.ts` | Delete / replace | Was Prisma+Neon, replaced by supabase.ts |
| `lib/store.ts` | Keep but unused | In-memory fallback — leave as-is |
| `app/api/cofounder/route.ts` | Modify | Use Supabase instead of Prisma |
| `app/api/leaderboard/route.ts` | Modify | Use Supabase instead of in-memory store |
| `.env.local` | Modify | Add SUPABASE_URL and SUPABASE_ANON_KEY |

---

## Task 1: Create Supabase project and tables

- [ ] **Step 1: Go to supabase.com → New project**
  - Name: `hired-jo`
  - Region: pick closest (EU West or similar)
  - Wait for project to provision (~1 min)

- [ ] **Step 2: Open SQL Editor in Supabase dashboard and run this:**

```sql
-- Co-founder profiles
create table if not exists cofounder_profiles (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  email text not null,
  skills text not null,       -- JSON array string e.g. '["React","Node"]'
  interests text not null,    -- JSON array string
  vibe text not null,
  embedding text,             -- JSON number array string (768 floats)
  created_at timestamptz default now()
);

-- Leaderboard
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  score integer not null,
  top_skill text not null default '—',
  created_at timestamptz default now()
);
```

- [ ] **Step 3: Copy credentials**
  - Go to Project Settings → API
  - Copy `Project URL` → this is `SUPABASE_URL`
  - Copy `anon public` key → this is `SUPABASE_ANON_KEY`

---

## Task 2: Add env vars and install SDK

- [ ] **Step 1: Add to `.env.local`**

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

- [ ] **Step 2: Install Supabase JS client**

```bash
cd hired-jo
npm install @supabase/supabase-js
```

Expected: package added to node_modules, package.json updated with `@supabase/supabase-js`.

---

## Task 3: Create `lib/supabase.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

const g = globalThis as unknown as { _supabase?: ReturnType<typeof createClient> };
export const supabase = g._supabase ?? createClient(url, key);
if (process.env.NODE_ENV !== "production") g._supabase = supabase;
```

---

## Task 4: Rewrite `app/api/cofounder/route.ts`

- [ ] **Step 1: Replace the entire file content:**

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { embed, cosine } from "@/lib/embeddings";

type CofounderRow = {
  id: string;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
  embedding: string | null;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "register") {
      const text = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")} ${body.vibe}`;
      const emb = await embed(text);

      const { error } = await supabase.from("cofounder_profiles").insert({
        alias: body.alias,
        email: body.email,
        skills: JSON.stringify(body.skills),
        interests: JSON.stringify(body.interests),
        vibe: body.vibe,
        embedding: JSON.stringify(emb),
      });

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "match") {
      const meText = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")}`;
      const meEmb = await embed(meText);

      const { data, error } = await supabase
        .from("cofounder_profiles")
        .select("id, alias, email, skills, interests, vibe, embedding");

      if (error) throw new Error(error.message);

      const ranked = (data as CofounderRow[])
        .map((p) => {
          const pSkills: string[] = JSON.parse(p.skills);
          const pInterests: string[] = JSON.parse(p.interests);
          const complementary = pSkills.filter(
            (s) => !(body.skills as string[]).includes(s)
          ).length;
          const shared = pInterests.filter(
            (i) => (body.interests as string[]).includes(i)
          ).length;
          const sim = p.embedding ? cosine(meEmb, JSON.parse(p.embedding)) : 0;
          const matchScore = complementary * 0.4 + shared * 0.3 + sim * 0.3;
          const { embedding: _omit, ...rest } = p;
          return { ...rest, matchScore };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      return NextResponse.json({ matches: ranked });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

## Task 5: Rewrite `app/api/leaderboard/route.ts`

- [ ] **Step 1: Replace the entire file content:**

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, alias, score, top_skill, created_at")
    .order("score", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const { alias, score, topSkill } = await req.json();
    if (!alias || score === undefined)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data, error } = await supabase
      .from("leaderboard")
      .insert({ alias, score, top_skill: topSkill ?? "—" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
```

---

## Task 6: Fix leaderboard page (column name changed)

The leaderboard page reads `entry.topSkill` but Supabase returns `top_skill`. Update the page.

- [ ] **Step 1: Open `app/leaderboard/page.tsx` and find every reference to `topSkill` in the display JSX and change to `top_skill`.**

Find: `entry.topSkill`
Replace with: `(entry as any).top_skill`

Or add a type and map in the GET handler — the simpler fix is aliasing in the SELECT:

In `app/api/leaderboard/route.ts` change the select to alias the column:
```typescript
.select("id, alias, score, top_skill as topSkill, created_at as createdAt")
```

This way the frontend type `LeaderboardEntry` (alias, score, topSkill, createdAt) stays compatible.

- [ ] **Step 2: Update the leaderboard route select line:**

```typescript
.select("id, alias, score, top_skill as topSkill, created_at as createdAt")
```

---

## Task 7: Remove Prisma dependency from build

The `package.json` build script runs `prisma generate` which will fail without a schema. Fix it.

- [ ] **Step 1: Update `package.json` build script**

Change:
```json
"build": "prisma generate && next build"
```
To:
```json
"build": "next build"
```

---

## Task 8: Test locally

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000, no errors about DATABASE_URL or Prisma.

- [ ] **Step 2: Test co-founder register**

Go to http://localhost:3000/cofounder, fill in alias/email/skills/interests/vibe, submit.
Expected: "registered" message. Check Supabase dashboard → Table Editor → cofounder_profiles → new row visible.

- [ ] **Step 3: Test co-founder match**

Click "Find matches". Expected: list of top 5 profiles returned (or empty if only one entry).

- [ ] **Step 4: Test leaderboard**

Go to http://localhost:3000/score, submit a score. Go to http://localhost:3000/leaderboard. Expected: entry appears.

---

## Task 9: Commit and push

- [ ] **Step 1: Commit**

```bash
git add lib/supabase.ts app/api/cofounder/route.ts app/api/leaderboard/route.ts package.json .env.local
git commit -m "feat: replace in-memory store with Supabase (cofounder + leaderboard)"
```

Note: `.env.local` is in `.gitignore` — don't force-add it. Add the other files only.

```bash
git add lib/supabase.ts app/api/cofounder/route.ts app/api/leaderboard/route.ts package.json
git commit -m "feat: replace in-memory store with Supabase (cofounder + leaderboard)"
git push origin main
```
