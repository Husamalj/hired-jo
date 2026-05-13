import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Job } from "@/lib/types";
import { prisma } from "@/lib/db";

const REFRESH_MS = 2 * 60 * 60 * 1000;

let memCache: { data: Job[]; ts: number } | null = null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

type JobSource = "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa" | "LinkedIn";

async function fetchGeminiJobs(site: string, sourceName: JobSource, country: string, offset: number): Promise<Job[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any],
    });
    const result = await model.generateContent(
      `Search ${site} right now and find 10 recently posted jobs in ${country}.
Return ONLY a valid JSON array, no markdown. Each item:
{"title":"...","company":"...","city":"...","country":"${country}","description":"2-sentence summary","url":"direct listing URL","postedAt":"YYYY-MM-DD"}
Only real current listings. Do not invent jobs.`
    );
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const raw: any[] = JSON.parse(match[0]);
    return raw.filter((j) => j.title && j.company).map((j, i): Job => ({
      id:          `${sourceName}-${country}-${offset + i}`,
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
    setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=all`,
      { headers: { "x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": key }, signal: controller.signal }
    );
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];
    const seen = new Set<string>();
    return json.data
      .filter((j: any) => { if (seen.has(j.job_id)) return false; seen.add(j.job_id); return true; })
      .map((j: any, i: number): Job | null => {
        const skills: string[] =
          j.job_required_skills ??
          (j.job_highlights?.Qualifications ?? []).join(" ")
            .match(/\b(React|Node\.js|Python|Java|SQL|TypeScript|JavaScript|AWS|Docker|Git|Excel|Figma|Flutter|Kotlin|Swift|PHP|Laravel|Angular|Vue|MongoDB|PostgreSQL)\b/g) ?? [];
        const country =
          /uae|dubai|abu dhabi|sharjah/i.test((j.job_country ?? "") + (j.job_city ?? "")) ? "UAE" :
          /saudi|riyadh|jeddah/i.test((j.job_country ?? "") + (j.job_city ?? "")) ? "Saudi Arabia" : "Jordan";
        return {
          id: `jsearch-${offset + i}`,
          title: j.job_title ?? "Untitled",
          company: j.employer_name ?? "Unknown",
          sector: inferSector(j.job_title ?? "", j.job_description ?? ""),
          city: j.job_city || "Amman",
          country,
          seniority: inferSeniority(j.job_title ?? ""),
          skills: [...new Set(skills)].slice(0, 8),
          salaryMin: j.job_min_salary ?? undefined,
          salaryMax: j.job_max_salary ?? undefined,
          remote: j.job_is_remote ?? false,
          source: "LinkedIn" as const,
          url: j.job_apply_link ?? "",
          postedAt: j.job_posted_at_datetime_utc?.slice(0, 10) ?? "",
          description: (j.job_description ?? "").slice(0, 300),
        };
      }).filter(Boolean) as Job[];
  } catch {
    return [];
  }
}

async function fetchAllJobs(): Promise<Job[]> {
  const results = await Promise.allSettled([
    fetchJSearch("jobs in Amman Jordan",                     10000),
    fetchJSearch("software developer Jordan",                10100),
    fetchJSearch("jobs in Dubai UAE",                        11000),
    fetchJSearch("jobs in Riyadh Saudi Arabia",              12000),
    fetchJSearch("internship Jordan OR UAE OR Saudi Arabia", 13000),
    fetchGeminiJobs("akhtaboot.com", "Akhtaboot", "Jordan",       20000),
    fetchGeminiJobs("bayt.com",      "Bayt",      "Jordan",       20100),
    fetchGeminiJobs("wuzzuf.net",    "Wuzzuf",    "Jordan",       20200),
    fetchGeminiJobs("for9a.com",     "Fursa",     "Jordan",       20300),
    fetchGeminiJobs("akhtaboot.com", "Akhtaboot", "UAE",          20400),
    fetchGeminiJobs("bayt.com",      "Bayt",      "Saudi Arabia", 20500),
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

function dbRowToJob(row: any): Job {
  return {
    id: row.id, title: row.title, company: row.company, sector: row.sector,
    city: row.city, country: row.country, seniority: row.seniority as Job["seniority"],
    skills: Array.isArray(row.skills) ? row.skills : [],
    salaryMin: row.salaryMin ?? undefined, salaryMax: row.salaryMax ?? undefined,
    remote: row.remote, internshipCountry: row.internshipCountry ?? undefined,
    source: row.source, url: row.url, postedAt: row.postedAt, description: row.description,
  };
}

async function syncToDb(freshJobs: Job[]): Promise<Job[]> {
  const existing = await prisma.cachedJob.findMany();
  const freshKeySet = new Set(freshJobs.map((j) => `${j.title.toLowerCase()}|${j.company.toLowerCase()}`));
  const existingKeySet = new Set(existing.map((r) => `${r.title.toLowerCase()}|${r.company.toLowerCase()}`));

  const toDelete = existing.filter((r) => !freshKeySet.has(`${r.title.toLowerCase()}|${r.company.toLowerCase()}`));
  if (toDelete.length > 0) {
    await prisma.cachedJob.deleteMany({ where: { id: { in: toDelete.map((r) => r.id) } } });
  }

  const toInsert = freshJobs.filter((j) => !existingKeySet.has(`${j.title.toLowerCase()}|${j.company.toLowerCase()}`));
  if (toInsert.length > 0) {
    await prisma.cachedJob.createMany({
      data: toInsert.map((j) => ({
        id: j.id, title: j.title, company: j.company, sector: j.sector,
        city: j.city, country: j.country, seniority: j.seniority,
        skills: j.skills, salaryMin: j.salaryMin ?? null, salaryMax: j.salaryMax ?? null,
        remote: j.remote, internshipCountry: j.internshipCountry ?? null,
        source: j.source, url: j.url, postedAt: j.postedAt, description: j.description,
        fetchedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  await prisma.jobsFetchMeta.upsert({
    where: { id: 1 }, update: { lastFetched: new Date() }, create: { id: 1, lastFetched: new Date() },
  });

  const updated = await prisma.cachedJob.findMany();
  return updated.map(dbRowToJob);
}

export async function GET() {
  if (memCache && Date.now() - memCache.ts < REFRESH_MS) {
    return NextResponse.json(memCache.data);
  }

  const meta = await prisma.jobsFetchMeta.findUnique({ where: { id: 1 } });
  const lastFetched = meta?.lastFetched?.getTime() ?? 0;
  const dbCount = await prisma.cachedJob.count();
  const needsRefresh = dbCount === 0 || Date.now() - lastFetched > REFRESH_MS;

  let jobs: Job[];

  if (needsRefresh) {
    const fresh = await fetchAllJobs();
    if (fresh.length > 0) {
      jobs = await syncToDb(fresh);
    } else {
      // All sources failed — return whatever is in DB
      const rows = await prisma.cachedJob.findMany();
      jobs = rows.map(dbRowToJob);
      await prisma.jobsFetchMeta.upsert({
        where: { id: 1 }, update: { lastFetched: new Date() }, create: { id: 1, lastFetched: new Date() },
      });
    }
  } else {
    const rows = await prisma.cachedJob.findMany();
    jobs = rows.map(dbRowToJob);
  }

  memCache = { data: jobs, ts: Date.now() };
  return NextResponse.json(jobs);
}
