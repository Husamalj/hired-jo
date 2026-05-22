# Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Free/Pro/Hired tier limits, Paddle checkout, one-time purchase packs, hard block modal, and a pricing page on hiredjo.com.

**Architecture:** Supabase tracks subscription tier and monthly usage per user. Every AI action (CV build, edit, cover letter) checks limits before executing. When a limit is hit, a hard block modal appears with Paddle checkout for upgrade or one-time pack purchase. Paddle webhooks update subscription status in Supabase.

**Tech Stack:** Next.js App Router, Supabase (auth + postgres), Paddle Billing v2 (`@paddle/paddle-js`), TypeScript, Tailwind v4

---

## Tier Limits Reference

```typescript
// Copy this into lib/tiers.ts — single source of truth
export const TIERS = ["free", "pro", "hired"] as const;
export type Tier = typeof TIERS[number];

export const LIMITS = {
  free: {
    cv_builds_lifetime: 1,
    ai_edits_monthly: 2,
    cover_letters_lifetime: 1,
  },
  pro: {
    cv_builds_monthly: 5,
    ai_edits_monthly: 15,
    cover_letters_monthly: 10,
  },
  hired: {
    cv_builds_monthly: 20,
    ai_edits_monthly: 40,
    cover_letters_monthly: 30,
  },
} as const;

export const PACK_QUANTITIES = {
  cv_pack: 3,       // 2 JOD
  edit_pack: 10,    // 2 JOD
  cover_pack: 5,    // 2 JOD
} as const;

export type PackType = keyof typeof PACK_QUANTITIES;
export type UsageKey = "cv_builds" | "ai_edits" | "cover_letters";
```

---

## Paddle Products to Create (do this before coding)

Before writing any code, log into **sandbox.paddle.com** and create these products:

| Product Name | Type | Price | Currency |
|---|---|---|---|
| Hired.jo Pro | Subscription monthly | 6.00 | USD (closest to JOD, adjust later) |
| Hired.jo Hired | Subscription monthly | 15.00 | USD |
| CV Pack | One-time | 2.00 | USD |
| Edit Pack | One-time | 2.00 | USD |
| Cover Letter Pack | One-time | 2.00 | USD |

Save the **Price IDs** (format: `pri_xxxxx`) — you'll need them for env vars.

---

## Environment Variables to Add

Add these to `.env.local` and to Vercel project settings:

```
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxxxx
PADDLE_API_KEY=xxxxx
PADDLE_WEBHOOK_SECRET=xxxxx
NEXT_PUBLIC_PADDLE_ENV=sandbox

PADDLE_PRICE_PRO=pri_xxxxx
PADDLE_PRICE_HIRED=pri_xxxxx
PADDLE_PRICE_CV_PACK=pri_xxxxx
PADDLE_PRICE_EDIT_PACK=pri_xxxxx
PADDLE_PRICE_COVER_PACK=pri_xxxxx
```

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/tiers.ts` | Create | Tier limits + types (single source of truth) |
| `lib/usage.ts` | Create | Check + increment usage, get user tier |
| `app/api/subscription/route.ts` | Create | Get current user tier + usage |
| `app/api/paddle/webhook/route.ts` | Create | Handle Paddle subscription events |
| `app/api/build-cv/route.ts` | Modify | Check CV build limit before generating |
| `app/api/edit-cv-section/route.ts` | Modify | Check AI edit limit before editing |
| `app/api/cover/route.ts` | Modify | Check cover letter limit before generating |
| `components/UpgradeModal.tsx` | Create | Hard block modal with upgrade + pack CTAs |
| `components/UsageBadge.tsx` | Create | Small indicator showing remaining usage |
| `hooks/useUsage.ts` | Create | Client hook for fetching + caching usage |
| `app/pricing/page.tsx` | Create | Public pricing page |
| `app/api/paddle/checkout/route.ts` | Create | Create Paddle checkout session |

---

## Task 1: Supabase Database Schema

**Files:**
- No code files — run SQL in Supabase dashboard

- [ ] **Step 1: Open Supabase → SQL Editor and run this migration**

```sql
-- Subscription tier per user
create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  paddle_subscription_id text,
  paddle_customer_id text,
  tier text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Monthly usage tracking
