import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Job } from "@/lib/types";
import staticJobs from "@/data/jobs.json";

let cache: { data: Job[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "Jordan": ["Amman","Irbid","Zarqa","Balqa","Madaba","Jerash","Ajloun","Mafraq","Karak","Tafilah","Ma'an","Aqaba"],
  "UAE": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam","Al Khobar","Dhahran","Tabuk","Abha","Taif","Jubail","Yanbu","Najran","Hail","Khamis Mushait","Buraidah","Al Ahsa"],
};

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
  if (/video|videograph|photograph|photo|film|cinemat|camera|edit|production/.test(t)) return "Creative";
  if (/design|ui|ux|graphic/.test(t)) return "Design";
  if (/hr|human resource|recruit|talent/.test(t)) return "HR";
  if (/health|medical|pharma|nurse|doctor/.test(t)) return "Healthcare";
  if (/educat|teach|train|instruct/.test(t)) return "Education";
  if (/legal|lawyer|law|compliance|contract/.test(t)) return "Legal";
  if (/operat|supply chain|logistics|warehouse|procurement/.test(t)) return "Operations";
  if (/customer service|support|call center|helpdesk/.test(t)) return "Customer Service";
  if (/civil|construct|architect|site engineer|real estate/.test(t)) return "Construction";
  return "Other";
}

function inferCountry(jobCountry: string, jobCity: string): string {
  const c = (jobCountry ?? "").toLowerCase();
  if (/united arab|uae|\bae\b/.test(c)) return "UAE";
  if (/saudi|ksa|\bsa\b/.test(c)) return "Saudi Arabia";
  if (/jordan|\bjo\b/.test(c)) return "Jordan";
  const city = (jobCity ?? "").toLowerCase();
  if (/dubai|abu dhabi|sharjah|ajman|fujairah|ras al/.test(city)) return "UAE";
  if (/riyadh|jeddah|mecca|medina|dammam|khobar|dhahran|tabuk/.test(city)) return "Saudi Arabia";
  return "Jordan";
}

function mapJSearchJob(j: any, index: number): Job | null {
  const inferredCountry = inferCountry(j.job_country ?? "", j.job_city ?? "");
  const validCities = CITIES_BY_COUNTRY[inferredCountry];

  // Reject jobs where city doesn't match country (e.g., UK jobs appearing in search results)
  if (!validCities?.some(c => j.job_city?.toLowerCase().includes(c.toLowerCase()))) {
    return null;
  }

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
    country:     inferredCountry,
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

type GeminiSource = "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa" | "Naukrigulf" | "GulfTalent" | "Tanqeeb";

async function fetchGeminiJobs(
  site: string,
  sourceName: GeminiSource,
  offset: number,
  targetCountry?: string
): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} } as any],
    });

    const countryClause = targetCountry
      ? `in ${targetCountry}`
      : "in Jordan, UAE, or Saudi Arabia";

    const prompt = `Search ${site} right now and find the 10 most recently posted jobs ${countryClause}.
Return ONLY a valid JSON array — no markdown, no explanation. Each item:
{"title":"job title","company":"company name","city":"city","country":"${targetCountry ?? "Jordan or UAE or Saudi Arabia"}","description":"2-sentence summary","url":"link","postedAt":"YYYY-MM-DD or today"}
Only include real current listings from ${site}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: any[] = JSON.parse(match[0]);
    return raw.map((j, i): Job => ({
      id:          String(offset + i),
      title:       j.title ?? "Untitled",
      company:     j.company ?? "Unknown",
      sector:      inferSector(j.title ?? "", j.description ?? ""),
      city:        j.city || (targetCountry === "UAE" ? "Dubai" : targetCountry === "Saudi Arabia" ? "Riyadh" : "Amman"),
      country:     j.country || targetCountry || "Jordan",
      seniority:   inferSeniority(j.title ?? ""),
      skills:      [],
      remote:      false,
      source:      sourceName,
      url:         j.url ?? "",
      postedAt:    j.postedAt === "today" ? new Date().toISOString().slice(0, 10) : (j.postedAt ?? ""),
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
      "jobs in Dubai UAE", "tech jobs Dubai", "jobs in Riyadh Saudi Arabia", "jobs Jeddah",
    ];
    for (const query of queries) {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=2&date_posted=all`,
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
  const jsearchJobs = jsearchResults
    .filter((j) => { if (seen.has(j.job_id)) return false; seen.add(j.job_id); return true; })
    .map(mapJSearchJob)
    .filter(Boolean);

  // ── 2. Gemini Search grounding ──────────────────────────────────────────
  // Jordan-focused boards
  const [akhtaboot, for9a, wuzzuf] = await Promise.all([
    fetchGeminiJobs("akhtaboot.com", "Akhtaboot", 20000, "Jordan"),
    fetchGeminiJobs("for9a.com",     "Fursa",     21000, "Jordan"),
    fetchGeminiJobs("wuzzuf.net",    "Wuzzuf",    23000, "Jordan"),
  ]);

  // UAE-focused boards
  const [baytUAE, naukrigulfUAE, gulftalentUAE] = await Promise.all([
    fetchGeminiJobs("bayt.com",         "Bayt",       22000, "UAE"),
    fetchGeminiJobs("naukrigulf.com",   "Naukrigulf", 24000, "UAE"),
    fetchGeminiJobs("gulftalent.com",   "GulfTalent", 25000, "UAE"),
  ]);

  // Saudi Arabia-focused boards
  const [baytSA, naukrigulfSA, tanqeeb] = await Promise.all([
    fetchGeminiJobs("bayt.com",        "Bayt",       32000, "Saudi Arabia"),
    fetchGeminiJobs("naukrigulf.com",  "Naukrigulf", 33000, "Saudi Arabia"),
    fetchGeminiJobs("tanqeeb.com",     "Tanqeeb",    26000, "Saudi Arabia"),
  ]);

  const geminiJobs = [
    ...akhtaboot, ...for9a, ...wuzzuf,
    ...baytUAE, ...naukrigulfUAE, ...gulftalentUAE,
    ...baytSA, ...naukrigulfSA, ...tanqeeb,
  ];

  // ── 3. Merge all sources ────────────────────────────────────────────────
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
