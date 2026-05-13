import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Job } from "@/lib/types";
import staticJobs from "@/data/jobs.json";

let cache: { data: Job[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/intern|internship|trainee/.test(t)) return "Intern";
  if (/senior|sr\.|lead|principal|head|director|manager/.test(t)) return "Senior";
  if (/junior|jr\.|entry|graduate|fresh/.test(t)) return "Junior";
  return "Mid";
}

function inferSector(title: string, desc: string): string {
  const t = (title + " " + desc).toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|cloud|mobile|react|node|python|data|ai|ml|cyber/.test(t)) return "Tech";
  if (/finance|accounting|bank|audit|tax|invest/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand|digital/.test(t)) return "Marketing";
  if (/sales|business development|account manager/.test(t)) return "Sales";
  if (/video|photo|film|camera|edit|production/.test(t)) return "Creative";
  if (/design|ui|ux|graphic/.test(t)) return "Design";
  if (/hr|human resource|recruit|talent/.test(t)) return "HR";
  if (/health|medical|pharma|nurse|doctor/.test(t)) return "Healthcare";
  if (/educat|teach|train|instruct/.test(t)) return "Education";
  if (/legal|lawyer|law|compliance/.test(t)) return "Legal";
  if (/operat|supply chain|logistics|warehouse/.test(t)) return "Transport";
  if (/customer service|support|call center/.test(t)) return "Customer Service";
  return "Other";
}

type JobSource = "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa" | "Naukrigulf" | "GulfTalent" | "Tanqeeb" | "LinkedIn" | "Indeed";

async function fetchGeminiJobs(
  site: string,
  sourceName: JobSource,
  country: string,
  offset: number
): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Search ${site} right now and find the 10 most recently posted jobs in ${country}.
Return ONLY a valid JSON array — no markdown, no explanation. Each item must have:
{"title":"job title","company":"company name","city":"city name","country":"${country}","description":"2-sentence summary","url":"direct job listing URL","postedAt":"YYYY-MM-DD"}
Only include real current listings with real URLs from ${site}. Do not invent jobs.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: any[] = JSON.parse(match[0]);
    return raw
      .filter((j) => j.title && j.company)
      .map((j, i): Job => ({
        id:          String(offset + i),
        title:       j.title ?? "Untitled",
        company:     j.company ?? "Unknown",
        sector:      inferSector(j.title ?? "", j.description ?? ""),
        city:        j.city || (country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman"),
        country,
        seniority:   inferSeniority(j.title ?? ""),
        skills:      [],
        remote:      false,
        source:      sourceName,
        url:         j.url ?? "",
        postedAt:    j.postedAt === "today" ? new Date().toISOString().slice(0, 10) : (j.postedAt ?? ""),
        description: (j.description ?? "").slice(0, 300),
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  // All sources in parallel — each has Gemini's internal timeout
  const [
    akhtaboot,
    wuzzuf,
    for9a,
    baytJO,
    baytUAE,
    naukrigulf,
    tanqeeb,
  ] = await Promise.allSettled([
    fetchGeminiJobs("akhtaboot.com",   "Akhtaboot",  "Jordan",       20000),
    fetchGeminiJobs("wuzzuf.net",      "Wuzzuf",     "Jordan",       21000),
    fetchGeminiJobs("for9a.com",       "Fursa",      "Jordan",       22000),
    fetchGeminiJobs("bayt.com",        "Bayt",       "Jordan",       23000),
    fetchGeminiJobs("bayt.com",        "Bayt",       "UAE",          24000),
    fetchGeminiJobs("naukrigulf.com",  "Naukrigulf", "Saudi Arabia", 25000),
    fetchGeminiJobs("tanqeeb.com",     "Tanqeeb",    "Saudi Arabia", 26000),
  ]);

  const liveJobs: Job[] = [
    akhtaboot, wuzzuf, for9a, baytJO, baytUAE, naukrigulf, tanqeeb,
  ]
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<Job[]>).value);

  // Deduplicate by title+company
  const seen = new Set<string>();
  const deduped = liveJobs.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fill remaining slots with static jobs not already covered
  const staticFill = (staticJobs as Job[]).filter(
    (s) =>
      !deduped.some(
        (l) =>
          l.title.toLowerCase() === s.title.toLowerCase() &&
          l.company.toLowerCase() === s.company.toLowerCase()
      )
  );

  const merged = [...deduped, ...staticFill];
  if (deduped.length > 0) {
    cache = { data: merged, ts: Date.now() };
  }
  return NextResponse.json(merged);
}
