export const runtime = "edge";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/intern|internship|trainee/.test(t)) return "Intern";
  if (/senior|sr\.|lead|principal|head|director|manager|chief/.test(t)) return "Senior";
  if (/junior|jr\.|entry|graduate|fresh/.test(t)) return "Junior";
  return "Mid";
}

function inferSector(title: string, communities = ""): string {
  const t = (title + " " + communities).toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|cloud|mobile|react|node|python|java|typescript|aws|docker|data|information technology/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker|accounting/.test(t)) return "FinTech";
  if (/marketing|social media|content|seo|brand|pr /.test(t)) return "Marketing";
  if (/sales|business development|account manager|procurement|logistics/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer|art director|design/.test(t)) return "Design";
  if (/hr |human resource|recruiter|talent/.test(t)) return "HR";
  if (/doctor|nurse|pharmacist|medical|clinical|healthcare/.test(t)) return "Healthcare";
  if (/teacher|instructor|lecturer|tutor|academic|education/.test(t)) return "Education";
  if (/legal|lawyer|paralegal/.test(t)) return "Legal";
  if (/customer service|call center|secretary|administration/.test(t)) return "Customer Service";
  if (/construction|civil|architect/.test(t)) return "Construction";
  return "Other";
}

// ---------- Akhtaboot RSS ----------
async function scrapeAkhtaboot(country: "Jordan" | "UAE" | "Saudi Arabia"): Promise<Job[]> {
  const slug = country === "Jordan" ? "jordan" : country === "UAE" ? "uae" : "saudi-arabia";
  const res = await fetch(`https://www.akhtaboot.com/en/${slug}/jobs.rss`, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml,application/xml" },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  // Split into <item>...</item> blocks
  const items = xml.split(/<item>/).slice(1).map((s) => s.split("</item>")[0]);

  const grab = (block: string, tag: string): string => {
    const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
  };

  return items.slice(0, 25).map((block, i): Job => {
    const title = grab(block, "title");
    const link = grab(block, "link");
    const company = grab(block, "company");
    const city = grab(block, "city") || "Amman";
    const communities = grab(block, "communities");
    const pubDate = grab(block, "pubDate");
    const id = grab(block, "id") || String(i);
    return {
      id: `akhtaboot-${slug}-${id}`,
      title: title.replace(/&amp;/g, "&").trim(),
      company: company || "Confidential",
      sector: inferSector(title, communities),
      city,
      country,
      seniority: inferSeniority(title),
      skills: [],
      remote: false,
      source: "Akhtaboot",
      url: link,
      postedAt: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : "",
      description: communities ? `Field: ${communities}` : "",
    };
  });
}

// ---------- For9a __NEXT_DATA__ ----------
async function scrapeFor9a(): Promise<Job[]> {
  const res = await fetch("https://www.for9a.com/en/opportunity/recently-added", {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];

  let data: any;
  try { data = JSON.parse(m[1]); } catch { return []; }

  const opps: any[] = data?.props?.pageProps?.opportunities?.data ?? [];
  return opps.slice(0, 25).map((o, i): Job => {
    const title: string = o.title ?? "Untitled";
    const url: string = o.url ?? "";
    const country =
      /jordan/i.test(title) ? "Jordan" :
      /\buae\b|dubai|abu[- ]?dhabi|emirates/i.test(title) ? "UAE" :
      /saudi|riyadh|jeddah|\bksa\b/i.test(title) ? "Saudi Arabia" :
      "Jordan";
    return {
      id: `fursa-${o.id ?? i}`,
      title,
      company: "For9a Opportunity",
      sector: inferSector(title),
      city: country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman",
      country,
      seniority: inferSeniority(title),
      skills: [],
      remote: o.is_remote === true || o.is_remote === "True",
      source: "Fursa",
      url,
      postedAt: o.deadline ?? "",
      description: o.deadline ? `Application deadline: ${o.deadline}` : "",
    };
  });
}

const SCRAPERS: Record<string, () => Promise<Job[]>> = {
  akhtaboot:    () => scrapeAkhtaboot("Jordan"),
  akhtaboot_ae: () => scrapeAkhtaboot("UAE"),
  akhtaboot_sa: () => scrapeAkhtaboot("Saudi Arabia"),
  fursa:        () => scrapeFor9a(),
};

// GET /api/scrape-jobs?source=akhtaboot|akhtaboot_ae|akhtaboot_sa|fursa  (single source)
// GET /api/scrape-jobs?all=1  (all sources in parallel)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const sourceKey = searchParams.get("source");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const report: any[] = [];

  try {
    const tasks: { key: string; fn: () => Promise<Job[]> }[] = all
      ? Object.entries(SCRAPERS).map(([key, fn]) => ({ key, fn }))
      : sourceKey && SCRAPERS[sourceKey]
        ? [{ key: sourceKey, fn: SCRAPERS[sourceKey] }]
        : [];

    if (tasks.length === 0) {
      return NextResponse.json({ error: "unknown source", valid: Object.keys(SCRAPERS) }, { status: 400 });
    }

    const results = await Promise.allSettled(tasks.map((t) => t.fn()));

    // Group jobs by their Job["source"] tag so we can replace each source cleanly
    const bySource: Record<string, Job[]> = {};
    results.forEach((r, idx) => {
      const key = tasks[idx].key;
      if (r.status === "fulfilled") {
        const jobs = r.value;
        report.push({ key, fetched: jobs.length });
        for (const j of jobs) {
          (bySource[j.source] ??= []).push(j);
        }
      } else {
        report.push({ key, fetched: 0, error: (r as PromiseRejectedResult).reason?.message ?? "unknown" });
      }
    });

    // Replace each scraped source's rows atomically
    for (const [sourceName, jobs] of Object.entries(bySource)) {
      await pool.query(`DELETE FROM "CachedJob" WHERE source = $1`, [sourceName]);
      for (const j of jobs) {
        await pool.query(
          `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
           ON CONFLICT (id) DO NOTHING`,
          [j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
           JSON.stringify(j.skills), null, null, j.remote, null,
           j.source, j.url, j.postedAt, j.description]
        );
      }
    }

    const counts = await pool.query(`SELECT source, COUNT(*) as count FROM "CachedJob" GROUP BY source ORDER BY count DESC`);
    return NextResponse.json({ report, finalBreakdown: counts.rows });
  } finally {
    await pool.end();
  }
}