create table if not exists user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  period text not null,
  cv_builds int not null default 0,
  ai_edits int not null default 0,
  cover_letters int not null default 0,
  cv_builds_lifetime int not null default 0,
  cover_letters_lifetime int not null default 0,
  ai_edits_bonus int not null default 0,
  cv_builds_bonus int not null default 0,
  cover_letters_bonus int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, period)
);

-- One-time pack purchases log
create table if not exists user_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  paddle_transaction_id text unique,
  pack_type text not null,
  quantity int not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table user_subscriptions enable row level security;
alter table user_usage enable row level security;
alter table user_purchases enable row level security;

create policy "Users read own subscription" on user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users read own usage" on user_usage
  for select using (auth.uid() = user_id);

create policy "Service role full access subscriptions" on user_subscriptions
  for all using (true) with check (true);

create policy "Service role full access usage" on user_usage
  for all using (true) with check (true);

create policy "Service role full access purchases" on user_purchases
  for all using (true) with check (true);
```

- [ ] **Step 2: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`**

Get it from Supabase → Project Settings → API → service_role key.

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

Also add it to Vercel environment variables.

- [ ] **Step 3: Commit**

```bash
git add .env.local
git commit -m "chore: add supabase service role key env var"
```

> ⚠️ `.env.local` is gitignored — only the key name goes in git, not the value.

---

## Task 2: Tier Limits File

**Files:**
- Create: `lib/tiers.ts`

- [ ] **Step 1: Create `lib/tiers.ts`**

```typescript
export const TIERS = ["free", "pro", "hired"] as const;
export type Tier = typeof TIERS[number];

export const LIMITS = {
  free: {
    cv_builds_lifetime: 1,
    ai_edits_monthly: 2,
    cover_letters_lifetime: 1,
  },
  pro: {
    cv_builds_monthly: 5,
    ai_edits_monthly: 15,
    cover_letters_monthly: 10,
  },
  hired: {
    cv_builds_monthly: 20,
    ai_edits_monthly: 40,
    cover_letters_monthly: 30,
  },
} as const;

export const PACK_QUANTITIES = {
  cv_pack: 3,
  edit_pack: 10,
  cover_pack: 5,
} as const;

export type PackType = keyof typeof PACK_QUANTITIES;
export type UsageKey = "cv_builds" | "ai_edits" | "cover_letters";

export const PADDLE_PRICE_IDS = {
  pro: process.env.PADDLE_PRICE_PRO!,
  hired: process.env.PADDLE_PRICE_HIRED!,
  cv_pack: process.env.PADDLE_PRICE_CV_PACK!,
  edit_pack: process.env.PADDLE_PRICE_EDIT_PACK!,
  cover_pack: process.env.PADDLE_PRICE_COVER_PACK!,
} as const;

export function getTierLabel(tier: Tier): string {
  return { free: "Free", pro: "Pro", hired: "Hired" }[tier];
}

export function getMonthlyLimit(tier: Tier, key: UsageKey): number {
  if (tier === "free") {
    if (key === "ai_edits") return LIMITS.free.ai_edits_monthly;
    return 0;
  }
  if (tier === "pro") {
    if (key === "cv_builds") return LIMITS.pro.cv_builds_monthly;
    if (key === "ai_edits") return LIMITS.pro.ai_edits_monthly;
    if (key === "cover_letters") return LIMITS.pro.cover_letters_monthly;
  }
  if (tier === "hired") {
    if (key === "cv_builds") return LIMITS.hired.cv_builds_monthly;
    if (key === "ai_edits") return LIMITS.hired.ai_edits_monthly;
    if (key === "cover_letters") return LIMITS.hired.cover_letters_monthly;
  }
  return 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tiers.ts
git commit -m "feat: add tier limits and types"
```

---

## Task 3: Usage Tracking Library

**Files:**
- Create: `lib/usage.ts`

- [ ] **Step 1: Install Supabase server client (already done) — verify `lib/supabase-server.ts` exists**

