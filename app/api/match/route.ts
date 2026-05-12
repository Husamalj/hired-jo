import { NextResponse } from "next/server";
import type { CV, Job, MatchResult } from "@/lib/types";

// Stub: returns a mock result until Track C delivers matchCvToJob from lib/gemini.ts
// When Track C pushes their gemini.ts, replace the stub body with:
//   import { matchCvToJob } from "@/lib/gemini";
//   const result = await matchCvToJob(cv, job);

function stubMatch(cv: CV, job: Job): MatchResult {
  const cvSkillsLower = cv.skills.map((s) => s.toLowerCase());
  const matched = job.skills.filter((s) => cvSkillsLower.includes(s.toLowerCase()));
  const missing = job.skills.filter((s) => !cvSkillsLower.includes(s.toLowerCase())).slice(0, 5);
  const score = Math.min(Math.round((matched.length / Math.max(job.skills.length, 1)) * 100), 100);

  return {
    jobId: job.id,
    score,
    matchedSkills: matched,
    missingSkills: missing,
    rewrittenSummary: `Experienced ${cv.skills.slice(0, 3).join(", ")} developer seeking the ${job.title} role at ${job.company} in ${job.city}.`,
    learningPlan: missing.slice(0, 2).map((skill) => ({
      skill,
      weeks: 2,
      resources: [{ title: `Learn ${skill}`, url: "https://www.freecodecamp.org", provider: "freeCodeCamp" }],
    })),
  };
}

export async function POST(req: Request) {
  try {
    const { cv, job }: { cv: CV; job: Job } = await req.json();

    // TODO: swap stub for real Gemini call once Track C delivers lib/gemini.ts
    // const { matchCvToJob } = await import("@/lib/gemini");
    // const result = await matchCvToJob(cv, job);
    const result = stubMatch(cv, job);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
