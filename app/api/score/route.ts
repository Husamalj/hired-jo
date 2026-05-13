import { NextResponse } from "next/server";
import { computeScore } from "@/lib/score";
import { getSupabase } from "@/lib/supabase";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  const { cv, alias }: { cv: CV; alias?: string } = await req.json();

  // Always compute and return the score — DB failure must not block this
  const score = computeScore(cv);

  let dbError: string | null = null;

  if (alias) {
    try {
      const { error } = await getSupabase()
        .from("leaderboard")
        .insert({ alias, score: score.total, top_skill: cv.skills[0] ?? "—" });
      if (error) dbError = error.message;
    } catch (e) {
      dbError = e instanceof Error ? e.message : "Supabase unavailable";
    }
  }

  return NextResponse.json({ ...score, dbError });
}