```bash
ls lib/supabase-server.ts
```

Expected: file exists. If not, create it per the existing pattern in the codebase.

- [ ] **Step 2: Create `lib/usage.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Tier, UsageKey } from "./tiers";
import { LIMITS, PACK_QUANTITIES } from "./tiers";
import type { PackType } from "./tiers";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();
  if (!data || data.status !== "active") return "free";
  return (data.tier as Tier) ?? "free";
}

export async function getUsage(userId: string) {
  const supabase = getServiceClient();
  const period = currentPeriod();
  const { data } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period", period)
    .single();
  return data ?? {
    cv_builds: 0,
    ai_edits: 0,
    cover_letters: 0,
    cv_builds_lifetime: 0,
    cover_letters_lifetime: 0,
    ai_edits_bonus: 0,
    cv_builds_bonus: 0,
    cover_letters_bonus: 0,
  };
}

export async function checkLimit(
  userId: string,
  key: UsageKey
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const [tier, usage] = await Promise.all([getUserTier(userId), getUsage(userId)]);

  if (tier === "free") {
    if (key === "cv_builds") {
      const lifetime = usage.cv_builds_lifetime + usage.cv_builds_bonus;
      const limit = LIMITS.free.cv_builds_lifetime;
      return { allowed: lifetime < limit, remaining: Math.max(0, limit - lifetime), limit };
    }
    if (key === "ai_edits") {
      const used = usage.ai_edits;
      const bonus = usage.ai_edits_bonus;
      const limit = LIMITS.free.ai_edits_monthly;
      const total = limit + bonus;
      return { allowed: used < total, remaining: Math.max(0, total - used), limit: total };
    }
    if (key === "cover_letters") {
      const lifetime = usage.cover_letters_lifetime + usage.cover_letters_bonus;
      const limit = LIMITS.free.cover_letters_lifetime;
      return { allowed: lifetime < limit, remaining: Math.max(0, limit - lifetime), limit };
    }
  }

  if (tier === "pro" || tier === "hired") {
    const limits = tier === "pro" ? LIMITS.pro : LIMITS.hired;
    const monthlyLimit = key === "cv_builds"
      ? limits.cv_builds_monthly
      : key === "ai_edits"
      ? limits.ai_edits_monthly
      : limits.cover_letters_monthly;
    const bonus = key === "cv_builds"
      ? usage.cv_builds_bonus
      : key === "ai_edits"
      ? usage.ai_edits_bonus
      : usage.cover_letters_bonus;
    const used = usage[key];
    const total = monthlyLimit + bonus;
    return { allowed: used < total, remaining: Math.max(0, total - used), limit: total };
  }

  return { allowed: false, remaining: 0, limit: 0 };
}

export async function incrementUsage(userId: string, key: UsageKey): Promise<void> {
  const supabase = getServiceClient();
  const period = currentPeriod();

  const existing = await getUsage(userId);

  const updates: Record<string, number> = { [key]: (existing[key] ?? 0) + 1 };

  // Track lifetime counts separately for free tier checks
  if (key === "cv_builds") updates.cv_builds_lifetime = (existing.cv_builds_lifetime ?? 0) + 1;
  if (key === "cover_letters") updates.cover_letters_lifetime = (existing.cover_letters_lifetime ?? 0) + 1;

  await supabase.from("user_usage").upsert({
    user_id: userId,
    period,
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,period" });
}

export async function applyPurchasedPack(userId: string, packType: PackType): Promise<void> {
  const supabase = getServiceClient();
  const period = currentPeriod();
  const qty = PACK_QUANTITIES[packType];
  const existing = await getUsage(userId);

  const bonusKey = packType === "cv_pack"
    ? "cv_builds_bonus"
    : packType === "edit_pack"
    ? "ai_edits_bonus"
    : "cover_letters_bonus";

  await supabase.from("user_usage").upsert({
    user_id: userId,
    period,
    ...existing,
    [bonusKey]: (existing[bonusKey] ?? 0) + qty,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,period" });
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/usage.ts
git commit -m "feat: add usage tracking library with tier checks"
```

