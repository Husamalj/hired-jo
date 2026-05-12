import { NextResponse } from "next/server";
import { roastCv } from "@/lib/gemini";
import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { cv }: { cv: CV } = await req.json();
    const roast = await roastCv(cv);
    return NextResponse.json({ roast });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("roast error:", msg);
    return NextResponse.json({ error: "Roast failed", detail: msg }, { status: 500 });
  }
}
