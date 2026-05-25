# Talent Stars & Hired Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a star/unstar toggle to talent profiles with counts on cards + a Top Starred leaderboard tab, plus a "Hired Pro" badge for active subscribers.

**Architecture:** New `/api/talent/star` edge route handles toggle logic against the `talent_stars` table and updates the denormalised `stars` count on `talent_profiles`. The talent GET API is extended to join `user_subscriptions` and return `is_hired_subscriber`. UI changes span three files: the profile page, the talent listing page (cards + new tab), and the public profile page.

**Tech Stack:** Next.js App Router, Supabase (service role client), `@supabase/supabase-js`, TypeScript, Tailwind v4, lucide-react.

---

### Task 1: Star API route

**Files:**
- Create: `app/api/talent/star/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Verify auth via session cookie
  let callerId: string | null = null;
  const response = NextResponse.next();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  callerId = user.id;

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  const sb = getServiceClient();

  // Check if already starred
  const { data: existing } = await sb
    .from("talent_stars")
    .select("id")
    .eq("user_id", callerId)
    .eq("starred_user_id", targetUserId)
    .maybeSingle();

  if (existing) {
    // Unstar
    await sb.from("talent_stars").delete().eq("id", existing.id);
    await sb.rpc("decrement_stars", { target_user_id: targetUserId });
    const { data: profile } = await sb
      .from("talent_profiles")
      .select("stars")
      .eq("user_id", targetUserId)
      .maybeSingle();
    return NextResponse.json({ starred: false, stars: profile?.stars ?? 0 });
  } else {
    // Star
    await sb.from("talent_stars").insert({ user_id: callerId, starred_user_id: targetUserId });
    await sb.rpc("increment_stars", { target_user_id: targetUserId });
    const { data: profile } = await sb
      .from("talent_profiles")
      .select("stars")
      .eq("user_id", targetUserId)
      .maybeSingle();
    return NextResponse.json({ starred: true, stars: profile?.stars ?? 0 });
  }
}
```

- [ ] **Step 2: Create the two SQL helper functions in Supabase SQL Editor**

```sql
CREATE OR REPLACE FUNCTION increment_stars(target_user_id TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE talent_profiles SET stars = COALESCE(stars, 0) + 1 WHERE user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION decrement_stars(target_user_id TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE talent_profiles SET stars = GREATEST(COALESCE(stars, 0) - 1, 0) WHERE user_id = target_user_id;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add app/api/talent/star/route.ts
git commit -m "feat: add star/unstar API route"
```

---

### Task 2: Extend talent GET API to return stars + subscriber badge

**Files:**
- Modify: `app/api/talent/route.ts`

- [ ] **Step 1: Update the GET handler to join subscriptions and include stars**

In `app/api/talent/route.ts`, replace the listing query section (the `let query = sb.from("talent_profiles")...` block) with:

```ts
// Fetch a single user's own profile
if (userId) {
  const { data, error } = await sb.from("talent_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json(null);
  // Check subscription
  const { data: sub } = await sb.from("user_subscriptions").select("status").eq("user_id", userId).eq("status", "active").maybeSingle();
  return NextResponse.json({ ...data, is_hired_subscriber: !!sub });
}

let query = sb.from("talent_profiles").select("*").eq("is_visible", true);

if (field && field !== "All") query = query.ilike("field", `%${field}%`);
if (country && country !== "All") query = query.ilike("country", `%${country}%`);
if (year && year !== "All") query = query.eq("graduation_year", parseInt(year));
if (experience && experience !== "All") query = query.eq("years_experience", parseInt(experience));
if (skill) query = query.contains("skills", [skill]);

const { data, error } = await query.order("stars", { ascending: false }).limit(100);
if (error) return NextResponse.json({ error: error.message }, { status: 500 });

// Batch-fetch active subscribers to attach badge
const userIds = (data ?? []).map((p: any) => p.user_id);
let subscriberSet = new Set<string>();
if (userIds.length > 0) {
  const { data: subs } = await sb.from("user_subscriptions").select("user_id").eq("status", "active").in("user_id", userIds);
  subscriberSet = new Set((subs ?? []).map((s: any) => s.user_id));
}

const enriched = (data ?? []).map((p: any) => ({ ...p, is_hired_subscriber: subscriberSet.has(p.user_id) }));
return NextResponse.json(enriched);
```

- [ ] **Step 2: Commit**

```bash
git add app/api/talent/route.ts
git commit -m "feat: talent API returns stars count and is_hired_subscriber"
```

---

### Task 3: Update TalentProfile interface in both talent pages

**Files:**
- Modify: `app/talent/page.tsx`
- Modify: `app/talent/[id]/page.tsx`

- [ ] **Step 1: Add fields to interface in `app/talent/page.tsx`**

Find the `interface TalentProfile` block and add:
```ts
  stars?: number;
  is_hired_subscriber?: boolean;
```

- [ ] **Step 2: Add fields to interface in `app/talent/[id]/page.tsx`**

Find the `interface TalentProfile` block and add:
```ts
  stars?: number;
  is_hired_subscriber?: boolean;
```

- [ ] **Step 3: Commit**

```bash
git add app/talent/page.tsx "app/talent/[id]/page.tsx"
git commit -m "feat: add stars and is_hired_subscriber to TalentProfile interface"
```

---

### Task 4: Star button on public profile page `/talent/[id]`

**Files:**
- Modify: `app/talent/[id]/page.tsx`

- [ ] **Step 1: Add star state and fetch whether current user has starred this profile**

