import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CV, Job, MatchResult, LearningStep } from "./types";

// GEMINI_API_KEY_OVERRIDE takes precedence; falls back to hardcoded hackathon key then env var
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_OVERRIDE || "AIzaSyDNqF8HWBI7K1b4ItYsPZXYMTE8W24U6YQ"
);
const flash = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ─── Chat (CV builder interview) ──────────────────────────────────────────────
export async function chat(
  messages: { role: "user" | "ai"; text: string }[]
): Promise<{ done: boolean; reply?: string; cv?: CV }> {
  const SYSTEM = `You are Hired.jo, a friendly career coach helping a Jordanian graduate build a CV.
Ask ONE question at a time in a warm, conversational tone. Cover in order:
1. Full name
2. Email address
3. Phone number
4. City / location (e.g. Amman, Jordan)
5. University, degree, major, graduation year, GPA (optional)
6. Work experience — company, title, dates, key achievements (or "none")
7. Projects — name, what it does, tech stack, measurable outcome
8. Technical skills (comma list)
9. Languages spoken and level (Native / Fluent / Intermediate / Basic)
10. Certifications (or "none")

When you have collected everything, output "[CV_READY]" on its own line, then output ONLY a valid JSON object
(no markdown fences) that exactly matches this TypeScript type:

{
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: { degree: string; institution: string; startYear: number; endYear: number | "Present"; gpa?: string }[];
  experience: { title: string; company: string; startDate: string; endDate: string | "Present"; bullets: string[] }[];
  projects: { name: string; description: string; tech: string[]; link?: string; bullets: string[] }[];
  skills: string[];
  languages: { name: string; level: "Native" | "Fluent" | "Intermediate" | "Basic" }[];
  certifications: string[];
}

Write experience and project bullets as: action verb + specific deliverable + quantified impact.
Write the summary as a confident 2-sentence elevator pitch.
No placeholder text. No markdown in JSON string values.`;

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "ai" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.text }],
  }));

  const session = flash.startChat({
    history: [{ role: "user", parts: [{ text: SYSTEM }] }, ...history],
  });

  const last = messages[messages.length - 1].text;
  const r = await session.sendMessage(last);
  const text = r.response.text();

  if (text.includes("[CV_READY]")) {
    const raw = text.split("[CV_READY]")[1].trim().replace(/```json|```/g, "").trim();
    return { done: true, cv: JSON.parse(raw) as CV };
  }
  return { done: false, reply: text };
}

// ─── Roast CV ─────────────────────────────────────────────────────────────────
export async function roastCv(cv: CV): Promise<string> {
  const r = await flash.generateContent(
    `You are a brutally honest but hilarious Jordanian career coach. Roast this CV in 3-5 short punchy paragraphs.
Be specific to the person's actual content — no generic advice.
Reference real details: their company names, project titles, skill list, GPA, etc.
Be funny, be direct, but end with one genuine encouragement. Use markdown formatting.

CV: ${JSON.stringify(cv)}`
  );
  return r.response.text();
}

// ─── Match CV to Job ──────────────────────────────────────────────────────────
export async function matchCvToJob(cv: CV, job: Job): Promise<MatchResult> {
  const r = await flash.generateContent(
    `You are a technical recruiter. Compare this CV to the job listing and return ONLY valid JSON with no markdown fences.

Return this exact shape:
{
  "jobId": "${job.id}",
  "score": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "rewrittenSummary": "",
  "learningPlan": [{ "skill": "", "weeks": 2, "resources": [{ "title": "", "url": "", "provider": "" }] }]
}

Fill in:
- score: integer 0-100 based on skills overlap, seniority fit, sector relevance
- matchedSkills: skills from CV matching job requirements
- missingSkills: important job skills the CV lacks (max 5)
- rewrittenSummary: one sentence summary tailored for this specific role
- learningPlan: one entry per missing skill with 1-2 free learning resources (real URLs)

CV: ${JSON.stringify(cv)}
JOB: ${JSON.stringify(job)}`
  );

  const raw = r.response.text().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(raw);
  const learningPlan: LearningStep[] = (parsed.learningPlan ?? []).map(
    (step: { skill: string; weeks: number; resources: { title: string; url: string; provider: string }[] }) => ({
      skill: step.skill,
      weeks: step.weeks ?? 2,
      resources: (step.resources ?? []).map((res: { title: string; url: string; provider: string }) => ({
        title: res.title,
        url: res.url,
        provider: res.provider,
      })),
    })
  );
  return { ...parsed, learningPlan } as MatchResult;
}

// ─── Enrich Job ───────────────────────────────────────────────────────────────
export async function enrichJob(job: Job): Promise<Job> {
  const r = await flash.generateContent(
    `From this job posting, extract the following and return ONLY valid JSON with no markdown fences:
{
  "skills": ["skill1", "skill2"],
  "seniority": "Junior",
  "salaryMin": null,
  "salaryMax": null,
  "description": "one sentence summary"
}
Seniority must be one of: "Intern" | "Junior" | "Mid" | "Senior"
Salary in JOD integers or null.

JOB: ${JSON.stringify(job)}`
  );
  const enriched = JSON.parse(r.response.text().replace(/```json|```/g, "").trim());
  return { ...job, ...enriched };
}

// ─── Generate Cover Letter ────────────────────────────────────────────────────
export async function generateCoverLetter(cv: CV, job: Job): Promise<string> {
  const r = await flash.generateContent(
    `Write a tight, authentic cover letter (180-220 words) from ${cv.fullName} to the hiring manager at ${job.company} for the ${job.title} role in ${job.city}.

Rules:
- Open with a strong hook (NOT "I am writing to express my interest")
- Connect exactly 2 specific items from the CV to 2 specific job requirements
- Mention the company by name naturally in the body
- End with a polite call to a 20-minute interview
- No buzzwords like "passionate", "dynamic", "synergy"
- Plain text only — no markdown, no subject line, no "Dear Hiring Manager" header

CV: ${JSON.stringify(cv)}
JOB: ${JSON.stringify(job)}`
  );
  return r.response.text();
}
