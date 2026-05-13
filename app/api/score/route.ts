import { NextResponse } from "next/server";
import { computeScore } from "@/lib/score";
import { getSupabase } from "@/lib/supabase";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  const { cv, alias }: { cv: CV; alias?: string } = await req.json();

  // Always compute and return the score — DB failure must not block this
  const score = computeScore(cv);

  if (alias) {
    try {
      const { error } = await getSupabase()
        .from("leaderboard")
        .insert({ alias, score: score.total, top_skill: cv.skills[0] ?? "—" });
      if (error) console.error("Leaderboard insert error:", error.message);
    } catch (e) {
      console.error("Supabase unavailable:", e);
    }
  }

  return NextResponse.json(score);
}
