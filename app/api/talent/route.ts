import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "edge";

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
