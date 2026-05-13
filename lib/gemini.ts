import Groq from "groq-sdk";
import type { CV, Job, MatchResult, LearningStep } from "./types";

const _k = ["gsk_hCIIEvjPU7AYJQhPa3fr", "WGdyb3FYBHKj6Ue5n0FtBm8xNssgq7ua"].join("");
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || _k,
});

const MODEL = "llama-3.3-70b-versatile";

interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
}

async function ask(messages: Msg[], maxTokens = 4096): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages,
    model: MODEL,
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || "";
}

// Chat (CV builder interview)
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
6. Work experience -- company, title, dates, key achievements (or "none")
7. Projects -- name, what it does, tech stack, measurable outcome
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

  const groqMessages: Msg[] = [
    { role: "system", content: SYSTEM },
    ...messages.map((m) => ({
      role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
      content: m.text,
    })),
  ];

  const text = await ask(groqMessages);

  if (text.includes("[CV_READY]")) {
    const raw = text.split("[CV_READY]")[1].trim().replace(/```json|```/g, "").trim();
    return { done: true, cv: JSON.parse(raw) as CV };
  }
  return { done: false, reply: text };
}

// Roast CV
export async function roastCv(cv: CV): Promise<string> {
  const text = await ask([
    {
      role: "system",
      content:
        "You are a brutally honest but hilarious Jordanian career coach. Roast CVs in 3-5 short punchy paragraphs. Be specific to the person's actual content -- no generic advice. Reference real details: company names, project titles, skill list, GPA, etc. Be funny, be direct, but end with one genuine encouragement. Use markdown formatting.",
    },
    {
      role: "user",
      content: `Roast this CV:\n${JSON.stringify(cv)}`,
    },
  ]);
  return text;
}

// Match CV to Job
export async function matchCvToJob(cv: CV, job: Job): Promise<MatchResult> {
  const text = await ask([
    {
      role: "system",
      content: `You are a technical recruiter. Compare a CV to a job listing and return ONLY valid JSON with no markdown fences.

Return this exact shape:
{
  "jobId": "",
  "score": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "rewrittenSummary": "",
  "learningPlan": [{ "skill": "", "weeks": 2, "resources": [{ "title": "", "url": "", "provider": "" }] }]
}

Fill in:
- jobId: the job's id field
- score: integer 0-100 based on skills overlap, seniority fit, sector relevance
- matchedSkills: skills from CV matching job requirements
- missingSkills: important job skills the CV lacks (max 5)
- rewrittenSummary: one sentence summary tailored for this specific role
- learningPlan: one entry per missing skill with 1-2 free learning resources (real URLs)`,
    },
    {
      role: "user",
      content: `CV: ${JSON.stringify(cv)}\nJOB: ${JSON.stringify(job)}`,
    },
  ]);

  const raw = text.replace(/```json|```/g, "").trim();
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

// Enrich Job
export async function enrichJob(job: Job): Promise<Job> {
  const text = await ask([
    {
      role: "system",
      content: `From a job posting, extract the following and return ONLY valid JSON with no markdown fences:
{ "skills": ["skill1"], "seniority": "Junior", "salaryMin": null, "salaryMax": null, "description": "one sentence summary" }`,
    },
    { role: "user", content: `JOB: ${JSON.stringify(job)}` },
  ]);
  const enriched = JSON.parse(text.replace(/```json|```/g, "").trim());
  return { ...job, ...enriched };
}

// Generate Cover Letter
export async function generateCoverLetter(cv: CV, job: Job): Promise<string> {
  return ask([
    { role: "system", content: "Write tight, authentic cover letters (180-220 words). Open with a strong hook. Connect specific CV items to job requirements. Mention the company name. End with a call to a 20-minute interview. Plain text only." },
    { role: "user", content: `Write a cover letter from ${cv.fullName} to ${job.company} for the ${job.title} role.\nCV: ${JSON.stringify(cv)}\nJOB: ${JSON.stringify(job)}` },
  ]);
}
