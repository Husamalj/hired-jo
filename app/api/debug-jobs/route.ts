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

  // Step 2: check DB
  const dbCount = await prisma.cachedJob.count().catch((e: any) => `DB ERROR: ${e.message}`);
  const meta = await prisma.jobsFetchMeta.findUnique({ where: { id: 1 } }).catch(() => null);

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

  return NextResponse.json({ envCheck, dbCount, lastFetched: meta?.lastFetched ?? null, jsearchResult });
}
