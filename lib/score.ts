import type { CV, HiredScore } from "./types";
import jobs from "../data/jobs.json";

export function computeScore(cv: CV): HiredScore {
  const allJobSkills = (jobs as any[])
    .flatMap((j) => j.skills ?? [])
    .map((s: string) => s.toLowerCase());

  // CV Strength (0–300)
  const hasSummary = (cv.summary?.length ?? 0) > 50 ? 60 : 0;
  const expBullets = cv.experience.reduce((n, x) => n + x.bullets.length, 0);
  const projectsScore = Math.min(cv.projects.length * 25, 75);
  const skillsScore = Math.min(cv.skills.length * 5, 75);
  const cvStrength = Math.min(hasSummary + expBullets * 10 + projectsScore + skillsScore, 300);

  // Skill Demand (0–300)
  const demandCount = cv.skills.filter((s) =>
    allJobSkills.includes(s.toLowerCase())
  ).length;
  const skillDemand = Math.min(demandCount * 25, 300);

  // Market Fit (0–200)
  const yearsExp = cv.experience.length;
  const marketFit = Math.min(yearsExp * 50 + (demandCount > 3 ? 50 : 0), 200);

  // Completeness (0–200)
  const fields = [
    cv.summary,
    cv.education.length,
    cv.experience.length,
    cv.projects.length,
    cv.skills.length,
    cv.languages.length,
  ];
  const completeness = (fields.filter(Boolean).length / fields.length) * 200;

  const total = Math.round(cvStrength + skillDemand + marketFit + completeness);

  const tips: string[] = [];
  if (cvStrength < 200)
    tips.push("Add quantified bullets to your experience (e.g. 'reduced load time by 40%').");
  if (skillDemand < 150) {
    const topMissing = [...new Set(allJobSkills)].slice(0, 3).join(", ");
    tips.push(`Add in-demand skills to your CV: ${topMissing}.`);
  }
  if (cv.projects.length < 2)
    tips.push("Showcase 2+ projects with measurable outcomes and GitHub links.");

  return {
    total,
    breakdown: {
      cvStrength,
      skillDemand,
      marketFit,
      completeness: Math.round(completeness),
    },
    tips: tips.slice(0, 3),
  };
}
