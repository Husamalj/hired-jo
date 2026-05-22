import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function buildPrompt(s: Record<string, any>): string {
  const experienceBlock = Array.isArray(s.experience) && s.experience.length
    ? s.experience.map((e: any, i: number) =>
        `  Experience ${i + 1}: Company: ${e.company} | Role: ${e.role} | Dates: ${e.dates} | Description: ${e.description}`
      ).join("\n")
    : "  None";

  const projectsBlock = Array.isArray(s.projects) && s.projects.length
    ? s.projects.map((p: any, i: number) =>
        `  Project ${i + 1}: Name: ${p.name} | What it does: ${p.description} | Tools: ${p.tools} | Result/Impact: ${p.result}`
      ).join("\n")
    : "  None provided";

  return `You are a senior CV writer specializing in ATS-optimized resumes for students and recent graduates in Jordan and the Middle East.

Transform the raw user answers below into a polished professional CV JSON. Fix all spelling and grammar silently. Use strong action verbs. Quantify impact wherever possible.

STRICT RULES:
- Never output placeholder text, "skip", "none", "n/a", "not applicable"
- Never start the summary with "I"
- Name: proper title case
- University: title case, institution name only (no major in institution field)
- Omit GPA if below 2.8 or not provided
- If experience is empty or "none" → return experience as []
- If certifications is "skip"/"none" → return certifications as []
- If extras/achievements is "skip"/"none" → return achievements as []
- Template type is "${s.template}" — used for section ordering in the frontend, not your concern

SUMMARY (the "summary" field) — exactly 2 sentences:
  Sentence 1: Degree + university + graduation year + GPA if >= 2.8 + target role
  Sentence 2: Top 3-5 specific tools/skills + most impressive achievement with numbers if available

EXPERIENCE BULLETS — 3-4 bullets per role, each starting with a strong action verb:
  - Specific tasks with tools named
  - Quantified results when user provided numbers
  - If the user's description is vague, infer realistic professional duties for that role and industry

PROJECT BULLETS — 3 bullets per project:
  - Bullet 1: What was built + tools used
  - Bullet 2: Technical approach or challenge solved
  - Bullet 3: Result/impact (use user's numbers if given, otherwise describe value delivered)

SKILLS — group into categories relevant to their field:
  Tech field: Programming Languages | Frameworks & Libraries | Tools & Platforms | Databases
  Creative field: Software | Equipment | Creative Skills | Soft Skills
  Business field: Technical | Analytical | Communication
  Keep flat skills array too (all items combined, properly spelled).

CERTIFICATIONS — parse "Name | Issuer | Year" format. Return as flat string array like ["Google Data Analytics Certificate | Google | 2024"]. If skip/none, return [].

ACHIEVEMENTS — extract from extras field: awards, hackathons, volunteering, recognition. Return as string array. If skip/none, return [].

LINKS — parse from links field. Identify platform from URL. Return [] if skip/none.

User data:
  Name: "${s.name}"
  Phone: "${s.phone}"
  Email: "${s.email}"
  Location: "${s.location}"
  University & Major: "${s.university}"
  Graduation year + GPA: "${s.gradYear}"
  Target role: "${s.targetRole}"
  Experience:
${experienceBlock}
  Projects:
${projectsBlock}
  Technical skills: "${s.technicalSkills}"
  Soft skills: "${s.softSkills}"
  Certifications: "${s.certifications}"
  Extras (awards/hackathons/volunteering): "${s.extras}"
  Languages: "${s.languages}"
  Links: "${s.links}"

Return ONLY valid JSON with NO markdown and NO code blocks:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "links": [{ "label": "GitHub|LinkedIn|Portfolio|Behance|YouTube|Instagram|Dribbble", "url": "string" }],
  "summary": "Exactly 2 rich sentences. Specific tools. No I. No placeholders.",
  "education": [{
    "degree": "B.Sc. in [Full Major Name]",
    "institution": "University Name Only",
    "startYear": number,
    "endYear": number,
    "gpa": "string or omit if below 2.8"
  }],
  "experience": [{
    "title": "Job Title",
    "company": "Company Name",
    "startDate": "MMM YYYY",
    "endDate": "MMM YYYY or Present",
    "bullets": ["3-4 strong action-verb bullets with tools and results"]
  }],
  "projects": [{
    "name": "Clean Title Case Name (max 60 chars)",
    "description": "One clear sentence describing what it is and why it matters.",
    "tech": ["Tool1", "Tool2"],
    "bullets": ["3 bullets: what was built, how, and impact/result"]
  }],
  "skills": ["flat array of all skills, properly spelled and formatted"],
  "skillCategories": [{ "category": "Category Name", "items": ["Skill1", "Skill2"] }],
  "achievements": ["Award or milestone as a complete short sentence"],
  "languages": [{ "name": "string", "level": "Native|Fluent|Intermediate|Basic" }],
  "certifications": ["Certification Name | Issuer | Year"]
}`;
}

function buildLegacyPrompt(answers: string[]): string {
  return `You are a senior CV writer. Transform these raw answers into a CV JSON.
Fix all spelling. Use action verbs. Be specific.
Answers:
1. Full name: "${answers[0]}"
2. University and field: "${answers[1]}"
3. Graduation year and GPA: "${answers[2]}"
4. Best project: "${answers[3]}"
5. Tools used: "${answers[4]}"
6. Result/impact: "${answers[5]}"
7. Work experience: "${answers[6]}"
8. Skills: "${answers[7]}"
9. Languages: "${answers[8]}"
10. Links: "${answers[9] ?? "skip"}"

Return ONLY valid JSON: { fullName, email, phone, location, summary, education, experience, projects, skills, skillCategories, achievements, languages, certifications, links }`;
}

function extractJson(raw: string): string {
  // Strip markdown code fences
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Find the first { and last } to extract the JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.structured ? buildPrompt(body.structured) : buildLegacyPrompt(body.answers ?? []);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    console.log("Gemini raw response (first 300 chars):", raw.slice(0, 300));
    const text = extractJson(raw);
    const cv = JSON.parse(text);
    return NextResponse.json({ cv });
  } catch (e: any) {
    console.error("build-cv error:", e);
    return NextResponse.json({ error: "Failed to build CV", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
