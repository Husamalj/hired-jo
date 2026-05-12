import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/gemini";
import jobs from "@/data/jobs.json";
import type { CV, Job } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { cv, jobId }: { cv: CV; jobId: string } = await req.json();
    const job = (jobs as Job[]).find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const letter = await generateCoverLetter(cv, job);
    return NextResponse.json({ letter });
  } catch (e) {
    console.error("cover error:", e);
    return NextResponse.json({ error: "Cover letter generation failed" }, { status: 500 });
  }
}
