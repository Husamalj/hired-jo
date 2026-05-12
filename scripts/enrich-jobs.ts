/**
 * enrich-jobs.ts — adds skills/salary/seniority fields to data/jobs.json via Gemini.
 * Run AFTER Track C delivers src/lib/gemini.ts with enrichJob() exported.
 *
 * Run: pnpm tsx scripts/enrich-jobs.ts
 */
import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(__dirname, "../data/jobs.json");

// Lazy import so the script doesn't crash before gemini.ts exists
async function getEnrichJob() {
  try {
    const mod = await import("../lib/gemini");
    return mod.enrichJob as (desc: string) => Promise<{
      skills: string[];
      seniority: string;
      salaryMin: number | null;
      salaryMax: number | null;
      sector: string;
    }>;
  } catch {
    console.error("lib/gemini.ts not found or enrichJob not exported. Waiting for Track C.");
    process.exit(1);
  }
}

async function main() {
  const enrichJob = await getEnrichJob();
  const jobs = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as any[];
  let enriched = 0;

  for (const j of jobs) {
    if (j.skills?.length > 0) continue; // already enriched
    try {
      const result = await enrichJob(j.description);
      Object.assign(j, result);
      enriched++;
      console.log(`✓ ${j.title} @ ${j.company} — [${result.skills.join(", ")}]`);
      await new Promise((r) => setTimeout(r, 300)); // rate limit
    } catch (e) {
      console.error(`✗ Failed: ${j.title}`, e);
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(jobs, null, 2));
  console.log(`\nDone. Enriched ${enriched} jobs.`);
}

main();
