import { NextResponse } from "next/server";
import type { CV, Job } from "@/lib/types";
import { matchCvToJob, matchCvToJobLite } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserTier } from "@/lib/usage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { cv, job }: { cv: CV; job: Job } = await req.json();

    // Detect user tier (anonymous = free)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tier = user ? await getUserTier(user.id) : "free";

    if (tier === "pro" || tier === "hired") {
      // Full match: score + skills + rewritten summary + learning plan
      const result = await matchCvToJob(cv, job);
      return NextResponse.json({ ...result, tier });
    } else {
      // Lite match: score + matched/missing skills only
      const result = await matchCvToJobLite(cv, job);
      return NextResponse.json({ ...result, tier: "free" });
    }
  } catch (e) {
    console.error("match error:", e);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
