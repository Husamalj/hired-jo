import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const key = process.env.RAPIDAPI_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Step 1: check env vars
  const dbUrl = process.env.DATABASE_URL;
  const envCheck = {
    RAPIDAPI_KEY: key ? `SET (starts with ${key.slice(0, 8)}...)` : "MISSING",
    GEMINI_API_KEY: geminiKey ? "SET" : "MISSING",
    DATABASE_URL: dbUrl ? `SET (starts with ${dbUrl.slice(0, 20)}...)` : "MISSING",
  };

  // Step 2: test direct Pool connection (bypasses Prisma module caching)
  let dbCount: any = "not tested";
  let directPoolTest: any = "not tested";
  try {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT COUNT(*) FROM "CachedJob"');
    dbCount = parseInt(result.rows[0].count);
    directPoolTest = "SUCCESS";
    await pool.end();
  } catch (e: any) {
    directPoolTest = `FAILED: ${e.message}`;
  }
  const meta = null;

  // Step 3: test one JSearch call
  let jsearchResult: any = "not tested";
  if (key) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=jobs+in+Amman+Jordan&num_pages=1&date_posted=all`,
        { headers: { "x-rapidapi-host": "jsearch.p.rapidapi.com", "x-rapidapi-key": key }, signal: controller.signal }
      );
      const json = await res.json();
      jsearchResult = {
        status: res.status,
        hasData: Array.isArray(json.data),
        count: Array.isArray(json.data) ? json.data.length : 0,
        firstJob: Array.isArray(json.data) && json.data[0] ? json.data[0].job_title : null,
        error: json.message ?? json.error ?? null,
      };
    } catch (e: any) {
      jsearchResult = `FAILED: ${e.message}`;
    }
  }

  return NextResponse.json({ envCheck, directPoolTest, dbCount, jsearchResult });
}