---

## Task 4: Subscription API Route

**Files:**
- Create: `app/api/subscription/route.ts`

- [ ] **Step 1: Create `app/api/subscription/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserTier, getUsage } from "@/lib/usage";
import { LIMITS } from "@/lib/tiers";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tier: "free", usage: null });

  const [tier, usage] = await Promise.all([getUserTier(user.id), getUsage(user.id)]);
  return NextResponse.json({ tier, usage, limits: LIMITS[tier] });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/subscription/route.ts
git commit -m "feat: add subscription status API route"
```

---

## Task 5: Enforce Limits on CV Build API

**Files:**
- Modify: `app/api/build-cv/route.ts`

- [ ] **Step 1: Add limit check to the POST handler in `app/api/build-cv/route.ts`**

Replace the existing `export async function POST(req: Request)` with:

```typescript
import { checkLimit, incrementUsage, getUserTier } from "@/lib/usage";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Change runtime from "edge" to "nodejs" (usage lib needs Node crypto)
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // Check auth + limits
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { allowed, remaining } = await checkLimit(user.id, "cv_builds");
    if (!allowed) {
      return NextResponse.json(
        { error: "limit_reached", key: "cv_builds", remaining: 0 },
        { status: 402 }
      );
    }
  }

  try {
    const body = await req.json();
    const prompt = body.structured ? buildPrompt(body.structured) : buildLegacyPrompt(body.answers ?? []);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const text = extractJson(raw);
    const cv = JSON.parse(text);

    // Increment after success
    if (user) await incrementUsage(user.id, "cv_builds");

    return NextResponse.json({ cv });
  } catch (e: any) {
    console.error("build-cv error:", e);
    return NextResponse.json({ error: "Failed to build CV", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/build-cv/route.ts
git commit -m "feat: enforce CV build limit on API"
```

---

## Task 6: Enforce Limits on AI Edit API

**Files:**
- Modify: `app/api/edit-cv-section/route.ts`

- [ ] **Step 1: Add limit check to `app/api/edit-cv-section/route.ts`**

At the top of the POST handler, before calling Gemini, add:

```typescript
import { checkLimit, incrementUsage } from "@/lib/usage";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs"; // changed from edge

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { allowed } = await checkLimit(user.id, "ai_edits");
    if (!allowed) {
      return NextResponse.json(
        { error: "limit_reached", key: "ai_edits", remaining: 0 },
        { status: 402 }
      );
    }
  }

  // ... rest of existing handler ...

  // After successful edit, before returning:
  if (user) await incrementUsage(user.id, "ai_edits");

  return NextResponse.json({ section, edited });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/edit-cv-section/route.ts
git commit -m "feat: enforce AI edit limit on API"
```

---

## Task 7: Enforce Limits on Cover Letter API

**Files:**
- Modify: `app/api/cover/route.ts`

- [ ] **Step 1: Check if `app/api/cover/route.ts` exists**

```bash
ls app/api/cover/route.ts
```

If it exists, add the same pattern as Task 6 but with key `"cover_letters"`. If it does not exist, skip this task.

- [ ] **Step 2: Add limit check (same pattern as Task 6)**

```typescript
import { checkLimit, incrementUsage } from "@/lib/usage";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { allowed } = await checkLimit(user.id, "cover_letters");
    if (!allowed) {
      return NextResponse.json(
        { error: "limit_reached", key: "cover_letters", remaining: 0 },
        { status: 402 }
      );
    }
  }

  // ... existing handler ...

  if (user) await incrementUsage(user.id, "cover_letters");
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cover/route.ts
git commit -m "feat: enforce cover letter limit on API"
```

---

## Task 8: Usage Hook (Client)

**Files:**
- Create: `hooks/useUsage.ts`

- [ ] **Step 1: Create `hooks/useUsage.ts`**

