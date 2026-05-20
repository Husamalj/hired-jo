import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testGemini = searchParams.get("testGemini"); // ?testGemini=akhtaboot

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  // 1. DB breakdown by source
  let sourceBreakdown: any = "failed";
  let recentJobs: any = "failed";
  let dbCount = 0;
  try {
    const src = await pool.query(`SELECT source, COUNT(*) as count FROM "CachedJob" GROUP BY source ORDER BY count DESC`);
    sourceBreakdown = src.rows;
    dbCount = src.rows.reduce((s: number, r: any) => s + parseInt(r.count), 0);

    const recent = await pool.query(`SELECT title, company, source, country, city, "postedAt", "fetchedAt" FROM "CachedJob" ORDER BY "fetchedAt" DESC LIMIT 10`);
    recentJobs = recent.rows;
  } catch (e: any) {
    sourceBreakdown = `DB ERROR: ${e.message}`;
  }

  // 2. JobsFetchMeta
  let lastFetched: any = "unknown";
  try {
    const meta = await pool.query(`SELECT "lastFetched" FROM "JobsFetchMeta" WHERE id = 1`);
    lastFetched = meta.rows[0]?.lastFetched ?? "never";
  } catch {}

  // 3. Optional: live test Gemini refresh for one source
  let geminiTest: any = "not requested (add ?testGemini=akhtaboot to test)";
  if (testGemini) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any],
      });
      const SITES: Record<string, string> = {
        akhtaboot: "akhtaboot.com",
        bayt: "bayt.com/en/jordan/jobs",
        fursa: "for9a.com",
      };
      const site = SITES[testGemini] ?? testGemini;
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("8s timeout")), 8000));
      const result = await Promise.race([
        model.generateContent(
          `Search ${site} right now and find 5 recently posted jobs in the Middle East.
Return ONLY a valid JSON array, no markdown. Each item:
{"title":"...","company":"...","city":"...","url":"...","postedAt":"YYYY-MM-DD"}
Only real listings. Do not invent jobs.`
        ),
        timeout,
      ]);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      geminiTest = {
        site,
        rawLength: text.length,
        rawPreview: text.slice(0, 400),
        parsedCount: match ? (() => { try { return JSON.parse(match[0]).length; } catch { return "parse error"; } })() : 0,
        parsed: match ? (() => { try { return JSON.parse(match[0]).slice(0, 3); } catch { return "parse error"; } })() : "no JSON array found",
      };
    } catch (e: any) {
      geminiTest = `FAILED: ${e.message}`;
    }
  }

  await pool.end();

  return NextResponse.json({
    dbCount,
    sourceBreakdown,
    lastFetched,
    recentJobs,
    geminiTest,
  });
}
