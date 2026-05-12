import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const PROMPT = (answers: string[]) => `
You are a senior CV writer specializing in ATS-optimized resumes for students and recent graduates in the Middle East.

The user answered 10 questions. Their input may contain typos, casual language, incomplete sentences, or vague descriptions. Your job is to transform this raw input into a STRONG, SPECIFIC, ATS-ready CV.

STRICT RULES:
- Fix ALL spelling/grammar silently (e.g. "pythin"→"Python", "creatve"→"Creative", "photoshoop"→"Photoshop")
- Detect the user's field from context (photography, engineering, design, business, medicine, law, etc.)
- NEVER output placeholder text: no "my field", "skip", "none", "n/a", "not applicable"
- NEVER start the summary with "I"
- Name: proper title case
- University: title case, institution name only (no major in institution field)
- Omit GPA if below 2.8 or not provided
- If experience is "none"/"no"/"skip" → return empty array []
- If tools is "skip"/"n/a" → return empty tech array []

SUMMARY — must be 3 sentences, rich and specific:
  Sentence 1: Field + university + graduating year + GPA (if provided)
  Sentence 2: Top tools/skills/specializations from their answers — be SPECIFIC, use real tool names
  Sentence 3: Most impressive achievement or result (use numbers if available) + what role they're targeting

EXPERIENCE BULLETS — minimum 4 bullets per role, each starting with a strong action verb:
  - Describe WHAT they did (specific tasks, not vague)
  - Mention tools/software used
  - Include any numbers, scale, or results
  - Cover responsibilities AND achievements
  - If the user gave vague experience, infer realistic duties for that role/field

PROJECT BULLETS — minimum 3 bullets per project:
  - One bullet for what was built/created (with tools)
  - One bullet for the process or technical challenge
  - One or more bullets for results/impact (use numbers if given)
  - Use field-specific keywords (e.g. for photography: cinematography, color grading, post-production, visual storytelling)

SKILLS — group into categories:
  - For tech: Programming Languages, Frameworks, Tools, Databases
  - For creative: Software, Equipment, Creative Skills
  - For business: Technical, Analytical, Communication
  Keep flat skills array too (all items combined)

ACHIEVEMENTS — extract any awards, recognition, milestones, or impressive numbers as standalone achievements

LINKS — parse from answer 10. Identify platform from URL pattern or label. Skip if "none"/"skip".

Questions and answers:
1. Full name: "${answers[0]}"
2. University and field: "${answers[1]}"
3. Graduation year and GPA: "${answers[2]}"
4. Best project or work: "${answers[3]}"
5. Tools/devices/software used: "${answers[4]}"
6. Result or impact: "${answers[5]}"
7. Work experience: "${answers[6]}"
8. Skills: "${answers[7]}"
9. Languages: "${answers[8]}"
10. Portfolio/links: "${answers[9] ?? "skip"}"

Return ONLY a valid JSON object, NO markdown, NO code blocks:
{
  "fullName": "string",
  "email": "",
  "phone": "",
  "location": "Amman, Jordan",
  "links": [{ "label": "Portfolio|Behance|LinkedIn|GitHub|YouTube", "url": "string" }],
  "summary": "3 rich sentences. Specific tools, achievements, target role. No 'I'. No placeholders.",
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
    "startDate": "MM/YYYY",
    "endDate": "MM/YYYY or Present",
    "bullets": ["4+ action-verb bullets. Specific. Tools named. Results included."]
  }],
  "projects": [{
    "name": "Clean Title Case Name (max 60 chars)",
    "description": "One clear sentence: what it is and why it matters.",
    "tech": ["Tool1", "Tool2"],
    "bullets": ["3+ bullets: what was built, how, and what impact/result"]
  }],
  "skills": ["flat array of all skills, properly spelled"],
  "skillCategories": [{ "category": "Category Name", "items": ["Skill1", "Skill2"] }],
  "achievements": ["Award or recognition", "Metric achievement", "Notable milestone"],
  "languages": [{ "name": "string", "level": "Native|Fluent|Intermediate|Basic" }],
  "certifications": []
}
`;

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    const result = await model.generateContent(PROMPT(answers));
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const cv = JSON.parse(text);
    return NextResponse.json({ cv });
  } catch (e) {
    console.error("build-cv error:", e);
    return NextResponse.json({ error: "Failed to build CV" }, { status: 500 });
  }
}
