export const runtime = "edge";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

async function testJSearchPublishers(query: string): Promise<any> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return "no RAPIDAPI_KEY";
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=month`,
      { headers: { "x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": key }, signal: ctrl.signal }
    );
    const json = await res.json();
    if (!Array.isArray(json.data)) return { error: json.message ?? "no data array" };
    const counts: Record<string, number> = {};
    for (const j of json.data) {
      const p = j.job_publisher ?? "unknown";
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return { count: json.data.length, publishers: counts };
  } catch (e: any) {
    return `FAILED: ${e.message}`;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testQuery = searchParams.get("testQuery"); // ?testQuery=site:linkedin.com+jobs+Jordan

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  try {
    if (testQuery) {
      return NextResponse.json({ query: testQuery, result: await testJSearchPublishers(testQuery) });
    }
    // Source breakdown with fresh/stale split
    const breakdown = await pool.query(`
      SELECT
        source,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "postedAt" >= (CURRENT_DATE - INTERVAL '30 days')) AS fresh_30d,
        COUNT(*) FILTER (WHERE "postedAt" < (CURRENT_DATE - INTERVAL '30 days') OR "postedAt" IS NULL OR "postedAt" = '') AS stale,
        MAX("fetchedAt") AS last_fetched
      FROM "CachedJob"
      GROUP BY source
      ORDER BY total DESC
    `);

    // Overall stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE remote = true) AS remote,
        COUNT(*) FILTER (WHERE seniority = 'Intern') AS interns,
        COUNT(*) FILTER (WHERE "postedAt" = '' OR "postedAt" IS NULL) AS missing_date,
        COUNT(DISTINCT source) AS sources,
        COUNT(DISTINCT country) AS countries
      FROM "CachedJob"
    `);

    const meta = await pool.query(`SELECT "lastFetched" FROM "JobsFetchMeta" WHERE id = 1`);

    return NextResponse.json({
      stats: stats.rows[0],
      lastJSearchRefresh: meta.rows[0]?.lastFetched ?? null,
      bySource: breakdown.rows,
    });
  } finally {
    await pool.end();
  }
}
