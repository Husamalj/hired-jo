import { NextResponse } from "next/server";
import type { Job } from "@/lib/types";
import staticJobs from "@/data/jobs.json";

// Cache results for 30 minutes to stay within free tier (500 req/month)
let cache: { data: Job[]; ts: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

function inferSeniority(title: string): string {
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

function mapJob(j: any, index: number): Job {
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
    type:        /intern/i.test(j.job_title ?? "") ? "Internship" : "Job",
    skills:      [...new Set(skills)].slice(0, 8),
    salary_min:  j.job_min_salary ?? 0,
    salary_max:  j.job_max_salary ?? 0,
    currency:    j.job_salary_currency ?? "JOD",
    remote:      j.job_is_remote ?? false,
    source:      "LinkedIn",
    applyUrl:    j.job_apply_link ?? "",
    url:         j.job_apply_link ?? "",
    postedAt:    j.job_posted_at_datetime_utc?.slice(0, 10) ?? "",
    description: (j.job_description ?? "").slice(0, 300),
  };
}

export async function GET() {
  // Serve cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const queries = ["jobs in Jordan", "software developer Jordan", "internship Amman"];
    const results: any[] = [];

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
      if (Array.isArray(json.data)) results.push(...json.data);
    }

    // Deduplicate by job_id
    const seen = new Set<string>();
    const unique = results.filter((j) => {
      if (seen.has(j.job_id)) return false;
      seen.add(j.job_id);
      return true;
    });

    const liveJobs = unique.map(mapJob);

    // Merge live jobs on top of static jobs, deduplicate by title+company
    const staticMapped = (staticJobs as Job[]).filter(
      (s) => !liveJobs.some(
        (l) => l.title.toLowerCase() === s.title.toLowerCase() &&
               l.company.toLowerCase() === s.company.toLowerCase()
      )
    );

    const merged = [...liveJobs, ...staticMapped];
    cache = { data: merged, ts: Date.now() };
    return NextResponse.json(merged);

  } catch (err) {
    console.error("JSearch fetch failed, falling back to static:", err);
    return NextResponse.json(staticJobs);
  }
}
