import { NextResponse } from "next/server";
import { computeScore } from "@/lib/score";
import { prisma } from "@/lib/db";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { cv, alias }: { cv: CV; alias?: string } = await req.json();
    const score = computeScore(cv);
    if (alias) {
      await prisma.leaderboardEntry.create({
        data: {
          alias,
          score: score.total,
          topSkill: cv.skills[0] ?? "—",
        },
      });
    }
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: "Failed to compute score" }, { status: 500 });
  }
}
