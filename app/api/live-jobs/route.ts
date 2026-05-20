import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

const REFRESH_MS = 2 * 60 * 60 * 1000;

let memCache: { data: Job[]; ts: number } | null = null;

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL! });
}

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/intern|internship|trainee/.test(t)) return "Intern";
  if (/senior|sr\.|lead|principal|head|director|manager/.test(t)) return "Senior";
  if (/junior|jr\.|entry|graduate|fresh/.test(t)) return "Junior";
  return "Mid";
}

function inferSector(title: string, desc: string): string {
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
  const d = desc.toLowerCase();
  if (/software|developer|engineer|data|ai|ml|cyber|cloud/.test(d)) return "Tech";
  if (/finance|accounting|bank|audit/.test(d)) return "FinTech";
  if (/marketing|seo|brand/.test(d)) return "Marketing";
  return "Other";
}

async function fetchJSearch(query: string, source: Job["source"], offset: number): Promise<Job[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=all`,
      { headers: { "x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": key }, signal: controller.signal }
    );
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];
    const seen = new Set<string>();
    return json.data
      .filter((j: any) => { if (seen.has(j.job_id)) return false; seen.add(j.job_id); return true; })
      .map((j: any, i: number): Job => {
        const skills: string[] =
          j.job_required_skills ??
          (j.job_highlights?.Qualifications ?? []).join(" ")
            .match(/\b(React|Node\.js|Python|Java|SQL|TypeScript|JavaScript|AWS|Docker|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL)\b/g) ?? [];
        // Combine all location signals: explicit fields + URL + title + description
        const locBlob = (
          (j.job_country ?? "") + " " +
          (j.job_city ?? "") + " " +
          (j.job_apply_link ?? "") + " " +
          (j.job_title ?? "") + " " +
          (j.job_description ?? "").slice(0, 200)
        ).toLowerCase();
        const country =
          /\buae\b|dubai|abu dhabi|sharjah|emirates|\bare\b/.test(locBlob) ? "UAE" :
          /saudi|riyadh|jeddah|jubail|dammam|mecca|medina|\bksa\b|\bsau\b/.test(locBlob) ? "Saudi Arabia" :
          /jordan|amman|irbid|zarqa|aqaba|\bjor\b/.test(locBlob) ? "Jordan" :
          "Jordan"; // default fallback
        // Use the actual job board name from JSearch's job_publisher field.
        // Normalize a few known ones for nicer display.
        const rawPub: string = (j.job_publisher ?? "").trim();
        const pubLower = rawPub.toLowerCase();
        const detectedSource: string =
          /akhtaboot/.test(pubLower)    ? "Akhtaboot" :
          /bayt/.test(pubLower)         ? "Bayt" :
          /wuzzuf/.test(pubLower)       ? "Wuzzuf" :
          /for9a|fursa/.test(pubLower)  ? "Fursa" :
          /linkedin/.test(pubLower)     ? "LinkedIn" :
          /indeed/.test(pubLower)       ? "Indeed" :
          /glassdoor/.test(pubLower)    ? "Glassdoor" :
          rawPub || source;
        return {
          id: `jsearch-${offset + i}`,
          title: j.job_title ?? "Untitled",
          company: j.employer_name ?? "Unknown",
          sector: inferSector(j.job_title ?? "", j.job_description ?? ""),
          city: j.job_city || (
            country === "UAE" ? (/abu dhabi/.test(locBlob) ? "Abu Dhabi" : /sharjah/.test(locBlob) ? "Sharjah" : "Dubai") :
            country === "Saudi Arabia" ? (/jeddah/.test(locBlob) ? "Jeddah" : /jubail/.test(locBlob) ? "Jubail" : /dammam/.test(locBlob) ? "Dammam" : "Riyadh") :
            "Amman"
          ),
          country,
          seniority: inferSeniority(j.job_title ?? ""),
          skills: [...new Set(skills)].slice(0, 8),
          salaryMin: j.job_min_salary ?? undefined,
          salaryMax: j.job_max_salary ?? undefined,
          remote: j.job_is_remote ?? false,
          source: detectedSource,
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
  const results = await Promise.allSettled([
    fetchJSearch("jobs in Amman Jordan",                          "LinkedIn",  10000),
    fetchJSearch("software developer jobs Jordan",                "LinkedIn",  10100),
    fetchJSearch("marketing finance HR jobs Jordan",              "LinkedIn",  10200),
    fetchJSearch("jobs in Dubai UAE",                             "LinkedIn",  11000),
    fetchJSearch("jobs in Riyadh Saudi Arabia",                   "LinkedIn",  12000),
    fetchJSearch("internship Jordan OR UAE OR Saudi Arabia",      "LinkedIn",  13000),
    fetchJSearch("akhtaboot jobs Jordan",                         "Akhtaboot", 20000),
    fetchJSearch("bayt jobs Jordan OR UAE OR Saudi Arabia",       "Bayt",      20100),
    fetchJSearch("wuzzuf jobs Jordan",                            "Wuzzuf",    20200),
    fetchJSearch("for9a fursa jobs Jordan",                       "Fursa",     20300),
  ]);

  const all: Job[] = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<Job[]>).value);

  const seen = new Set<string>();
  return all.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getDbJobs(pool: Pool): Promise<Job[]> {
  const res = await pool.query(`SELECT * FROM "CachedJob"`);
  return res.rows.map((r: any) => ({
    id: r.id, title: r.title, company: r.company, sector: r.sector,
    city: r.city, country: r.country, seniority: r.seniority as Job["seniority"],
    skills: Array.isArray(r.skills) ? r.skills : [],
    salaryMin: r.salaryMin ?? undefined,
    salaryMax: r.salaryMax ?? undefined,
    remote: r.remote,
    internshipCountry: r.internshipCountry ?? undefined,
    source: r.source, url: r.url, postedAt: r.postedAt,
    description: r.description,
  }));
}

async function syncToDb(pool: Pool, freshJobs: Job[]): Promise<Job[]> {
  const existing = await pool.query(`SELECT id, title, company FROM "CachedJob"`);
  const existingKeySet = new Set(existing.rows.map((r: any) => `${r.title.toLowerCase()}|${r.company.toLowerCase()}`));
  const freshKeySet = new Set(freshJobs.map((j) => `${j.title.toLowerCase()}|${j.company.toLowerCase()}`));

  // Only delete LinkedIn-sourced jobs that are no longer in JSearch results.
  // Gemini-sourced jobs (Akhtaboot, Bayt, Wuzzuf, Fursa) are managed by /api/refresh-gemini
  // and must NOT be wiped out here — JSearch doesn't index those sites.
  const toDelete = existing.rows.filter((r: any) =>
    r.source === "LinkedIn" &&
    !freshKeySet.has(`${r.title.toLowerCase()}|${r.company.toLowerCase()}`)
  );
  if (toDelete.length > 0) {
    const ids = toDelete.map((r: any) => r.id);
    await pool.query(`DELETE FROM "CachedJob" WHERE id = ANY($1)`, [ids]);
  }

  // Insert new jobs
  const toInsert = freshJobs.filter((j) => !existingKeySet.has(`${j.title.toLowerCase()}|${j.company.toLowerCase()}`));
  for (const j of toInsert) {
    await pool.query(
      `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
       ON CONFLICT (id) DO NOTHING`,
      [j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
       JSON.stringify(j.skills), j.salaryMin ?? null, j.salaryMax ?? null,
       j.remote, j.internshipCountry ?? null, j.source, j.url, j.postedAt, j.description]
    );
  }

  // Update fetch timestamp
  await pool.query(
    `INSERT INTO "JobsFetchMeta" (id, "lastFetched") VALUES (1, NOW()) ON CONFLICT (id) DO UPDATE SET "lastFetched" = NOW()`
  );

  const updated = await pool.query(`SELECT * FROM "CachedJob"`);
  return updated.rows.map((r: any) => ({
    id: r.id, title: r.title, company: r.company, sector: r.sector,
    city: r.city, country: r.country, seniority: r.seniority as Job["seniority"],
    skills: Array.isArray(r.skills) ? r.skills : (typeof r.skills === "string" ? JSON.parse(r.skills) : []),
    salaryMin: r.salaryMin ?? undefined, salaryMax: r.salaryMax ?? undefined,
    remote: r.remote, internshipCountry: r.internshipCountry ?? undefined,
    source: r.source, url: r.url, postedAt: r.postedAt, description: r.description,
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  if (!force && memCache && Date.now() - memCache.ts < REFRESH_MS) {
    return NextResponse.json(memCache.data);
  }

  const pool = getPool();
  try {
    const metaRes = await pool.query(`SELECT "lastFetched" FROM "JobsFetchMeta" WHERE id = 1`);
    const lastFetched = metaRes.rows[0]?.lastFetched?.getTime() ?? 0;
    const countRes = await pool.query(`SELECT COUNT(*) FROM "CachedJob"`);
    const dbCount = parseInt(countRes.rows[0].count);
    const needsRefresh = force || dbCount === 0 || Date.now() - lastFetched > REFRESH_MS;

    // On force refresh, wipe LinkedIn-tagged jobs so they get re-fetched with correct publisher names
    if (force) {
      await pool.query(`DELETE FROM "CachedJob" WHERE source = 'LinkedIn'`);
      memCache = null;
    }

    let jobs: Job[];

    if (needsRefresh) {
      const fresh = await fetchAllJobs();
      if (fresh.length > 0) {
        jobs = await syncToDb(pool, fresh);
      } else {
        jobs = await getDbJobs(pool);
        if (jobs.length > 0) {
          await pool.query(
            `INSERT INTO "JobsFetchMeta" (id, "lastFetched") VALUES (1, NOW()) ON CONFLICT (id) DO UPDATE SET "lastFetched" = NOW()`
          );
        }
      }
    } else {
      jobs = await getDbJobs(pool);
    }

    memCache = { data: jobs, ts: Date.now() };
    return NextResponse.json(jobs);
  } finally {
    await pool.end();
  }
}
