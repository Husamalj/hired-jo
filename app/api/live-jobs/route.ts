import { NextResponse } from "next/server";
import type { Job } from "@/lib/types";
import staticJobs from "@/data/jobs.json";

let cache: { data: Job[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Jordan: ["amman","irbid","zarqa","balqa","madaba","jerash","ajloun","mafraq","karak","aqaba"],
  UAE: ["dubai","abu dhabi","sharjah","ajman","ras al khaimah","fujairah"],
  "Saudi Arabia": ["riyadh","jeddah","mecca","medina","dammam","khobar","dhahran","tabuk","abha"],
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
  if (/finance|accounting|bank|audit|tax|invest/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand|digital/.test(t)) return "Marketing";
  if (/sales|business development|account manager/.test(t)) return "Sales";
  if (/video|photo|film|cinemat|camera|edit|production/.test(t)) return "Creative";
  if (/design|ui|ux|graphic/.test(t)) return "Design";
  if (/hr|human resource|recruit|talent/.test(t)) return "HR";
  if (/health|medical|pharma|nurse|doctor/.test(t)) return "Healthcare";
  if (/educat|teach|train|instruct/.test(t)) return "Education";
  if (/legal|lawyer|law|compliance/.test(t)) return "Legal";
  if (/operat|supply chain|logistics|warehouse/.test(t)) return "Transport";
  if (/customer service|support|call center/.test(t)) return "Customer Service";
  return "Other";
}

function inferCountry(jobCountry: string, jobCity: string): string {
  const c = (jobCountry ?? "").toLowerCase();
  if (/united arab|uae|\bae\b/.test(c)) return "UAE";
  if (/saudi|ksa|\bsa\b/.test(c)) return "Saudi Arabia";
  if (/jordan|\bjo\b/.test(c)) return "Jordan";
  const city = (jobCity ?? "").toLowerCase();
  if (/dubai|abu dhabi|sharjah|ajman|fujairah/.test(city)) return "UAE";
  if (/riyadh|jeddah|mecca|medina|dammam|khobar/.test(city)) return "Saudi Arabia";
  return "Jordan";
}

// Fetch with a hard timeout so one slow API can't block the whole route
async function fetchWithTimeout(url: string, options: RequestInit, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchJSearch(query: string, offset: number): Promise<Job[]> {
  try {
    const res = await fetchWithTimeout(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=all`,
      {
        headers: {
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        },
      },
      6000
    );
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];

    const seen = new Set<string>();
    return json.data
      .filter((j: any) => {
        if (seen.has(j.job_id)) return false;
        seen.add(j.job_id);
        return true;
      })
      .map((j: any, i: number): Job | null => {
        const jobCity = j.job_city ?? "";
        const country = inferCountry(j.job_country ?? "", jobCity);
        const validCities = CITIES_BY_COUNTRY[country];
        if (validCities && !validCities.some((c) => jobCity.toLowerCase().includes(c))) return null;

        const skills: string[] =
          j.job_required_skills ??
          (j.job_highlights?.Qualifications ?? [])
            .join(" ")
            .match(/\b(React|Node\.js|Python|Java|SQL|TypeScript|JavaScript|AWS|Docker|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL)\b/g) ??
          [];

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

async function fetchAdzuna(country: "jo" | "ae" | "sa", offset: number): Promise<Job[]> {
  const APP_ID  = process.env.ADZUNA_APP_ID;
  const APP_KEY = process.env.ADZUNA_APP_KEY;
  if (!APP_ID || !APP_KEY) return [];
  try {
    const res = await fetchWithTimeout(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=50&content-type=application/json`,
      {},
      6000
    );
    const json = await res.json();
    if (!Array.isArray(json.results)) return [];
    const countryName = country === "jo" ? "Jordan" : country === "ae" ? "UAE" : "Saudi Arabia";
    return json.results.map((j: any, i: number): Job => ({
      id:          String(offset + i),
      title:       j.title ?? "Untitled",
      company:     j.company?.display_name ?? "Unknown",
      sector:      inferSector(j.title ?? "", j.description ?? ""),
      city:        j.location?.area?.slice(-1)[0] ?? (country === "jo" ? "Amman" : country === "ae" ? "Dubai" : "Riyadh"),
      country:     countryName,
      seniority:   inferSeniority(j.title ?? ""),
      skills:      [],
      remote:      false,
      source:      "Indeed" as const,
      url:         j.redirect_url ?? "",
      postedAt:    j.created?.slice(0, 10) ?? "",
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

  // Run all sources in parallel with individual timeouts
  const [
    jordanJobs,
    uaeJobs,
    saudiJobs,
    adzunaJO,
    adzunaAE,
    adzunaSA,
  ] = await Promise.all([
    fetchJSearch("jobs in Jordan Amman", 10000),
    fetchJSearch("jobs in Dubai UAE", 11000),
    fetchJSearch("software developer Jordan OR UAE OR Saudi Arabia", 12000),
    fetchAdzuna("jo", 30000),
    fetchAdzuna("ae", 31000),
    fetchAdzuna("sa", 32000),
  ]);

  const liveJobs = [
    ...jordanJobs,
    ...uaeJobs,
    ...saudiJobs,
    ...adzunaJO,
    ...adzunaAE,
    ...adzunaSA,
  ];

  // Deduplicate by title+company
  const seen = new Set<string>();
  const deduped = liveJobs.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fill with static jobs not already covered
  const staticFill = (staticJobs as Job[]).filter(
    (s) => !deduped.some(
      (l) =>
        l.title.toLowerCase() === s.title.toLowerCase() &&
        l.company.toLowerCase() === s.company.toLowerCase()
    )
  );

  const merged = [...deduped, ...staticFill];
  if (merged.length > 60) {
    // Only cache when we got real live data
    cache = { data: merged, ts: Date.now() };
  }
  return NextResponse.json(merged);
}
