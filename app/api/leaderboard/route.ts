import { NextResponse } from "next/server";
import { getLeaderboard, addLeaderboardEntry } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getLeaderboard());
}

export async function POST(req: Request) {
  try {
    const { alias, score, topSkill } = await req.json();
    if (!alias || score === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const entry = addLeaderboardEntry({ alias, score, topSkill: topSkill ?? "—" });
    return NextResponse.json(entry);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
