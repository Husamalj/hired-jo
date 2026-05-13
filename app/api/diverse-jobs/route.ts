import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Job } from "@/lib/types";

let cache: { data: Job[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DIVERSE_SECTORS = [
  "Videographer and Photographer",
  "Healthcare and Nursing",
  "Education and Teaching",
  "Legal and Compliance",
  "Operations and Supply Chain",
  "Customer Service and Support",
  "Civil Engineering and Construction",
  "Hospitality and Tourism",
  "Journalism and Media",
  "Retail and E-commerce",
];

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/intern|internship|trainee/.test(t)) return "Intern";
  if (/senior|sr\.|lead|principal|head|director|manager/.test(t)) return "Senior";
  if (/junior|jr\.|entry|graduate|fresh/.test(t)) return "Junior";
  return "Mid";
}

async function fetchSectorJobs(sector: string, offset: number): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Search job boards (akhtaboot.com, bayt.com, linkedin.com) for exactly 10 current "${sector}" job listings in Jordan, UAE, or Saudi Arabia.
Return ONLY a valid JSON array, no markdown. Each item:
{"title":"job title","company":"company name","city":"city","country":"Jordan or UAE or Saudi Arabia","description":"1-sentence summary","postedAt":"YYYY-MM-DD or today"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: any[] = JSON.parse(match[0]);
    return raw.slice(0, 10).map((j, i): Job => ({
      id:        String(offset + i),
      title:     j.title ?? "Untitled",
      company:   j.company ?? "Unknown",
      sector,
      city:      j.city || "Amman",
      country:   j.country || "Jordan",
      seniority: inferSeniority(j.title ?? ""),
      skills:    [],
      remote:    false,
      source:    "Akhtaboot" as const,
      url:       "",
      postedAt:  j.postedAt === "today" ? new Date().toISOString().slice(0, 10) : (j.postedAt ?? ""),
      description: j.description ?? "",
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  const results = await Promise.all(
    DIVERSE_SECTORS.map((sector, i) => fetchSectorJobs(sector, 40000 + i * 100))
  );

  const jobs = results.flat();
  cache = { data: jobs, ts: Date.now() };
  return NextResponse.json(jobs);
}