```typescript
"use client";
import { useEffect, useState } from "react";
import type { Tier } from "@/lib/tiers";
import { LIMITS } from "@/lib/tiers";

export interface UsageState {
  tier: Tier;
  usage: {
    cv_builds: number;
    ai_edits: number;
    cover_letters: number;
    cv_builds_lifetime: number;
    cover_letters_lifetime: number;
    ai_edits_bonus: number;
    cv_builds_bonus: number;
    cover_letters_bonus: number;
  } | null;
  limits: typeof LIMITS[Tier];
  loading: boolean;
  refetch: () => void;
}

export function useUsage(): UsageState {
  const [state, setState] = useState<Omit<UsageState, "refetch">>({
    tier: "free",
    usage: null,
    limits: LIMITS.free,
    loading: true,
  });

  const fetch_ = () => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => setState({ tier: data.tier, usage: data.usage, limits: data.limits, loading: false }))
      .catch(() => setState((s) => ({ ...s, loading: false })));
  };

  useEffect(() => { fetch_(); }, []);

  return { ...state, refetch: fetch_ };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useUsage.ts
git commit -m "feat: add useUsage client hook"
```

---

## Task 9: Upgrade Modal Component

**Files:**
- Create: `components/UpgradeModal.tsx`

- [ ] **Step 1: Create `components/UpgradeModal.tsx`**

```typescript
"use client";
import { X, Zap, Crown } from "lucide-react";
import type { UsageKey } from "@/lib/tiers";

const LABELS: Record<UsageKey, string> = {
  cv_builds: "CV builds",
  ai_edits: "AI section edits",
  cover_letters: "cover letters",
};

const PACK_LABELS: Record<UsageKey, { name: string; qty: string; priceId: string }> = {
  cv_builds: { name: "CV Pack", qty: "3 extra CV builds", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CV_PACK ?? "" },
  ai_edits: { name: "Edit Pack", qty: "10 extra AI edits", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK ?? "" },
  cover_letters: { name: "Cover Pack", qty: "5 extra cover letters", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK ?? "" },
};

interface Props {
  usageKey: UsageKey;
  onClose: () => void;
  onCheckout: (priceId: string) => void;
}

export function UpgradeModal({ usageKey, onClose, onCheckout }: Props) {
  const label = LABELS[usageKey];
  const pack = PACK_LABELS[usageKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0716] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition">
          <X size={18} />
        </button>

        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-yellow-300/70 mb-2">Limit reached</p>
          <h2 className="text-xl font-bold text-white">You've used all your {label} this month</h2>
          <p className="text-sm text-white/50 mt-1">Upgrade to keep going or buy a one-time pack.</p>
        </div>

        {/* Upgrade options */}
        <div className="space-y-3">
          {/* Pro */}
          <button
            onClick={() => onCheckout(process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? "")}
            className="w-full flex items-center justify-between rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-3.5 hover:bg-yellow-300/15 transition group"
          >
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-yellow-300" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Upgrade to Pro</p>
                <p className="text-xs text-white/50">
                  {usageKey === "cv_builds" ? "5 CVs/month" :
                   usageKey === "ai_edits" ? "15 edits/month" :
                   "10 cover letters/month"}
                </p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-yellow-300">6 JOD/mo</span>
          </button>

          {/* Hired */}
          <button
            onClick={() => onCheckout(process.env.NEXT_PUBLIC_PADDLE_PRICE_HIRED ?? "")}
            className="w-full flex items-center justify-between rounded-xl border border-purple-400/25 bg-purple-400/10 px-4 py-3.5 hover:bg-purple-400/15 transition"
          >
            <div className="flex items-center gap-3">
              <Crown size={16} className="text-purple-300" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Upgrade to Hired</p>
                <p className="text-xs text-white/50">
                  {usageKey === "cv_builds" ? "20 CVs/month" :
                   usageKey === "ai_edits" ? "40 edits/month" :
                   "30 cover letters/month"} + badge + courses
                </p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-purple-300">15 JOD/mo</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">or one-time</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Pack */}
          <button
            onClick={() => onCheckout(pack.priceId)}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 hover:bg-white/8 transition"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-white">{pack.name}</p>
              <p className="text-xs text-white/50">{pack.qty}, no subscription</p>
            </div>
            <span className="text-sm font-extrabold text-white/70">2 JOD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_` versions of Paddle price IDs to `.env.local`** (needed for client component)

