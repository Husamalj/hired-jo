import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase(authHeader?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const opts = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(url, anon, opts);
}

// Auto-create table if missing (idempotent)
async function ensureTable(sb: ReturnType<typeof getSupabase>) {
  try {
    await sb.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS course_ratings (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          course_id text NOT NULL,
          rating int CHECK (rating >= 1 AND rating <= 5) NOT NULL,
          updated_at timestamptz DEFAULT now(),
          UNIQUE(user_id, course_id)
        );
        ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;
      `,
    });
  } catch { /* table must be created manually in Supabase dashboard */ }
}

/** GET /api/ratings?ids=lr-001,lr-002,https://...
 *  Returns { [courseId]: { avg: number; count: number; userRating: number | null } }
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const sb = getSupabase(auth);
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids") ?? "";
  if (!raw) return NextResponse.json({});

  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);

  // aggregate avg + count
  const { data: aggs } = await sb
    .from("course_ratings")
    .select("course_id, rating")
    .in("course_id", ids);

  const result: Record<string, { avg: number; count: number; userRating: number | null }> = {};
  for (const id of ids) result[id] = { avg: 0, count: 0, userRating: null };

  if (aggs) {
    const buckets: Record<string, number[]> = {};
    for (const row of aggs) {
      if (!buckets[row.course_id]) buckets[row.course_id] = [];
      buckets[row.course_id].push(row.rating);
    }
    for (const [id, ratings] of Object.entries(buckets)) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      result[id] = { avg: Math.round(avg * 10) / 10, count: ratings.length, userRating: null };
    }
  }

  // if user is authed, add their own ratings
  if (auth) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: own } = await sb
        .from("course_ratings")
        .select("course_id, rating")
        .in("course_id", ids)
        .eq("user_id", user.id);
      if (own) {
        for (const row of own) {
          if (result[row.course_id]) result[row.course_id].userRating = row.rating;
        }
      }
    }
  }

  return NextResponse.json(result);
}

/** POST /api/ratings  body: { courseId: string; rating: number }
 *  Upserts the logged-in user's rating. Requires Authorization header.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getSupabase(auth);
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courseId, rating } = body ?? {};
  if (!courseId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "courseId and rating (1-5) required" }, { status: 400 });
  }

  await ensureTable(sb);

  const { error } = await sb.from("course_ratings").upsert(
    { user_id: user.id, course_id: courseId, rating, updated_at: new Date().toISOString() },
    { onConflict: "user_id,course_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
