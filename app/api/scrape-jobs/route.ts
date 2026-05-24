export const runtime = "edge";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import type { Job } from "@/lib/types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FRESHNESS_DAYS = 60;
const FRESHNESS_MS = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

function inferSeniority(title: string): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();
  if (/\bintern\b|internship|trainee/.test(t)) return "Intern";
  if (/\bsenior\b|\bsr\.|\blead\b|\bprincipal\b|\bhead of\b|\bdirector\b|\bvp\b|\bchief\b/.test(t)) return "Senior";
  if (/\bjunior\b|\bjr\.|\bentry\b|\bgraduate\b|\bfresh\b/.test(t)) return "Junior";
  return "Mid";
}

function inferSector(title: string, extra = ""): string {
  const t = (title + " " + extra).toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|cloud|mobile|react|node|python|java(?!\s*national)|typescript|aws|docker|data analyst|data scientist|ml engineer|ai engineer|cyber|network engineer|it support|information technology/.test(t)) return "Tech";
  if (/finance|accountant|auditor|tax|investment|banker|accounting/.test(t)) return "Finance";
  if (/marketing|social media|content|seo|brand|public relations|\bpr\s/.test(t)) return "Marketing";
  if (/sales|business development|account manager|sales executive|sales specialist/.test(t)) return "Sales";
  if (/graphic design|ui designer|ux designer|art director|visual designer|product designer/.test(t)) return "Design";
  if (/hr |human resource|recruiter|talent acquisition/.test(t)) return "HR";
  if (/doctor|nurse|pharmacist|medical|clinical|dentist|healthcare/.test(t)) return "Healthcare";
  if (/teacher|professor|instructor|lecturer|tutor|academic|education/.test(t)) return "Education";
  if (/lawyer|legal counsel|paralegal/.test(t)) return "Legal";
  if (/customer service|call center|secretary|administration|receptionist/.test(t)) return "Customer Service";
  if (/construction|civil engineer|architect|site engineer/.test(t)) return "Construction";
  if (/logistics|supply chain|procurement|warehouse/.test(t)) return "Operations";
  return "Other";
}

function isFreshIso(iso: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !isNaN(t) && Date.now() - t < FRESHNESS_MS;
}