```
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_HIRED=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_CV_PACK=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK=pri_xxxxx
```

- [ ] **Step 3: Commit**

```bash
git add components/UpgradeModal.tsx
git commit -m "feat: add upgrade modal with pro/hired/pack CTAs"
```

---

## Task 10: Paddle Checkout API Route

**Files:**
- Create: `app/api/paddle/checkout/route.ts`

- [ ] **Step 1: Install Paddle Node SDK**

```bash
pnpm add @paddle/paddle-node-sdk
```

- [ ] **Step 2: Create `app/api/paddle/checkout/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    customData: { user_id: user.id },
    customer: { email: user.email! },
  });

  return NextResponse.json({ checkoutUrl: transaction.checkout?.url });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/paddle/checkout/route.ts
git commit -m "feat: add Paddle checkout session creator"
```

---

## Task 11: Paddle Webhook Handler

**Files:**
- Create: `app/api/paddle/webhook/route.ts`

- [ ] **Step 1: Create `app/api/paddle/webhook/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { Paddle, Environment, EventName } from "@paddle/paddle-node-sdk";
import { createClient } from "@supabase/supabase-js";
import { applyPurchasedPack } from "@/lib/usage";
import type { PackType } from "@/lib/tiers";

export const runtime = "nodejs";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PRICE_TO_TIER: Record<string, string> = {
  [process.env.PADDLE_PRICE_PRO!]: "pro",
  [process.env.PADDLE_PRICE_HIRED!]: "hired",
};

const PRICE_TO_PACK: Record<string, PackType> = {
  [process.env.PADDLE_PRICE_CV_PACK!]: "cv_pack",
  [process.env.PADDLE_PRICE_EDIT_PACK!]: "edit_pack",
  [process.env.PADDLE_PRICE_COVER_PACK!]: "cover_pack",
};

export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature") ?? "";
  const rawBody = await req.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  if (event.eventType === EventName.SubscriptionActivated || event.eventType === EventName.SubscriptionUpdated) {
    const sub = event.data as any;
    const userId = sub.customData?.user_id;
    const priceId = sub.items?.[0]?.price?.id;
    const tier = PRICE_TO_TIER[priceId] ?? "free";

    if (userId) {
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        paddle_subscription_id: sub.id,
        paddle_customer_id: sub.customerId,
        tier,
        status: "active",
        current_period_end: sub.currentBillingPeriod?.endsAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  if (event.eventType === EventName.SubscriptionCanceled) {
    const sub = event.data as any;
    const userId = sub.customData?.user_id;
    if (userId) {
      await supabase.from("user_subscriptions")
        .update({ status: "cancelled", tier: "free", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
  }

  if (event.eventType === EventName.TransactionCompleted) {
    const tx = event.data as any;
    const userId = tx.customData?.user_id;
    const priceId = tx.items?.[0]?.price?.id;
    const packType = PRICE_TO_PACK[priceId];

    if (userId && packType) {
      await applyPurchasedPack(userId, packType);
      await supabase.from("user_purchases").insert({
        user_id: userId,
        paddle_transaction_id: tx.id,
        pack_type: packType,
        quantity: PRICE_TO_PACK[priceId] ? 1 : 0,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Register webhook in Paddle dashboard**

Go to sandbox.paddle.com → Developer Tools → Notifications → New notification:
- URL: `https://hiredjo.com/api/paddle/webhook`
- Events: `subscription.activated`, `subscription.updated`, `subscription.canceled`, `transaction.completed`
- Copy the webhook secret → add to `.env.local` as `PADDLE_WEBHOOK_SECRET`

- [ ] **Step 3: Commit**

```bash
git add app/api/paddle/webhook/route.ts
git commit -m "feat: add Paddle webhook handler for subscriptions and packs"
```

---

## Task 12: Wire Upgrade Modal into CV Builder

**Files:**
- Modify: `app/build/page.tsx`

- [ ] **Step 1: Import and use UpgradeModal in `app/build/page.tsx`**

