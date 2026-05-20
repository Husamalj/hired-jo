export const runtime = "edge";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

type JobSource = "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa";

const SOURCES: Record<string, { site: string; source: JobSource; country: string }> = {
  akhtaboot: { site: "akhtaboot.com",               source: "Akhtaboot", country: "Jordan" },
  bayt:      { site: "bayt.com/en/jordan/jobs",     source: "Bayt",      country: "Jordan" },
  wuzzuf:    { site: "akhtaboot.com/jobs/in-amman", source: "Akhtaboot", country: "Jordan" },
  fursa:     { site: "for9a.com",                   source: "Fursa",     country: "Jordan" },
};

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
  if (/data analyst|data scientist|bi analyst|ml|ai engineer/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand/.test(t)) return "Marketing";
  if (/sales|business development|account manager/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer/.test(t)) return "Design";
  if (/hr |human resource|recruiter|talent/.test(t)) return "HR";
  if (/doctor|nurse|pharmacist|medical|clinical/.test(t)) return "Healthcare";
  if (/teacher|instructor|lecturer|tutor/.test(t)) return "Education";
  return "Other";
}

async function fetchAndSave(sourceKey: string, pool: Pool): Promise<{ source: string; fetched: number; saved: number; error?: string }> {
  const cfg = SOURCES[sourceKey];
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any],
    });
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("22s timeout")), 22000));
    const result = await Promise.race([
      model.generateContent(
        `Search ${cfg.site} right now and find 10 recently posted jobs in the Middle East (Jordan, UAE, Saudi Arabia).
Return ONLY a valid JSON array, no markdown. Each item:
{"title":"...","company":"...","city":"...","description":"1-sentence summary","url":"direct job URL","postedAt":"YYYY-MM-DD"}
Only real current listings. Do not invent jobs.`
      ),
      timeout,
    ]);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { source: sourceKey, fetched: 0, saved: 0, error: `No JSON array in response. Raw: ${text.slice(0, 200)}` };

    const raw: any[] = JSON.parse(match[0]);
    const jobs: Job[] = raw.filter((j) => j.title && j.company).map((j, i): Job => {
      const rawCity: string = j.city ?? "";
      const parts = rawCity.split(",").map((s: string) => s.trim());
      const cityPart = parts[0] || "";
      const countryHint = (parts[1] ?? "").toLowerCase();
      const inferredCountry =
        /uae|dubai|abu dhabi|sharjah|emirates/.test(countryHint + " " + cityPart.toLowerCase()) ? "UAE" :
        /saudi|ksa|riyadh|jeddah|mecca/.test(countryHint + " " + cityPart.toLowerCase()) ? "Saudi Arabia" :
        /jordan|amman|irbid|zarqa|aqaba/.test(countryHint + " " + cityPart.toLowerCase()) ? "Jordan" :
        cfg.country;
      const finalCity = cityPart || (inferredCountry === "UAE" ? "Dubai" : inferredCountry === "Saudi Arabia" ? "Riyadh" : "Amman");
      return {
        id: `${cfg.source}-${inferredCountry}-${Date.now()}-${i}`,
        title: j.title ?? "Untitled",
        company: j.company ?? "Unknown",
        sector: inferSector(j.title ?? ""),
        city: finalCity,
        country: inferredCountry,
        seniority: inferSeniority(j.title ?? ""),
        skills: [],
        remote: false,
        source: cfg.source,
        url: j.url ?? "",
        postedAt: j.postedAt === "today" ? new Date().toISOString().slice(0, 10) : (j.postedAt ?? ""),
        description: (j.description ?? "").slice(0, 300),
      };
    });

    // Delete old rows for this source, insert fresh ones
    await pool.query(`DELETE FROM "CachedJob" WHERE source = $1`, [cfg.source]);
    for (const j of jobs) {
      await pool.query(
        `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
         ON CONFLICT (id) DO NOTHING`,
        [j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
         JSON.stringify(j.skills), null, null, false, null,
         j.source, j.url, j.postedAt, j.description]
      );
    }
    return { source: sourceKey, fetched: jobs.length, saved: jobs.length };
  } catch (e: any) {
    return { source: sourceKey, fetched: 0, saved: 0, error: e.message };
  }
}

// GET /api/trigger-refresh  — runs all sources sequentially and reports
export async function GET() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const report: any[] = [];
  try {
    for (const key of ["akhtaboot", "bayt", "fursa"]) {
      const r = await fetchAndSave(key, pool);
      report.push(r);
    }
    const count = await pool.query(`SELECT source, COUNT(*) as count FROM "CachedJob" GROUP BY source ORDER BY count DESC`);
    return NextResponse.json({ report, finalBreakdown: count.rows });
  } finally {
    await pool.end();
  }
}
