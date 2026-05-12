import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Job } from "@/lib/types";
import staticJobs from "@/data/jobs.json";

// Cache 1 hour — Gemini + JSearch both have daily limits
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
  if (/finance|accounting|bank|audit|tax|invest/.test(t)) return "Finance";
  if (/marketing|social media|content|seo|brand|digital/.test(t)) return "Marketing";
  if (/sales|business development|account manager/.test(t)) return "Sales";
  if (/design|ui|ux|graphic|creative/.test(t)) return "Design";
  if (/hr|human resource|recruit|talent/.test(t)) return "HR";
  if (/health|medical|pharma|nurse|doctor/.test(t)) return "Healthcare";
  if (/educat|teach|train|instruct/.test(t)) return "Education";
  return "Other";
}

function mapJSearchJob(j: any, index: number): Job {
  const skills: string[] =
    j.job_required_skills ??
    (j.job_highlights?.Qualifications ?? [])
      .join(" ")
      .match(/\b(React|Node\.js|Python|Java|SQL|TypeScript|JavaScript|AWS|Docker|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL|Tailwind)\b/g) ??
    [];
  return {
    id:          String(index + 10000),
    title:       j.job_title ?? "Untitled",
    company:     j.employer_name ?? "Unknown",
    sector:      inferSector(j.job_title ?? "", j.job_description ?? ""),
    city:        j.job_city || "Amman",
    country:     "Jordan",
    seniority:   inferSeniority(j.job_title ?? ""),
    skills:      [...new Set(skills)].slice(0, 8),
    salaryMin:   j.job_min_salary ?? undefined,
    salaryMax:   j.job_max_salary ?? undefined,
    remote:      j.job_is_remote ?? false,
    source:      "LinkedIn" as const,
    url:         j.job_apply_link ?? "",
    postedAt:    j.job_posted_at_datetime_utc?.slice(0, 10) ?? "",
    description: (j.job_description ?? "").slice(0, 300),
  };
}

// Use Gemini Search grounding to scrape job boards that have no API
async function fetchGeminiJobs(
  site: string,
  sourceName: "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa",
  offset: number
): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Search ${site} right now and find the 10 most recently posted jobs in Jordan, UAE, or Saudi Arabia.
Return ONLY a valid JSON array — no markdown, no explanation, no extra text. Each item:
{
  "title": "job title",
  "company": "company name",
  "city": "city name",
  "country": "Jordan" or "UAE" or "Saudi Arabia",
  "description": "2-sentence job summary",
  "url": "direct link to the job posting on ${site}",
  "postedAt": "YYYY-MM-DD or 'today'"
}
Only include real listings you can verify are currently on ${site}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: any[] = JSON.parse(match[0]);
    return raw.map((j, i): Job => ({
      id:          String(offset + i),
      title:       j.title ?? "Untitled",
      company:     j.company ?? "Unknown",
      sector:      inferSector(j.title ?? "", j.description ?? ""),
      city:        j.city || "Amman",
      country:     j.country || "Jordan",
      seniority:   inferSeniority(j.title ?? ""),
      skills:      [],
      remote:      false,
      source:      sourceName,
      url:         j.url ?? "",
      postedAt:    j.postedAt === "today"
                     ? new Date().toISOString().slice(0, 10)
                     : (j.postedAt ?? ""),
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

  // ── 1. JSearch (LinkedIn/Indeed/Glassdoor) ──────────────────────────────
  const jsearchResults: any[] = [];
  try {
    const queries = [
      "jobs in Jordan", "software developer Jordan", "internship Amman",
      "jobs in Dubai UAE", "jobs in Riyadh Saudi Arabia",
    ];
    for (const query of queries) {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=2&country=jo&date_posted=all`,
        {
          headers: {
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          },
        }
      );
      const json = await res.json();
      if (Array.isArray(json.data)) jsearchResults.push(...json.data);
    }
  } catch (err) {
    console.error("JSearch failed:", err);
  }

  const seen = new Set<string>();
  const jsearchUnique = jsearchResults.filter((j) => {
    if (seen.has(j.job_id)) return false;
    seen.add(j.job_id);
    return true;
  });
  const jsearchJobs = jsearchUnique.map(mapJSearchJob);

  // ── 2. Gemini Search grounding (Arab job boards) ────────────────────────
  const [akhtaboot, for9a, bayt, wuzzuf, naukrigulf, gulftalent, tanqeeb] = await Promise.all([
    fetchGeminiJobs("akhtaboot.com",   "Akhtaboot",  20000),
    fetchGeminiJobs("for9a.com",       "Fursa",      21000),
    fetchGeminiJobs("bayt.com",        "Bayt",       22000),
    fetchGeminiJobs("wuzzuf.net",      "Wuzzuf",     23000),
    fetchGeminiJobs("naukrigulf.com",  "Naukrigulf", 24000),
    fetchGeminiJobs("gulftalent.com",  "GulfTalent", 25000),
    fetchGeminiJobs("tanqeeb.com",     "Tanqeeb",    26000),
  ]);

  const geminiJobs = [...akhtaboot, ...for9a, ...bayt, ...wuzzuf, ...naukrigulf, ...gulftalent, ...tanqeeb];

  // ── 3. Merge all sources, static jobs as final fallback ─────────────────
  const allLive = [...jsearchJobs, ...geminiJobs];

  const staticFiltered = (staticJobs as Job[]).filter(
    (s) => !allLive.some(
      (l) => l.title.toLowerCase() === s.title.toLowerCase() &&
             l.company.toLowerCase() === s.company.toLowerCase()
    )
  );

  const merged = [...allLive, ...staticFiltered];
  cache = { data: merged, ts: Date.now() };
  return NextResponse.json(merged);
}
