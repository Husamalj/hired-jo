import { NextResponse } from "next/server";
import type { CV, Job } from "@/lib/types";
import { matchCvToJob } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { cv, job }: { cv: CV; job: Job } = await req.json();
    const result = await matchCvToJob(cv, job);
    return NextResponse.json(result);
  } catch (e) {
    console.error("match error:", e);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
