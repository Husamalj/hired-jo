import { NextResponse } from "next/server";
import { parseCvFromText } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text: string = body.text ?? "";

    if (!text.trim()) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    const cv = await parseCvFromText(text);
    return NextResponse.json(cv);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
