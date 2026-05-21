import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CV } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { cv, section, prompt } = await req.json() as {
    cv: CV;
    section: keyof CV;
    prompt: string;
  };

  if (!cv || !section || !prompt) {
    return NextResponse.json({ error: "Missing cv, section, or prompt" }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const m = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `Today's date is ${today}. You are an expert CV editor. The user will give you one section of a CV and a specific editing instruction.
Return ONLY the edited content for that section in the exact same JSON format it was provided — no commentary, no markdown fences, just the raw JSON value.`,
  });

  const sectionValue = cv[section];
  const chat = m.startChat({ history: [] });
  const result = await chat.sendMessage(
    `CV Section: "${String(section)}"\nCurrent content: ${JSON.stringify(sectionValue)}\n\nEditing instruction: ${prompt}\n\nReturn only the edited value as raw JSON.`
  );

  const raw = result.response.text().replace(/```json|```/g, "").trim();

  let edited: unknown;
  try {
    edited = JSON.parse(raw);
  } catch {
    edited = raw;
  }

  return NextResponse.json({ section, edited });
}