Add near the top of the file:
```typescript
import { UpgradeModal } from "@/components/UpgradeModal";
import type { UsageKey } from "@/lib/tiers";
```

Add state:
```typescript
const [limitKey, setLimitKey] = useState<UsageKey | null>(null);
```

In the `send` function, when the API returns `status === 402`:
```typescript
const res = await fetch("/api/build-cv", { ... });
if (res.status === 402) {
  setLimitKey("cv_builds");
  setThinking(false);
  return;
}
```

Add checkout handler:
```typescript
async function handleCheckout(priceId: string) {
  const res = await fetch("/api/paddle/checkout", {
    method: "POST",
    body: JSON.stringify({ priceId }),
    headers: { "Content-Type": "application/json" },
  });
  const { checkoutUrl } = await res.json();
  if (checkoutUrl) window.location.href = checkoutUrl;
}
```

Add modal to JSX (just before closing `</>`):
```tsx
{limitKey && (
  <UpgradeModal
    usageKey={limitKey}
    onClose={() => setLimitKey(null)}
    onCheckout={handleCheckout}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/build/page.tsx
git commit -m "feat: show upgrade modal when CV build limit reached"
```

---

## Task 13: Wire Upgrade Modal into CV Section Editor

**Files:**
- Modify: `components/CvSectionEditor.tsx`

- [ ] **Step 1: Import UpgradeModal and add limit handling**

```typescript
import { UpgradeModal } from "@/components/UpgradeModal";
import type { UsageKey } from "@/lib/tiers";
```

Add state:
```typescript
const [limitKey, setLimitKey] = useState<UsageKey | null>(null);
```

When the edit API returns 402:
```typescript
if (res.status === 402) {
  setLimitKey("ai_edits");
  return;
}
```

Add checkout handler and modal same as Task 12 but with `usageKey="ai_edits"`.

- [ ] **Step 2: Commit**

```bash
git add components/CvSectionEditor.tsx
git commit -m "feat: show upgrade modal when AI edit limit reached"
```

---

## Task 14: Pricing Page

**Files:**
- Create: `app/pricing/page.tsx`

- [ ] **Step 1: Create `app/pricing/page.tsx`**

