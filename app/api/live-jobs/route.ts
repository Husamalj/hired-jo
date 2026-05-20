export const runtime = "edge";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

const REFRESH_MS = 2 * 60 * 60 * 1000;     // 2h cache
const FRESHNESS_DAYS = 60;                  // hide jobs older than this
const FRESHNESS_MS = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

const KNOWN_SOURCES = new Set([
  "LinkedIn", "Akhtaboot", "Bayt", "Wuzzuf", "Fursa",
  "Indeed", "Glassdoor", "GulfTalent", "Naukrigulf", "BeBee",
  "ReliefWeb", "UN Talent", "UNjobnet",
]);

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL! });
}

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/\bintern\b|internship|trainee/.test(t)) return "Intern";
  if (/\bsenior\b|\bsr\.|\blead\b|\bprincipal\b|\bhead of\b|\bdirector\b|\bvp\b|\bchief\b/.test(t)) return "Senior";
  if (/\bjunior\b|\bjr\.|\bentry\b|\bgraduate\b|\bfresh\b/.test(t)) return "Junior";
  // 'manager' alone is Mid; only 'senior manager' / 'general manager' is Senior (handled above)
  return "Mid";
}

function inferSector(title: string, desc = ""): string {
  const t = title.toLowerCase();
  if (/software|developer|engineer(?! \(saudi)|frontend|backend|fullstack|devops|cloud|mobile|react|node|python|java(?!\s*national)|typescript|aws|docker|data analyst|data scientist|ml engineer|ai engineer|cyber|network engineer|it support|system admin|sysadmin/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker|financial analyst|accounting/.test(t)) return "Finance";
  if (/marketing|social media|content|seo|brand|digital marketing|public relations|\bpr\s/.test(t)) return "Marketing";
  if (/sales|business development|account manager|sales executive|sales specialist/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer|art director|visual designer|product designer/.test(t)) return "Design";
  if (/videograph|photograph|film|cinemat|video editor|motion|creative director/.test(t)) return "Creative";
  if (/hr |human resource|recruiter|talent acquisition|people operations/.test(t)) return "HR";
  if (/doctor|physician|nurse|pharmacist|medical|clinical|dentist|healthcare/.test(t)) return "Healthcare";
  if (/teacher|professor|instructor|lecturer|tutor|academic/.test(t)) return "Education";
  if (/lawyer|legal counsel|paralegal|compliance officer/.test(t)) return "Legal";
  if (/logistics|supply chain|fleet|warehouse|procurement/.test(t)) return "Operations";
  if (/customer service|call center|helpdesk|support agent|receptionist/.test(t)) return "Customer Service";
  if (/construction|civil engineer|architect|site engineer|surveyor/.test(t)) return "Construction";
  const d = desc.toLowerCase();
  if (/software|developer|engineer|data|ai|ml|cyber|cloud/.test(d)) return "Tech";
  if (/finance|accounting|bank|audit/.test(d)) return "Finance";
  return "Other";
}

function normalizeSource(rawPub: string, fallback: string): string {
  const p = rawPub.toLowerCase();
  if (/akhtaboot/.test(p))    return "Akhtaboot";
  if (/bayt/.test(p))         return "Bayt";
  if (/wuzzuf/.test(p))       return "Wuzzuf";
  if (/for9a|fursa/.test(p))  return "Fursa";
  if (/linkedin/.test(p))     return "LinkedIn";
  if (/indeed/.test(p))       return "Indeed";
  if (/glassdoor/.test(p))    return "Glassdoor";
  if (/gulftalent/.test(p))   return "GulfTalent";
  if (/naukri/.test(p))       return "Naukrigulf";
  if (/bebee/.test(p))        return "BeBee";
  if (/reliefweb/.test(p))    return "ReliefWeb";
  if (/un\s*talent|untalent|unjobnet/.test(p)) return "UN Talent";
  // Everything else (company career pages, niche aggregators) gets grouped
  return rawPub ? "Other Boards" : fallback;
}

function extractSkills(j: any): string[] {
  const knownSkills = /\b(React|Node\.js|Node|Python|Java|SQL|TypeScript|JavaScript|AWS|Azure|GCP|Docker|Kubernetes|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL|MySQL|Redis|GraphQL|REST|CI\/CD|Linux|Bash|C\+\+|C#|\.NET|Ruby|Go|Rust|Tableau|Power BI|Salesforce|HubSpot|Photoshop|Illustrator)\b/gi;
  // 1. JSearch's explicit skills array
  if (Array.isArray(j.job_required_skills) && j.job_required_skills.length > 0) {
    return [...new Set(j.job_required_skills.map(String))].slice(0, 8);
  }
  // 2. Mine the qualifications text
  const quals = (j.job_highlights?.Qualifications ?? []).join(" ");
  const desc = j.job_description ?? "";
  const found = (quals + " " + desc).match(knownSkills) ?? [];
  return [...new Set(found.map((s: string) => s.trim()))].slice(0, 8);
}

function jobIsFresh(postedAt: string): boolean {
  if (!postedAt) return false;
  const t = Date.parse(postedAt);
  if (isNaN(t)) return false;
  return Date.now() - t < FRESHNESS_MS;
}

async function fetchJSearch(query: string, offset: number): Promise<Job[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    // date_posted=month narrows to last 30 days at the source
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=month`,
      { headers: { "x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": key }, signal: controller.signal }
    );
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];
    const seen = new Set<string>();
    return json.data
      .filter((j: any) => { if (seen.has(j.job_id)) return false; seen.add(j.job_id); return true; })
      .map((j: any, i: number): Job => {
        const locBlob = (
          (j.job_country ?? "") + " " +
          (j.job_city ?? "") + " " +
          (j.job_apply_link ?? "") + " " +
          (j.job_title ?? "") + " " +
          (j.job_description ?? "").slice(0, 200)
        ).toLowerCase();
        const country =
          /\buae\b|dubai|abu[- ]?dhabi|sharjah|emirates/.test(locBlob) ? "UAE" :
          /saudi|riyadh|jeddah|jubail|dammam|\bmecca\b|\bksa\b/.test(locBlob) ? "Saudi Arabia" :
          /jordan|amman|irbid|zarqa|aqaba/.test(locBlob) ? "Jordan" :
          /egypt|cairo|alexandria/.test(locBlob) ? "Egypt" :
          "Jordan";
        const city = j.job_city || (
          country === "UAE" ? (/abu dhabi/.test(locBlob) ? "Abu Dhabi" : /sharjah/.test(locBlob) ? "Sharjah" : "Dubai") :
          country === "Saudi Arabia" ? (/jeddah/.test(locBlob) ? "Jeddah" : /jubail/.test(locBlob) ? "Jubail" : /dammam/.test(locBlob) ? "Dammam" : "Riyadh") :
          country === "Egypt" ? (/alexandria/.test(locBlob) ? "Alexandria" : "Cairo") :
          "Amman"
        );
        return {
          id: `jsearch-${offset + i}`,
          title: j.job_title ?? "Untitled",
          company: j.employer_name ?? "Unknown",
          sector: inferSector(j.job_title ?? "", j.job_description ?? ""),
          city,
          country,
          seniority: inferSeniority(j.job_title ?? ""),
          skills: extractSkills(j),
          salaryMin: j.job_min_salary ?? undefined,
          salaryMax: j.job_max_salary ?? undefined,
          remote: j.job_is_remote ?? false,
          source: normalizeSource(j.job_publisher ?? "", "LinkedIn"),
          url: j.job_apply_link ?? "",
          postedAt: j.job_posted_at_datetime_utc?.slice(0, 10) ?? "",
          description: (j.job_description ?? "").slice(0, 300),
        };
      });
  } catch {
    return [];
  }
}

async function fetchAllJobs(): Promise<Job[]> {
  // 4 broad queries instead of 10 redundant ones. Source tagging is publisher-based now.
  const results = await Promise.allSettled([
    fetchJSearch("jobs in Jordan",                                     10000),
    fetchJSearch("jobs in UAE Dubai",                                  11000),
    fetchJSearch("jobs in Saudi Arabia Riyadh",                        12000),
    fetchJSearch("internship Jordan UAE Saudi Arabia",                 13000),
  ]);

  const all: Job[] = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<Job[]>).value)
    .filter((j) => jobIsFresh(j.postedAt));   // freshness gate at fetch time

  const seen = new Set<string>();
  return all.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getDbJobs(pool: Pool): Promise<Job[]> {
  const res = await pool.query(`SELECT * FROM "CachedJob" ORDER BY "postedAt" DESC NULLS LAST`);
  return res.rows.map((r: any) => ({
    id: r.id, title: r.title, company: r.company, sector: r.sector,
    city: r.city, country: r.country, seniority: r.seniority as Job["seniority"],
    skills: Array.isArray(r.skills) ? r.skills : (typeof r.skills === "string" ? JSON.parse(r.skills) : []),
    salaryMin: r.salaryMin ?? undefined,
    salaryMax: r.salaryMax ?? undefined,
    remote: r.remote,
    internshipCountry: r.internshipCountry ?? undefined,
    source: r.source, url: r.url, postedAt: r.postedAt,
    description: r.description,
  }));
}

async function syncToDb(pool: Pool, freshJobs: Job[]): Promise<Job[]> {
  // Only delete JSearch-sourced rows (we identify them by id prefix).
  // Scraper rows (Akhtaboot via RSS, Fursa via __NEXT_DATA__) live independently.
  await pool.query(`DELETE FROM "CachedJob" WHERE id LIKE 'jsearch-%'`);

  for (const j of freshJobs) {
    await pool.query(
      `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
       ON CONFLICT (id) DO NOTHING`,
      [j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
       JSON.stringify(j.skills), j.salaryMin ?? null, j.salaryMax ?? null,
       j.remote, j.internshipCountry ?? null, j.source, j.url, j.postedAt, j.description]
    );
  }

  // Cleanup: drop any row older than the freshness window, anywhere in the table
  const cutoff = new Date(Date.now() - FRESHNESS_MS).toISOString().slice(0, 10);
  await pool.query(`DELETE FROM "CachedJob" WHERE "postedAt" < $1 OR "postedAt" IS NULL OR "postedAt" = ''`, [cutoff]);

  await pool.query(
    `INSERT INTO "JobsFetchMeta" (id, "lastFetched") VALUES (1, NOW()) ON CONFLICT (id) DO UPDATE SET "lastFetched" = NOW()`
  );

  return getDbJobs(pool);
}

// Fire-and-forget refresh kicked off in the background so the caller doesn't pay the cost
async function refreshInBackground(pool: Pool) {
  try {
    const fresh = await fetchAllJobs();
    if (fresh.length > 0) await syncToDb(pool, fresh);
  } catch {
    /* swallow */
  } finally {
    try { await pool.end(); } catch {}
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  const pool = getPool();
  try {
    const metaRes = await pool.query(`SELECT "lastFetched" FROM "JobsFetchMeta" WHERE id = 1`);
    const lastFetched = metaRes.rows[0]?.lastFetched?.getTime() ?? 0;
    const countRes = await pool.query(`SELECT COUNT(*) FROM "CachedJob"`);
    const dbCount = parseInt(countRes.rows[0].count);
    const stale = Date.now() - lastFetched > REFRESH_MS;

    if (force) {
      await pool.query(`DELETE FROM "CachedJob" WHERE id LIKE 'jsearch-%'`);
      const jobs = await syncToDb(pool, await fetchAllJobs());
      return NextResponse.json(jobs);
    }

    const jobs = await getDbJobs(pool);

    if (dbCount === 0) {
      // No data — must block on a refresh
      const fresh = await syncToDb(pool, await fetchAllJobs());
      return NextResponse.json(fresh);
    }

    if (stale) {
      // Stale data — return what we have, refresh in background.
      // We hand the pool to the background task and create a fresh one for the response.
      const bgPool = getPool();
      refreshInBackground(bgPool);
    }

    return NextResponse.json(jobs);
  } finally {
    try { await pool.end(); } catch {}
  }
}
