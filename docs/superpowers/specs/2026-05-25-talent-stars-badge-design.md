# Talent Stars & Hired Badge — Design Spec
Date: 2026-05-25

## Overview
Add a star system to talent profiles so users can recognise each other, creating social competition (e.g. "3k stars on Hired.jo"). Also surface the existing Hired subscription badge on talent cards and profile pages.

---

## 1. Data Layer

### talent_profiles changes
- Add `stars INTEGER DEFAULT 0` column (denormalised count for fast reads).

### New table: talent_stars
```sql
CREATE TABLE talent_stars (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,          -- the person who starred
  starred_user_id TEXT NOT NULL,        -- the profile being starred
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, starred_user_id)      -- prevents double-starring
);
```

---

## 2. API

### POST /api/talent/star
- Auth required (Supabase session cookie). Non-authed → 401.
- Body: `{ targetUserId: string }`
- Toggle behaviour:
  - If row exists → DELETE it, decrement `talent_profiles.stars`
  - If row missing → INSERT it, increment `talent_profiles.stars`
- Returns: `{ starred: boolean, stars: number }`

### GET /api/talent (existing)
- No change needed — `stars` column will be returned automatically via `SELECT *`.

---

## 3. UI Changes

### /talent/[id] — Profile page
- Star button next to the Contact button: `⭐ 142`
- Gold filled star (★) if current user has starred this profile, outline (☆) if not.
- Clicking toggles via POST /api/talent/star.
- Not logged in → redirect to `/auth/login?next=/talent/[id]`.
- Optimistic UI update (instant count change, revert on error).
- Hired badge: if `profile.is_hired_subscriber` is true, show a gold "Hired Pro" badge pill near the name.

### Talent listing cards
- Star count badge bottom-right: `⭐ 142` (display only, no button).
- Hired Pro badge pill shown on card if subscriber.

### /talent — Top Starred section
- New "🏆 Top Starred" tab alongside "Browse Talent" and "My Profile".
- Shows top 10 most-starred profiles sorted by `stars DESC`.
- Ranked list: #1 medal 🥇, #2 🥈, #3 🥉, then #4–10 with rank number.
- Each entry shows: avatar, name, field, country, star count, "View Profile" link.
- Data comes from existing GET /api/talent endpoint filtered & sorted.

---

## 4. Hired Subscription Badge

### Data source
- Check `user_subscriptions` table (Supabase) for the profile's `user_id`.
- If an active subscription exists → show badge.
- Add a `is_hired_subscriber` boolean to the talent API response (joined from `user_subscriptions`).

### Badge design
- Small gold pill: `⚡ Hired Pro`
- Shown next to the user's name on both cards and profile page.

---

## 5. SQL to run in Supabase

```sql
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS talent_stars (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  starred_user_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, starred_user_id)
);
```

---

## 6. Out of Scope
- Notifications when starred
- Star history / who starred me
- Star-gating any features
