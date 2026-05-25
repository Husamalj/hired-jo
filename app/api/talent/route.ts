import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field");
  const country = searchParams.get("country");
  const year = searchParams.get("year");
  const experience = searchParams.get("experience");
  const skill = searchParams.get("skill");
  const userId = searchParams.get("userId");

  const sb = getSupabase();

  // Fetch a single user's own profile
  if (userId) {
    const { data, error } = await sb.from("talent_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json(null);
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

  const userIds = (data ?? []).map((p: any) => p.user_id);
  let subscriberSet = new Set<string>();
  if (userIds.length > 0) {
    const { data: subs } = await sb.from("user_subscriptions").select("user_id").eq("status", "active").in("user_id", userIds);
    subscriberSet = new Set((subs ?? []).map((s: any) => s.user_id));
  }
  const enriched = (data ?? []).map((p: any) => ({ ...p, is_hired_subscriber: subscriberSet.has(p.user_id) }));
  return NextResponse.json(enriched);
}

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
