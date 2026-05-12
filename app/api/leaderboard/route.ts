import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("leaderboard")
    .select("id, alias, score, top_skill as topSkill, created_at as createdAt")
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

    const { data, error } = await getSupabase()
      .from("leaderboard")
      .insert({ alias, score, top_skill: topSkill ?? "—" })
      .select("id, alias, score, top_skill as topSkill, created_at as createdAt")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
