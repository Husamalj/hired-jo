import { NextResponse } from "next/server";
import { roastCv } from "@/lib/gemini";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { cv }: { cv: CV } = await req.json();
    const { roast, advice } = await roastCv(cv);
    return NextResponse.json({ roast, advice });
  } catch (e) {
    console.error("roast error:", e);
    return NextResponse.json({ error: "Roast failed" }, { status: 500 });
  }
}