```typescript
import Navbar from "@/components/Navbar";
import { Check, X, Zap, Crown } from "lucide-react";

export const metadata = { title: "Pricing — Hired.jo" };

const tiers = [
  {
    name: "Free",
    price: "0",
    period: "",
    description: "Try it out. No card needed.",
    color: "border-white/10",
    badge: null,
    features: [
      { text: "1 CV build (lifetime)", included: true },
      { text: "2 AI edits per month", included: true },
      { text: "1 cover letter (lifetime)", included: true },
      { text: "CV Roast", included: true },
      { text: "Job matching & saved jobs", included: true },
      { text: "Recruiter contact", included: true },
      { text: "Normal talent visibility", included: true },
      { text: "Premium CV templates", included: false },
      { text: "Hired badge", included: false },
      { text: "Paid courses access", included: false },
    ],
    cta: "Get started free",
    ctaHref: "/auth/login",
    ctaStyle: "border border-white/15 bg-white/5 text-white hover:bg-white/10",
    priceId: null,
  },
  {
    name: "Pro",
    price: "6",
    period: "/month",
    description: "For graduates actively job hunting.",
    color: "border-yellow-300/30",
    badge: "Most popular",
    features: [
      { text: "5 CV builds per month", included: true },
      { text: "15 AI edits per month", included: true },
      { text: "10 cover letters per month", included: true },
      { text: "CV Roast", included: true },
      { text: "Job matching & saved jobs", included: true },
      { text: "Recruiter contact", included: true },
      { text: "Mid talent visibility boost", included: true },
      { text: "3 premium CV templates", included: true },
      { text: "Hired badge", included: false },
      { text: "Paid courses access", included: false },
    ],
    cta: "Upgrade to Pro",
    ctaHref: null,
    ctaStyle: "gold-grad text-black font-extrabold",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
  },
  {
    name: "Hired",
    price: "15",
    period: "/month",
    description: "Maximum visibility. Serious candidates only.",
    color: "border-purple-400/30",
    badge: "Best value",
    features: [
      { text: "20 CV builds per month", included: true },
      { text: "40 AI edits per month", included: true },
      { text: "30 cover letters per month", included: true },
      { text: "CV Roast", included: true },
      { text: "Job matching & saved jobs", included: true },
      { text: "Recruiter contact", included: true },
      { text: "Top talent visibility boost", included: true },
      { text: "All premium CV templates", included: true },
      { text: "Hired badge on profile", included: true },
      { text: "Paid courses access", included: true },
    ],
    cta: "Upgrade to Hired",
    ctaHref: null,
    ctaStyle: "bg-purple-500 text-white font-extrabold hover:bg-purple-400",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_HIRED,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen px-4 py-20">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-14 space-y-3">
            <h1 className="font-display text-5xl font-extrabold gold-text-grad">Simple pricing</h1>
            <p className="text-white/50 text-lg">Built for Jordan. No tricks, no annual traps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border ${tier.color} bg-white/[0.03] p-6 flex flex-col`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gold-grad px-3 py-0.5 text-xs font-bold text-black">
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white/50 mb-1">{tier.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">{tier.price} JOD</span>
                    <span className="text-white/40 pb-1">{tier.period}</span>
                  </div>
                  <p className="text-sm text-white/40">{tier.description}</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included
                        ? <Check size={14} className="text-yellow-300 shrink-0" />
                        : <X size={14} className="text-white/20 shrink-0" />}
                      <span className={f.included ? "text-white/70" : "text-white/25"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref ?? `/auth/login?next=/pricing`}
                  className={`w-full text-center rounded-xl px-4 py-3 text-sm transition ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          {/* One-time packs */}
          <div className="mt-16 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Just need a little more?</h2>
            <p className="text-white/40 text-sm mb-8">One-time packs. No subscription required.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { name: "CV Pack", desc: "3 extra CV builds", price: "2 JOD" },
                { name: "Edit Pack", desc: "10 extra AI edits", price: "2 JOD" },
                { name: "Cover Pack", desc: "5 extra cover letters", price: "2 JOD" },
              ].map((pack) => (
                <div key={pack.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
                  <p className="font-bold text-white mb-1">{pack.name}</p>
                  <p className="text-sm text-white/40 mb-3">{pack.desc}</p>
                  <p className="text-lg font-extrabold text-yellow-300">{pack.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Add Pricing link to Navbar More menu**

In `components/Navbar.tsx`, add to `moreLinks` array:
```typescript
{ href: "/pricing", label: "Pricing" },
```

- [ ] **Step 3: Commit**

```bash
git add app/pricing/page.tsx components/Navbar.tsx
git commit -m "feat: add pricing page with all tiers and one-time packs"
```

---

## Task 15: Final Testing Checklist

- [ ] **Test free tier limit — CV build**
  1. Sign in with a new test account
  2. Build 1 CV → should succeed
  3. Try to build a 2nd CV → upgrade modal should appear
  4. Verify modal shows Pro (6 JOD), Hired (15 JOD), CV Pack (2 JOD) options

- [ ] **Test free tier limit — AI edits**
  1. Go to `/build`, finish a CV
  2. Use AI section editor 2 times → both should succeed
  3. Try 3rd edit → upgrade modal should appear with `edit_pack` option

- [ ] **Test Paddle sandbox checkout**
  1. Click "Upgrade to Pro" in the modal
  2. Should redirect to Paddle checkout page
  3. Use Paddle test card: `4242 4242 4242 4242`, any future date, any CVV
  4. After payment → check Supabase `user_subscriptions` table → tier should be "pro"
  5. Refresh the app → limits should now be Pro limits

- [ ] **Test one-time pack**
  1. Hit edit limit as free user
  2. Click "Edit Pack — 2 JOD"
  3. Complete Paddle checkout
  4. Check Supabase `user_usage` → `ai_edits_bonus` should increase by 10
  5. Try editing again → should work

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete monetization system - tiers, limits, Paddle, upgrade modal"
git push origin main
```