Add after the existing state declarations:
```ts
const [stars, setStars] = useState<number>(0);
const [hasStarred, setHasStarred] = useState(false);
const [starLoading, setStarLoading] = useState(false);
```

In the `useEffect` that loads the profile, after `setProfile(data)`, add:
```ts
setStars(data.stars ?? 0);
// Check if current user has starred this profile
if (currentUser && data.user_id) {
  const sbClient = createSupabaseBrowserClient();
  const { data: starRow } = await sbClient
    .from("talent_stars")
    .select("id")
    .eq("user_id", currentUser)
    .eq("starred_user_id", data.user_id)
    .maybeSingle();
  setHasStarred(!!starRow);
}
```

- [ ] **Step 2: Add star toggle handler**

Add after `handleAvatarUpload`:
```ts
async function handleStar() {
  if (!currentUser) { location.href = `/auth/login?next=/talent/${id}`; return; }
  setStarLoading(true);
  const res = await fetch("/api/talent/star", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId: profile!.user_id }),
  });
  if (res.ok) {
    const { starred, stars: newCount } = await res.json();
    setHasStarred(starred);
    setStars(newCount);
  }
  setStarLoading(false);
}
```

- [ ] **Step 3: Add Star button and Hired badge to the profile header UI**

Find the button row that has the Contact button. Replace it with:
```tsx
<div className="flex items-center gap-2">
  {profile.is_hired_subscriber && (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-1 text-xs font-bold text-yellow-300">
      ⚡ Hired Pro
    </span>
  )}
  <button
    onClick={handleStar}
    disabled={starLoading}
    className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
      hasStarred
        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
        : "border-white/15 bg-white/5 text-white hover:bg-white/10"
    }`}
  >
    {hasStarred ? "★" : "☆"} {stars.toLocaleString()}
  </button>
  <a href={`mailto:${profile.email}`}
    className="inline-flex items-center gap-2 rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black">
    <Mail size={14} /> Contact
  </a>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add "app/talent/[id]/page.tsx"
git commit -m "feat: star button and hired pro badge on talent profile page"
```

---

### Task 5: Star count badge + Hired badge on talent listing cards

**Files:**
- Modify: `app/talent/page.tsx`

- [ ] **Step 1: Update ProfileCard to show star count and Hired Pro badge**

Find the `function ProfileCard` component. In the card's bottom area (where the View Profile button is), add the star count. Find where the profile name (`p.alias`) is rendered and add the badge next to it:

```tsx
// Next to the name — add badge
<div className="flex items-center gap-2 flex-wrap">
  <p className="font-bold text-white text-sm">{p.alias}</p>
  {p.is_hired_subscriber && (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
      ⚡ Pro
    </span>
  )}
</div>
```

And in the card footer area next to "View Profile", add:
```tsx
{(p.stars ?? 0) > 0 && (
  <span className="text-xs text-white/40 flex items-center gap-1">
    ★ {(p.stars ?? 0).toLocaleString()}
  </span>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/talent/page.tsx
git commit -m "feat: star count and hired pro badge on talent cards"
```

---

### Task 6: Top Starred leaderboard tab

**Files:**
- Modify: `app/talent/page.tsx`

- [ ] **Step 1: Add the new tab button**

Find the tab buttons row and add a third tab:
```tsx
<button onClick={() => setTab("top-starred")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "top-starred" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}>
  🏆 Top Starred
</button>
```

- [ ] **Step 2: Add tab type to state**

Find `const [tab, setTab] = useState` and update its type:
```ts
const [tab, setTab] = useState<"browse" | "my-profile" | "top-starred">("browse");
```

- [ ] **Step 3: Add the Top Starred tab content**

After the `{/* ── MY PROFILE ── */}` closing block, add:
```tsx
{/* ── TOP STARRED ── */}
{tab === "top-starred" && (
  <div className="max-w-2xl mx-auto">
    <div className="space-y-3">
      {[...profiles]
        .filter(p => (p.stars ?? 0) > 0)
        .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
        .slice(0, 10)
        .map((p, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
          const colors = ["#3F2B96","#7C3AED","#0369A1","#065F46","#9A3412","#1D4ED8"];
          const avatarColor = colors[(p.alias?.charCodeAt(0) ?? 0) % colors.length];
          const initials = p.alias?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
          return (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <span className="text-2xl w-8 text-center shrink-0">{medal}</span>
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.alias} className="w-11 h-11 rounded-full object-cover shrink-0" />
                : <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: avatarColor }}>{initials}</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm truncate">{p.alias}</p>
                  {p.is_hired_subscriber && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-bold text-yellow-300 shrink-0">⚡ Pro</span>
                  )}
                </div>
                <p className="text-xs text-white/40 truncate">{p.field}{p.country ? ` · ${p.country}` : ""}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-yellow-300 font-bold text-sm">★ {(p.stars ?? 0).toLocaleString()}</span>
                <Link href={`/talent/${p.user_id}`} className="text-xs text-white/40 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 transition">View</Link>
              </div>
            </div>
          );
        })}
      {profiles.filter(p => (p.stars ?? 0) > 0).length === 0 && (
        <div className="text-center py-20 text-white/30 text-sm">No stars yet — be the first to star a profile!</div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add app/talent/page.tsx
git commit -m "feat: top starred leaderboard tab on talent page"
```

---

### Task 7: Final build verification

- [ ] **Step 1: Build**

```bash
pnpm build
```

Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 2: Push**

```bash
git push
```
