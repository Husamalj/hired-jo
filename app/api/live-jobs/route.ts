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
  // Match on title first — more reliable than description or company name
  const t = title.toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|cloud|mobile/.test(t)) return "Tech";
  if (/data analyst|data scientist|data engineer|bi analyst|business intelligence/.test(t)) return "Tech";
  if (/react|node|python|java|typescript|javascript|aws|docker|ml engineer|ai engineer/.test(t)) return "Tech";
  if (/cyber|network engineer|it support|system admin|sysadmin/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker|financial analyst/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand|digital marketing/.test(t)) return "Marketing";
  if (/sales|business development|account manager|sales executive/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer|art director|visual designer/.test(t)) return "Design";
  if (/videograph|photograph|film|cinemat|video editor|motion/.test(t)) return "Creative";
  if (/hr |human resource|recruiter|talent acquisition/.test(t)) return "HR";
  if (/doctor|physician|nurse|pharmacist|medical|clinical|dentist/.test(t)) return "Healthcare";
  if (/teacher|professor|instructor|lecturer|tutor/.test(t)) return "Education";
  if (/lawyer|legal counsel|paralegal|compliance officer/.test(t)) return "Legal";
  if (/logistics manager|supply chain manager|fleet manager|warehouse manager/.test(t)) return "Transport";
  if (/customer service|call center|helpdesk|support agent/.test(t)) return "Customer Service";
  // Only fall back to description if title gave no signal
  const d = desc.toLowerCase();
  if (/software|developer|engineer|data|ai|ml|cyber|cloud/.test(d)) return "Tech";
  if (/finance|accounting|bank|audit/.test(d)) return "FinTech";
  if (/marketing|seo|brand/.test(d)) return "Marketing";
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

async function fetchJSearch(query: string, offset: number): Promise<Job[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=all`,
      {
        headers: {
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];
    const seen = new Set<string>();
    return json.data
      .filter((j: any) => { if (seen.has(j.job_id)) return false; seen.add(j.job_id); return true; })
      .map((j: any, i: number): Job | null => {
        const skills: string[] =
          j.job_required_skills ??
          (j.job_highlights?.Qualifications ?? [])
            .join(" ")
            .match(/\b(React|Node\.js|Python|Java|SQL|TypeScript|JavaScript|AWS|Docker|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL)\b/g) ??
          [];
        const country =
          /uae|dubai|abu dhabi|sharjah/i.test((j.job_country ?? "") + (j.job_city ?? "")) ? "UAE" :
          /saudi|riyadh|jeddah/i.test((j.job_country ?? "") + (j.job_city ?? "")) ? "Saudi Arabia" : "Jordan";
        return {
          id:          String(offset + i),
          title:       j.job_title ?? "Untitled",
          company:     j.employer_name ?? "Unknown",
          sector:      inferSector(j.job_title ?? "", j.job_description ?? ""),
          city:        j.job_city || "Amman",
          country,
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
      })
      .filter(Boolean) as Job[];
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  // JSearch: 5 parallel queries covering Jordan, UAE, Saudi across sectors
  const results = await Promise.allSettled([
    fetchJSearch("jobs in Amman Jordan",                    10000),
    fetchJSearch("software developer Jordan",               10100),
    fetchJSearch("jobs in Dubai UAE",                       11000),
    fetchJSearch("jobs in Riyadh Saudi Arabia",             12000),
    fetchJSearch("internship Jordan OR UAE OR Saudi Arabia", 13000),
  ]);

  const liveJobs: Job[] = results
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
