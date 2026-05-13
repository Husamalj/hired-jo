import { NextResponse } from "next/server";
import { computeScore } from "@/lib/score";
import { getSupabase } from "@/lib/supabase";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { cv, alias }: { cv: CV; alias?: string } = await req.json();
    const score = computeScore(cv);
    if (alias) {
      await getSupabase()
        .from("leaderboard")
        .insert({ alias, score: score.total, top_skill: cv.skills[0] ?? "—" });
    }
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: "Failed to compute score" }, { status: 500 });
  }
}
