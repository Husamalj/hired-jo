import { NextResponse } from "next/server";
import { chat } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const result = await chat(messages);
    return NextResponse.json(result);
  } catch (e) {
    console.error("chat error:", e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