// ---------- Akhtaboot RSS ----------
async function scrapeAkhtaboot(country: "Jordan" | "UAE" | "Saudi Arabia"): Promise<Job[]> {
  const slug = country === "Jordan" ? "jordan" : country === "UAE" ? "uae" : "saudi-arabia";
  try {
    const res = await fetch(`https://www.akhtaboot.com/en/${slug}/jobs.rss`, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml,application/xml" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split(/<item>/).slice(1).map((s) => s.split("</item>")[0]);

    const grab = (block: string, tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    };

    return items
      .map((block, i): Job => {
        const title = grab(block, "title").replace(/&amp;/g, "&").trim();
        const link = grab(block, "link");
        const company = grab(block, "company");
        const city = grab(block, "city") || (country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman");
        const communities = grab(block, "communities");
        const pubDate = grab(block, "pubDate");
        const id = grab(block, "id") || String(i);
        const iso = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : "";
        return {
          id: `akhtaboot-${slug}-${id}`,
          title,
          company: company || "Confidential",
          sector: inferSector(title, communities),
          city,
          country,
          seniority: inferSeniority(title),
          skills: [],
          remote: /\bremote\b|\bwork from home\b/i.test(title + communities),
          source: "Akhtaboot",
          url: link,
          postedAt: iso,
          description: communities ? `Field: ${communities}` : "",
        };
      })
      .filter((j) => j.title && isFreshIso(j.postedAt))
      .slice(0, 30);
  } catch {
    return [];
  }
}

// ---------- For9a / Fursa __NEXT_DATA__ ----------
async function scrapeFor9a(): Promise<Job[]> {
  try {
    const res = await fetch("https://www.for9a.com/en/opportunity/recently-added", {
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return [];
    const data = JSON.parse(m[1]);
    const opps: any[] = data?.props?.pageProps?.opportunities?.data ?? [];

    return opps
      .map((o, i): Job => {
        const title: string = o.title ?? "Untitled";
        const url: string = o.url ?? "";
        const country =
          /jordan/i.test(title) ? "Jordan" :
          /\buae\b|dubai|abu[- ]?dhabi|emirates/i.test(title) ? "UAE" :
          /saudi|riyadh|jeddah|\bksa\b/i.test(title) ? "Saudi Arabia" :
          "Jordan";
        // For9a opportunities are usually scholarships/internships/programs
        const deadline = o.deadline ?? "";
        // Use today's date as postedAt since 'recently-added' page guarantees freshness
        const postedAt = new Date().toISOString().slice(0, 10);
        return {
          id: `fursa-${o.id ?? i}`,
          title,
          company: "For9a Opportunity",
          sector: inferSector(title),
          city: country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman",
          country,
          seniority: /scholarship|fellowship|internship|training/i.test(title) ? "Intern" : inferSeniority(title),
          skills: [],
          remote: o.is_remote === true || o.is_remote === "True",
          source: "Fursa",
          url,
          postedAt,
          description: deadline ? `Application deadline: ${deadline}` : "",
        };
      })
      .filter((j) => j.title && j.url)
      .slice(0, 30);
  } catch {
    return [];
  }
}

// ---------- Bayt HTML scraper ----------
// Bayt structure: <li data-js-job data-job-id="..."> ... <h2><a href="/en/<country>/jobs/SLUG-ID/">TITLE</a></h2>
//   ... <a href="/en/company/...">COMPANY</a> ... <span>CITY</span>, <span>COUNTRY</span>
//   ... data-automation-jobActiveDate="UNIX_TIMESTAMP"
async function scrapeBayt(country: "Jordan" | "UAE" | "Saudi Arabia"): Promise<Job[]> {
  const slug = country === "Jordan" ? "jordan" : country === "UAE" ? "uae" : "saudi-arabia";
  try {
    const res = await fetch(`https://www.bayt.com/en/${slug}/jobs/`, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
    if (!res.ok) {
      console.error(`[bayt-${slug}] HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    if (html.length < 5000) {
      console.error(`[bayt-${slug}] suspiciously small body: ${html.length} bytes`);
      return [];
    }

    // Split into job-card blocks
    const items = html.split(/<li[^>]*\bdata-js-job\b/).slice(1).map((s) => s.split("</li>")[0]);

    return items
      .map((block, i): Job => {
        const idMatch = block.match(/data-job-id="(\d+)"/);
        const id = idMatch ? idMatch[1] : String(i);

        const titleMatch = block.match(/<a[^>]*data-js-aid="jobID"[^>]*href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/);
        const url = titleMatch ? `https://www.bayt.com${titleMatch[1]}` : "";
        const title = titleMatch ? titleMatch[2].replace(/\s+/g, " ").replace(/&amp;/g, "&").trim() : "";

        const companyMatch = block.match(/<a[^>]*class="t-default t-bold"[^>]*>([^<]+)<\/a>/);
        const company = companyMatch ? companyMatch[1].trim() : "Confidential";

        const cityMatch = block.match(/href="\/en\/[a-z-]+\/jobs\/jobs-in-[^"]+"[^>]*>\s*<span>([^<]+)<\/span>/);
        const city = cityMatch ? cityMatch[1].trim() : (country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman");

        const tsMatch = block.match(/data-automation-jobActiveDate="(\d+)"/);
        const postedAt = tsMatch ? new Date(parseInt(tsMatch[1]) * 1000).toISOString().slice(0, 10) : "";

        const descMatch = block.match(/<div[^>]*class="jb-descr[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        const description = descMatch
          ? descMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 300)
          : "";

        return {
          id: `bayt-${slug}-${id}`,
          title,
          company,
          sector: inferSector(title, description),
          city,
          country,
          seniority: inferSeniority(title),
          skills: [],
          remote: /\bremote\b|work from home/i.test(title + " " + description),
          source: "Bayt",
          url,
          postedAt,
          description,
        };
      })
      .filter((j) => j.title && j.url && isFreshIso(j.postedAt))
      .slice(0, 30);
  } catch {
    return [];
  }
}

// ---------- LinkedIn public guest job search ----------
const LINKEDIN_GEO: Record<"Jordan" | "UAE" | "Saudi Arabia", string> = {
  "Jordan": "103710677",
  "UAE": "104305776",
  "Saudi Arabia": "100459316",
};

async function scrapeLinkedIn(country: "Jordan" | "UAE" | "Saudi Arabia", keywords = ""): Promise<Job[]> {
  const geoId = LINKEDIN_GEO[country];
  try {
    const res = await fetch(
      `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keywords)}&geoId=${geoId}&start=0`,
      { headers: { "User-Agent": UA, Accept: "text/html" } }
    );
    if (!res.ok) return [];
    const html = await res.text();

    // Each job is wrapped in <div class="base-card ..." data-entity-urn="urn:li:jobPosting:ID">
    // The card contains title (h3.base-search-card__title), company (h4.base-search-card__subtitle > a),
    // location (span.job-search-card__location), and posted date (time.job-search-card__listdate datetime=)
    const cardRegex = /<div class="base-card[^"]*"[^>]*data-entity-urn="urn:li:jobPosting:(\d+)"[\s\S]*?(?=<div class="base-card|<\/li>)/g;

    const jobs: Job[] = [];
    let m: RegExpExecArray | null;
    while ((m = cardRegex.exec(html)) !== null && jobs.length < 25) {
      const id = m[1];
      const card = m[0];

      const titleMatch = card.match(/<h3 class="base-search-card__title">\s*([\s\S]*?)\s*<\/h3>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() : "";

      const companyMatch = card.match(/<h4 class="base-search-card__subtitle">\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/);
      const company = companyMatch ? companyMatch[1].replace(/&amp;/g, "&").trim() : "Confidential";

      const locMatch = card.match(/<span class="job-search-card__location">\s*([^<]+?)\s*<\/span>/);
      const locRaw = locMatch ? locMatch[1].replace(/&amp;/g, "&").trim() : "";
      const city = locRaw.split(",")[0]?.trim() || (country === "UAE" ? "Dubai" : country === "Saudi Arabia" ? "Riyadh" : "Amman");

      const dateMatch = card.match(/<time class="job-search-card__listdate[^"]*"[^>]*datetime="([^"]+)"/);
      const postedAt = dateMatch ? dateMatch[1] : "";

      const urlMatch = card.match(/<a class="base-card__full-link[^"]*"[^>]*href="([^"]+)"/);
      const url = urlMatch ? urlMatch[1].split("?")[0] : "";

      if (!title || !url) continue;

      jobs.push({
        id: `linkedin-${country.replace(/\s/g, "")}-${id}`,
        title,
        company,
        sector: inferSector(title),
        city,
        country,
        seniority: inferSeniority(title),
        skills: [],
        remote: /\bremote\b/i.test(title + " " + locRaw),
        source: "LinkedIn",
        url,
        postedAt,
        description: "",
      });
    }

    return jobs.filter((j) => isFreshIso(j.postedAt));
  } catch {
    return [];
  }
}

// ---------- Wuzzuf HTML scraper (regional: Egypt + Gulf) ----------
async function scrapeWuzzuf(): Promise<Job[]> {
  try {
    const res = await fetch("https://wuzzuf.net/jobs/p/", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      console.error(`[wuzzuf] HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    if (html.length < 5000) {
      console.error(`[wuzzuf] suspiciously small body: ${html.length} bytes`);
      return [];
    }

    // Wuzzuf wraps each job in a <div class="css-XYZ"> that contains <h2><a href="/jobs/p/SLUG">TITLE</a></h2>.
    // Anchor on the title pattern, then walk forward ~2500 chars for the rest of the card.
    const titleRegex = /<h2[^>]*><[^>]*><a[^>]+href="(\/jobs\/p\/[^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/h2>/g;
    const jobs: Job[] = [];
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = titleRegex.exec(html)) !== null && jobs.length < 30) {
      const slugUrl = match[1];
      const title = match[2].trim();
      const cardStart = match.index;
      const card = html.slice(cardStart, cardStart + 3000);

      // Company link pattern: <a href="https://wuzzuf.net/jobs/careers/...">COMPANY -</a>
      const companyMatch = card.match(/href="https:\/\/wuzzuf\.net\/jobs\/careers\/[^"]+"[^>]*>([^<]+?)\s*-?\s*<\/a>/);
      const company = companyMatch ? companyMatch[1].trim() : "Confidential";

      // Location span: "<span class='...'>CITY, COUNTRY</span>" or similar with comments inside
      const locMatch = card.match(/<span[^>]*>([^<]*(?:Egypt|Saudi|UAE|Jordan|Bahrain|Kuwait|Qatar|Oman)[^<]*)<\/span>/i);
      const loc = locMatch ? locMatch[1].replace(/<!--[^>]*-->/g, "").replace(/\s+/g, " ").trim() : "";
      const locLower = loc.toLowerCase();
      const country =
        /uae|dubai|abu dhabi|emirates/i.test(locLower) ? "UAE" :
        /saudi|riyadh|jeddah/i.test(locLower) ? "Saudi Arabia" :
        /jordan|amman/i.test(locLower) ? "Jordan" :
        /egypt|cairo|alexandria|giza/i.test(locLower) ? "Egypt" :
        /bahrain/i.test(locLower) ? "Bahrain" :
        /kuwait/i.test(locLower) ? "Kuwait" :
        /qatar|doha/i.test(locLower) ? "Qatar" :
        "Egypt";
      const city = loc.split(",")[0]?.trim() || (country === "Egypt" ? "Cairo" : "Cairo");

      // "55 minutes ago" / "2 days ago" / "1 month ago" — convert to ISO
      const postedMatch = card.match(/>(\d+)\s+(minute|hour|day|week|month)s?\s+ago</i);
      let postedAt = "";
      if (postedMatch) {
        const n = parseInt(postedMatch[1]);
        const unit = postedMatch[2].toLowerCase();
        const ms =
          unit === "minute" ? n * 60_000 :
          unit === "hour"   ? n * 3_600_000 :
          unit === "day"    ? n * 86_400_000 :
          unit === "week"   ? n * 7 * 86_400_000 :
          unit === "month"  ? n * 30 * 86_400_000 : 0;
        postedAt = new Date(Date.now() - ms).toISOString().slice(0, 10);
      }

      jobs.push({
        id: `wuzzuf-${slugUrl.replace(/[^a-z0-9]/gi, "-").slice(0, 60)}-${i}`,
        title,
        company,
        sector: inferSector(title),
        city,
        country,
        seniority: inferSeniority(title),
        skills: [],
        remote: /\bremote\b/i.test(title),
        source: "Wuzzuf",
        url: `https://wuzzuf.net${slugUrl}`,
        postedAt,
        description: "",
      });
      i++;
    }

    return jobs.filter((j) => isFreshIso(j.postedAt));
  } catch {
    return [];
  }
}

const SCRAPERS: Record<string, () => Promise<Job[]>> = {
  // Generic (returns LinkedIn's algorithm — tends to be tech-heavy, kept for coverage)
  linkedin:     () => scrapeLinkedIn("Jordan"),
  linkedin_ae:  () => scrapeLinkedIn("UAE"),
  linkedin_sa:  () => scrapeLinkedIn("Saudi Arabia"),

  // Non-tech sector keyword searches — Jordan
  linkedin_marketing:  () => scrapeLinkedIn("Jordan", "marketing"),
  linkedin_finance:    () => scrapeLinkedIn("Jordan", "finance accounting"),
  linkedin_hr:         () => scrapeLinkedIn("Jordan", "human resources HR recruiter"),
  linkedin_sales:      () => scrapeLinkedIn("Jordan", "sales business development"),
  linkedin_design:     () => scrapeLinkedIn("Jordan", "graphic design UI UX"),
  linkedin_healthcare: () => scrapeLinkedIn("Jordan", "healthcare nurse doctor pharmacist"),
  linkedin_education:  () => scrapeLinkedIn("Jordan", "teacher lecturer instructor"),
  linkedin_legal:      () => scrapeLinkedIn("Jordan", "legal lawyer compliance"),
  linkedin_cs:         () => scrapeLinkedIn("Jordan", "customer service support"),
  linkedin_ops:        () => scrapeLinkedIn("Jordan", "operations logistics supply chain"),

  // Non-tech sector keyword searches — UAE
  linkedin_ae_marketing: () => scrapeLinkedIn("UAE", "marketing"),
  linkedin_ae_finance:   () => scrapeLinkedIn("UAE", "finance accounting"),
  linkedin_ae_hr:        () => scrapeLinkedIn("UAE", "human resources HR"),
  linkedin_ae_sales:     () => scrapeLinkedIn("UAE", "sales business development"),
  linkedin_ae_design:    () => scrapeLinkedIn("UAE", "graphic design UI UX"),

  // Non-tech sector keyword searches — Saudi Arabia
  linkedin_sa_marketing: () => scrapeLinkedIn("Saudi Arabia", "marketing"),
  linkedin_sa_finance:   () => scrapeLinkedIn("Saudi Arabia", "finance accounting"),
  linkedin_sa_hr:        () => scrapeLinkedIn("Saudi Arabia", "human resources HR"),
  linkedin_sa_sales:     () => scrapeLinkedIn("Saudi Arabia", "sales"),

  // Other sources
  akhtaboot:    () => scrapeAkhtaboot("Jordan"),
  akhtaboot_ae: () => scrapeAkhtaboot("UAE"),
  akhtaboot_sa: () => scrapeAkhtaboot("Saudi Arabia"),
  bayt:         () => scrapeBayt("Jordan"),
  bayt_ae:      () => scrapeBayt("UAE"),
  bayt_sa:      () => scrapeBayt("Saudi Arabia"),
  fursa:        () => scrapeFor9a(),
  wuzzuf:       () => scrapeWuzzuf(),
};

const SCRAPE_THROTTLE_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const sourceKey = searchParams.get("source");
  const force = searchParams.get("force") === "1";

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const report: any[] = [];

  try {
    // Throttle: skip re-scraping if any scraped row was inserted in the last 2 hours.
    // This prevents the counts from changing on every page refresh.
    if (!force) {
      const lastScrape = await pool.query(`
        SELECT MAX("fetchedAt") AS last
        FROM "CachedJob"
        WHERE source IN ('LinkedIn','Akhtaboot','Bayt','Wuzzuf','Fursa')
      `);
      const lastTs = lastScrape.rows[0]?.last;
      if (lastTs && Date.now() - new Date(lastTs).getTime() < SCRAPE_THROTTLE_MS) {
        const counts = await pool.query(`SELECT source, COUNT(*) as count FROM "CachedJob" GROUP BY source ORDER BY count DESC`);
        const minsAgo = Math.floor((Date.now() - new Date(lastTs).getTime()) / 60_000);
        const nextInMins = Math.max(0, Math.floor(SCRAPE_THROTTLE_MS / 60_000) - minsAgo);
        return NextResponse.json({
          skipped: true,
          reason: `Last scrape ran ${minsAgo} min ago — next refresh in ~${nextInMins} min. Add ?force=1 to override.`,
          finalBreakdown: counts.rows,
        });
      }
    }

    const tasks: { key: string; fn: () => Promise<Job[]> }[] = all
      ? Object.entries(SCRAPERS).map(([key, fn]) => ({ key, fn }))
      : sourceKey && SCRAPERS[sourceKey]
        ? [{ key: sourceKey, fn: SCRAPERS[sourceKey] }]
        : [];

    if (tasks.length === 0) {
      return NextResponse.json({ error: "unknown source", valid: Object.keys(SCRAPERS) }, { status: 400 });
    }

    // Per-scraper hard timeout (12s). A slow/blocked source can't drag the
    // whole 30s edge budget past the limit. Bayt + Wuzzuf are most likely to
    // hang when Vercel IPs are blocked.
    const SCRAPER_TIMEOUT_MS = 12_000;
    const withTimeout = (key: string, fn: () => Promise<Job[]>): Promise<Job[]> =>
      Promise.race([
        fn(),
        new Promise<Job[]>((_, reject) =>
          setTimeout(() => reject(new Error(`${key} timed out at ${SCRAPER_TIMEOUT_MS}ms`)), SCRAPER_TIMEOUT_MS)
        ),
      ]);

    const results = await Promise.allSettled(tasks.map((t) => withTimeout(t.key, t.fn)));

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

    // Replace each scraped source's rows atomically with a single multi-row INSERT.
    // Was previously N+1 queries which compounded with the parallel scrapes and blew past
    // the 30s edge budget when running ?all=1&force=1.
    for (const [sourceName, jobs] of Object.entries(bySource)) {
      if (jobs.length === 0) continue;
      await pool.query(`DELETE FROM "CachedJob" WHERE source = $1`, [sourceName]);

      // Build a single parameterised multi-row insert
      const cols = 16;
      const valuesSql = jobs
        .map((_, i) => {
          const o = i * cols;
          return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8},$${o+9},$${o+10},$${o+11},$${o+12},$${o+13},$${o+14},$${o+15},$${o+16},NOW())`;
        })
        .join(",");
      const params: any[] = [];
      for (const j of jobs) {
        params.push(
          j.id, j.title, j.company, j.sector, j.city, j.country, j.seniority,
          JSON.stringify(j.skills), null, null, j.remote, null,
          j.source, j.url, j.postedAt, j.description
        );
      }
      await pool.query(
        `INSERT INTO "CachedJob" (id, title, company, sector, city, country, seniority, skills, "salaryMin", "salaryMax", remote, "internshipCountry", source, url, "postedAt", description, "fetchedAt")
         VALUES ${valuesSql}
         ON CONFLICT (id) DO NOTHING`,
        params
      );
    }

    const counts = await pool.query(`SELECT source, COUNT(*) as count FROM "CachedJob" GROUP BY source ORDER BY count DESC`);
    return NextResponse.json({ report, finalBreakdown: counts.rows });
  } finally {
    await pool.end();
  }
}
