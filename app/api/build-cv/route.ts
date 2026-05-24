import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";
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
        `  Project ${i + 1}: Name: ${p.name} | What it does: ${p.description} | Tools: ${p.tools} | Result/Impact: ${p.result}${p.github ? ` | GitHub: ${p.github}` : ""}`
      ).join("\n")
    : "  None provided";

  const certsBlock = Array.isArray(s.certifications) && s.certifications.length
    ? s.certifications.filter((c: any) => c.name).map((c: any) => `  ${c.name} | ${c.issuer} | ${c.year}`).join("\n")
    : "  None";

  const allSkills = [s.progLangs, s.frameworks, s.tools, s.networkingSkills].filter(Boolean).join(", ");

  return `You are a senior CV writer specializing in ATS-optimized resumes for students and recent graduates in Jordan and the Middle East.

Transform the raw user answers below into a polished, ATS-ready CV JSON. Fix all spelling and grammar silently. Use strong action verbs. Quantify impact wherever possible.

STRICT RULES:
- Never output placeholder text, "skip", "none", "n/a", "not applicable"
- Never start the summary with "I"
- Name: proper title case
- University: title case, institution name only (no major in institution field)
- Omit GPA if below 2.8 or not provided
- If experience is empty → return experience as []
- If certifications is empty → return certifications as []
- Template type is "${s.template}" — used for section ordering in frontend only

PROFESSIONAL SUMMARY (the "summary" field) — NOT an objective statement:
  - NEVER write "Seeking a position" or "I am looking for" — those are outdated objective statements
  - Write a PROFESSIONAL SUMMARY: 2 sharp sentences that sell the candidate
  - Sentence 1: Degree + university + graduation year + GPA (if >= 2.8) + target role
  - Sentence 2: Top 3-5 specific tools/skills + single most impressive achievement with numbers
  - Example: "Computer Engineering graduate from Hashemite University (2026, GPA 3.4) targeting a Network Engineer role with expertise in Python, SQL, and Cisco network design. Developed an autonomous agriculture drone using YOLOv8 and Flutter, winning 1st place at HU Grad Projects 2026."

EXPERIENCE BULLETS — STAR format, 3-4 bullets per role:
  - Format: [Strong action verb] + [specific task with tool named] + [quantified result]
  - Example: "Engineered a RESTful API using Node.js, reducing average response time by 40% for 1,000+ daily users"
  - If description is vague, infer realistic professional duties for that role/industry
  - Every bullet must start with a past-tense action verb (Built, Developed, Designed, Led, Reduced, Increased...)

PROJECT BULLETS — 3 bullets per project:
  - Bullet 1: What was built + primary tools used
  - Bullet 2: Technical approach, architecture, or challenge solved
  - Bullet 3: Result/impact with numbers (use user's numbers; if none, describe value delivered)
  - If GitHub link provided, include it in the project's github field

SKILLS — categorize based on what the user provided:
  - "Programming Languages": from progLangs field
  - "Frameworks & Libraries": from frameworks field
  - "Tools & Platforms": from tools field
  - "Networking & Systems": from networkingSkills field (if provided)
  - "Soft Skills": from softSkills field (if provided)
  - Only include categories that have content

CERTIFICATIONS — format each as "Name | Issuer | Year". Return as string array.

ACHIEVEMENTS — combine awards + volunteering into one achievements array. Each as a complete short sentence.

RELEVANT COURSEWORK — if coursework is provided, return as string array under education.

LINKS — build from separate linkedin, github, portfolio fields. Label each by platform.

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
  Programming Languages: "${s.progLangs || "none"}"
  Frameworks & Libraries: "${s.frameworks || "none"}"
  Tools & Platforms: "${s.tools || "none"}"
  Networking & Other Technical: "${s.networkingSkills || "none"}"
  Soft Skills: "${s.softSkills || "none"}"
  Certifications:
${certsBlock}
  Awards & Competitions: "${s.awards || "none"}"
  Volunteering: "${s.volunteering || "none"}"
  Relevant Coursework: "${s.coursework || "none"}"
  Languages: "${s.languages}"
  LinkedIn: "${s.linkedin || "none"}"
  GitHub: "${s.github || "none"}"
  Portfolio: "${s.portfolio || "none"}"

Return ONLY valid JSON with NO markdown and NO code blocks:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "links": [{ "label": "GitHub|LinkedIn|Portfolio|Behance", "url": "string" }],
  "summary": "2 sharp sentences. Professional summary. No I. No seeking. Specific tools and achievements.",
  "education": [{
    "degree": "B.Sc. in [Full Major Name]",
    "institution": "University Name Only",
    "startYear": number,
    "endYear": number,
    "gpa": "string or omit if below 2.8",
    "coursework": ["Relevant Course 1", "Relevant Course 2"]
  }],
  "experience": [{
    "title": "Job Title",
    "company": "Company Name",
    "startDate": "MMM YYYY",
    "endDate": "MMM YYYY or Present",
    "bullets": ["3-4 STAR-format bullets: action verb + task + quantified result"]
  }],
  "projects": [{
    "name": "Clean Title Case Name",
    "description": "One clear sentence describing what it is and why it matters.",
    "tech": ["Tool1", "Tool2"],
    "github": "url or empty string",
    "bullets": ["3 bullets: what built, how, impact/result"]
  }],
  "skills": ["flat array of all skills combined"],
  "skillCategories": [{ "category": "Programming Languages|Frameworks & Libraries|Tools & Platforms|Networking & Systems|Soft Skills", "items": ["Skill1", "Skill2"] }],
  "achievements": ["Complete sentence describing award, placement, or volunteering"],
  "languages": [{ "name": "string", "level": "Native|Fluent|Professional|Intermediate|Basic" }],
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

    // Require auth — no anonymous builds
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    // Check usage limit
    const { allowed } = await checkLimit(user.id, "cv_builds");
    if (!allowed) {
      return NextResponse.json(
        { error: "limit_reached", key: "cv_builds", remaining: 0 },
        { status: 402 }
      );
    }

    const prompt = body.structured ? buildPrompt(body.structured) : buildLegacyPrompt(body.answers ?? []);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    console.log("Gemini raw response (first 300 chars):", raw.slice(0, 300));
    const text = extractJson(raw);
    const cv = JSON.parse(text);
    if (user) await incrementUsage(user.id, "cv_builds");
    return NextResponse.json({ cv });
  } catch (e: any) {
    console.error("build-cv error:", e);
    return NextResponse.json({ error: "Failed to build CV", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
