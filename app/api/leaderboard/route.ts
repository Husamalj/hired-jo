import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const top = await prisma.leaderboardEntry.findMany({
      orderBy: { score: "desc" },
      take: 20,
    });
    return NextResponse.json(top);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
