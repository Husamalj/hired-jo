import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type JobSource = "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa";

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/intern|internship|trainee/.test(t)) return "Intern";
  if (/senior|sr\.|lead|principal|head|director|manager/.test(t)) return "Senior";
  if (/junior|jr\.|entry|graduate|fresh/.test(t)) return "Junior";
  return "Mid";
}

function inferSector(title: string): string {
  const t = title.toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|cloud|mobile|react|node|python|java|typescript|aws|docker/.test(t)) return "Tech";
  if (/data analyst|data scientist|bi analyst|ml engineer|ai engineer/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand/.test(t)) return "Marketing";
  if (/sales|business development|account manager/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer/.test(t)) return "Design";
  if (/hr |human resource|recruiter|talent/.test(t)) return "HR";
  if (/doctor|nurse|pharmacist|medical|clinical/.test(t)) return "Healthcare";
  if (/teacher|instructor|lecturer|tutor/.test(t)) return "Education";
  return "Other";
}

async function fetchGeminiJobs(site: string, sourceName: JobSource, country: string, offset: number): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any],
    });
    const result = await model.generateContent(
      `Search ${site} right now and find 10 recently posted jobs in ${country}.
Return ONLY a valid JSON array, no markdown, no explanation. Each item must have:
{"title":"...","company":"...","city":"...","description":"1-sentence summary","url":"direct job URL","postedAt":"YYYY-MM-DD"}
Only real current listings. Do not invent jobs.`
    );
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const raw: any[] = JSON.parse(match[0]);
    return raw.filter((j) => j.title && j.company).map((j, i): Job => ({
      id:          `${sourceName}-${country}-${offset + i}-${Date.now()}`,
      title:       j.title ?? "Untitled",
      company:     j.company ?? "Unknown",
      sector:      inferSector(j.title ?? ""),
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

export async function POST() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  try {
    const results = await Promise.allSettled([
      fetchGeminiJobs("akhtaboot.com", "Akhtaboot", "Jordan",       20000),
      fetchGeminiJobs("bayt.com",      "Bayt",      "Jordan",       20100),
      fetchGeminiJobs("wuzzuf.net",    "Wuzzuf",    "Jordan",       20200),
      fetchGeminiJobs("for9a.com",     "Fursa",     "Jordan",       20300),
      fetchGeminiJobs("akhtaboot.com", "Akhtaboot", "UAE",          20400),
      fetchGeminiJobs("bayt.com",      "Bayt",      "Saudi Arabia", 20500),
    ]);

    const fresh: Job[] = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<Job[]>).value);

    if (fresh.length === 0) {
      return NextResponse.json({ added: 0, message: "No jobs from Gemini" });
    }

    // Get existing jobs to avoid duplicates
    const existing = await pool.query(`SELECT title, company FROM "CachedJob"`);
    const existingKeys = new Set(existing.rows.map((r: any) => `${r.title.toLowerCase()}|${r.company.toLowerCase()}`));

    const toInsert = fresh.filter((j) => !existingKeys.has(`${j.title.toLowerCase()}|${j.company.toLowerCase()}`));

    for (const j of toInsert) {
      await pool.query(
        `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
         ON CONFLICT (id) DO NOTHING`,
        [j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
         JSON.stringify(j.skills), null, null, false, null,
         j.source, j.url, j.postedAt, j.description]
      );
    }

    return NextResponse.json({ added: toInsert.length, total: fresh.length });
  } finally {
    await pool.end();
  }
}
