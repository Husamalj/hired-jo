import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 20;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const need = Math.max(1, Math.min(10, parseInt(searchParams.get("need") ?? "10")));
  if (!q) return NextResponse.json([]);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a course search engine. Find exactly ${need} real online LEARNING COURSES that teach the skill or topic: "${q}".
These must be courses where students learn "${q}" as a professional or academic skill (e.g. programming, design, marketing, engineering, etc.).
Do NOT return courses about unrelated topics. The topic "${q}" is the exact subject students want to study.
Include courses from YouTube, Udemy, Coursera, and freeCodeCamp.
Include at least 2 Arabic-language courses that teach "${q}" in Arabic, if they exist.
Return ONLY a valid JSON array, no markdown fences, no explanation:
[
  {
    "title": "exact course title",
    "provider": "YouTube|Udemy|Coursera|freeCodeCamp",
    "url": "real working URL to the course",
    "hours": estimated_hours_as_integer,
    "free": true_or_false,
    "language": "EN|AR|Both"
  }
]
Rules:
- Every course MUST be about learning "${q}" — reject anything off-topic.
- Use real URLs that actually exist.
- YouTube: use https://www.youtube.com/watch?v=VIDEO_ID format.
- Udemy: use https://www.udemy.com/course/COURSE_SLUG/ format.
- Coursera: use https://www.coursera.org/learn/COURSE-SLUG format.
- If unsure of exact URL, use a search URL instead:
  YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+course
  Udemy: https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}
  Coursera: https://www.coursera.org/search?query=${encodeURIComponent(q)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const raw = text.replace(/```json|```/g, "").trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json([]);

    const courses = JSON.parse(match[0]);
    const mapped = (Array.isArray(courses) ? courses : []).map((c: any, i: number) => ({
      id: `ai-${Date.now()}-${i}`,
      skill: q,
      title: c.title ?? "Untitled",
      provider: c.provider ?? "Online",
      url: c.url ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+course`,
      hours: typeof c.hours === "number" ? c.hours : 4,
      free: c.free === true,
      language: c.language ?? "EN",
      fromInternet: true,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json([]);
  }
}
