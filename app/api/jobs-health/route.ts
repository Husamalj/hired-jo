export const runtime = "edge";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

export async function GET() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  try {
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
