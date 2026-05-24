import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkLimit, incrementUsage } from "@/lib/usage";
import jobs from "@/data/jobs.json";
import type { CV, Job } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { allowed } = await checkLimit(user.id, "cover_letters");
  if (!allowed) {
    return NextResponse.json(
      { error: "limit_reached", key: "cover_letters", remaining: 0 },
      { status: 402 }
    );
  }

  try {
    // Accept either a full job object (from live job board pre-fill) or just a jobId
    const body = await req.json() as { cv: CV; jobId?: string; job?: Job };
    const { cv } = body;

    let job: Job | undefined;
    if (body.job) {
      job = body.job;
    } else if (body.jobId) {
      job = (jobs as Job[]).find((j) => j.id === body.jobId);
    }

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const letter = await generateCoverLetter(cv, job);
    await incrementUsage(user.id, "cover_letters");
    return NextResponse.json({ letter });
  } catch (e) {
    console.error("cover error:", e);
    return NextResponse.json({ error: "Cover letter generation failed" }, { status: 500 });
  }
}
