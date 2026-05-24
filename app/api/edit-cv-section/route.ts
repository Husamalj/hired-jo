import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CV } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { allowed } = await checkLimit(user.id, "ai_edits");
  if (!allowed) {
    return NextResponse.json(
      { error: "limit_reached", key: "ai_edits", remaining: 0 },
      { status: 402 }
    );
  }

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
    model: "gemini-2.5-flash",
    systemInstruction: `Today's date is ${today}. You are an expert CV editor. The user will give you one section of a CV and a specific editing instruction.
Return ONLY the edited content for that section in the exact same JSON format it was provided — no commentary, no markdown fences, just the raw JSON value.`,
  });

  const sectionValue = cv[section];

  // For skillCategories, give extra context so AI knows the structure
  const sectionHint = section === "skillCategories"
    ? `\n\nIMPORTANT: This is an array of skill categories. Each category has a "category" name and "items" array. When adding a skill, add it to the most relevant category. Return the full updated array of categories.`
    : section === "summary"
    ? `\n\nIMPORTANT: Return a professional summary string (not an objective). 2 sharp sentences. No "I". No "Seeking".`
    : "";

  const chat = m.startChat({ history: [] });
  const result = await chat.sendMessage(
    `CV Section: "${String(section)}"\nCurrent content: ${JSON.stringify(sectionValue)}${sectionHint}\n\nEditing instruction: ${prompt}\n\nReturn only the edited value as raw JSON. No markdown, no explanation.`
  );

  const raw = result.response.text().replace(/```json|```/g, "").trim();

  let edited: unknown;
  try {
    edited = JSON.parse(raw);
  } catch {
    edited = raw;
  }

  if (user) await incrementUsage(user.id, "ai_edits");
  return NextResponse.json({ section, edited });
}
