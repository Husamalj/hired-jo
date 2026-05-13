import type { CV, HiredScore } from "./types";
import jobs from "../data/jobs.json";

export function computeScore(cv: CV): HiredScore {
  const allJobSkills = (jobs as any[])
    .flatMap((j) => j.skills ?? [])
    .map((s: string) => s.toLowerCase());

  // ── CV Strength (0–300): quality of written content ──────────────────
  const summaryLen = cv.summary?.trim().length ?? 0;
  const summaryPts = summaryLen > 80 ? 40 : summaryLen > 50 ? 20 : 0;

  // only count bullets with actual text (not placeholder/empty)
  const expBullets = cv.experience.reduce(
    (n, x) => n + x.bullets.filter((b) => b.trim().length > 10).length,
    0
  );
  const expBulletPts = Math.min(expBullets * 12, 120);

  // projects only count if they have a real description AND at least 1 bullet
  const qualityProjects = cv.projects.filter(
    (p) => (p.description?.trim().length ?? 0) > 10 && (p.bullets?.length ?? 0) > 0
  ).length;
  const projectPts = Math.min(qualityProjects * 25, 75);

  // skills only count if name is non-trivial
  const realSkills = cv.skills.filter((s) => s.trim().length > 2);
  const skillListPts = Math.min(realSkills.length * 5, 60);

  const cvStrength = Math.min(
    summaryPts + expBulletPts + projectPts + skillListPts,
    300
  );

  // ── Skill Demand (0–300): how marketable your skills are ─────────────
  const matchingSkills = realSkills.filter((s) =>
    allJobSkills.includes(s.toLowerCase())
  );
  const demandCount = matchingSkills.length;
  // 15pts per in-demand skill; bonus +30 if highly aligned (>10 skills)
  const skillDemand = Math.min(demandCount * 15 + (demandCount > 10 ? 30 : 0), 300);

  // ── Market Fit (0–200): actual career evidence ───────────────────────
  // only count experience entries that have at least 1 real bullet
  const realExpEntries = cv.experience.filter(
    (x) => x.bullets.filter((b) => b.trim().length > 10).length > 0
  ).length;
  const expFitPts = Math.min(realExpEntries * 50, 150);

  const hasEducation =
    cv.education.length > 0 && (cv.education[0].institution?.trim().length ?? 0) > 2
      ? 30
      : 0;

  const certPts = Math.min(
    (cv.certifications?.filter((c) => c.trim().length > 2).length ?? 0) * 10,
    20
  );

  const marketFit = Math.min(expFitPts + hasEducation + certPts, 200);

  // ── Completeness (0–200): profile coverage ───────────────────────────
  const hasContact =
    (cv.fullName?.trim().length ?? 0) > 1 &&
    (cv.email?.trim().length ?? 0) > 3 &&
    (cv.phone?.trim().length ?? 0) > 5
      ? 40
      : (cv.fullName?.trim().length ?? 0) > 1
      ? 20
      : 0;

  const completeness = Math.min(
    hasContact +
      (summaryLen > 50 ? 30 : 0) +
      (cv.education.length > 0 ? 25 : 0) +
      (realExpEntries > 0 ? 40 : 0) +
      (cv.projects.length > 0 ? 30 : 0) +
      (realSkills.length >= 3 ? 20 : 0) +
      (cv.languages.length > 0 ? 15 : 0),
    200
  );

  const total = Math.round(cvStrength + skillDemand + marketFit + completeness);

  const tips: string[] = [];
  if (expBullets < 6)
    tips.push("Add quantified bullets to each job (e.g. 'reduced load time by 40%').");
  if (demandCount < 8) {
    const topMissing = [...new Set(allJobSkills)]
      .filter((s) => !realSkills.map((r) => r.toLowerCase()).includes(s))
      .slice(0, 3)
      .join(", ");
    if (topMissing) tips.push(`Add in-demand skills: ${topMissing}.`);
  }
  if (qualityProjects < 2)
    tips.push("Showcase 2+ projects with a description, tech stack, and measurable outcomes.");
  if (summaryLen < 50)
    tips.push("Write a professional summary (2–3 sentences about your goals and strengths).");

  return {
    total,
    breakdown: { cvStrength, skillDemand, marketFit, completeness },
    tips: tips.slice(0, 3),
  };
}
