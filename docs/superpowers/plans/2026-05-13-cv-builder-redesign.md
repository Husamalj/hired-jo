# CV Builder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the CV builder chat flow with clear guided questions, multi-project support, two ATS templates (Fresher/Experienced), Gemini rewriting all answers at the end, and a working PDF download.

**Architecture:** Replace the flat QUESTIONS array in `app/build/page.tsx` with a dynamic step machine that adapts based on template type and loops for projects/experience. The API route `app/api/build-cv/route.ts` receives a structured answers object. `components/CvPreview.tsx` renders two distinct layouts and generates a complete PDF.

**Tech Stack:** Next.js App Router, TypeScript, jsPDF, Google Gemini 2.0 Flash, existing `CV` type from `lib/types.ts`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `app/build/page.tsx` | Modify | Full rewrite of question state machine, remove old flat QUESTIONS array |
| `app/api/build-cv/route.ts` | Modify | Accept structured answers object, update Gemini prompt for multi-project + new fields |
| `components/CvPreview.tsx` | Modify | Two template layouts, fix PDF to include all sections (projects, certs, extras, links) |

---

## Task 1: Rewrite the question state machine in `app/build/page.tsx`

**Files:**
- Modify: `app/build/page.tsx`

### What the new flow looks like

The chat asks one question at a time. Questions adapt based on answers. Projects loop up to 4. Experience loops up to 3.

**Step sequence:**
1. Full name — *e.g. Ahmad Khalid Al-Masri*
2. Phone — *e.g. 0791234567*
3. Email — *e.g. ahmad@gmail.com*
4. City & country — *e.g. Amman, Jordan* (or skip → defaults to Amman, Jordan)
5. University & major — *e.g. Hashemite University, Computer Engineering*
6. Graduation year + GPA — *e.g. 2026, 3.7 — type "skip" to omit GPA*
7. Target job role — *e.g. Junior Software Engineer, Data Analyst, Graphic Designer*
8. **Template detection:** "Do you have any jobs or internships?" → YES button / NO button
   - YES → template = "experienced", go to experience loop
   - NO → template = "fresher", skip to step asking "Did you do any short internships?" (same experience loop but lighter framing)
9. **Experience loop** (up to 3, one at a time):
   - 9a. Company name — *e.g. Mawdoo3*
   - 9b. Your role/title — *e.g. Software Engineering Intern*
   - 9c. Dates — *e.g. Jun 2024 – Aug 2024*
   - 9d. What you did + any results — *e.g. built an internal dashboard used by 50 employees, reduced reporting time by 30%*
   - 9e. "Do you have another job or internship?" → YES / NO (loop back to 9a or continue)
10. **Project loop** (1 to 4, one at a time):
    - 10a. Project name — *just the name, e.g. Attendance App*
    - 10b. What does it do? — *one sentence, e.g. A mobile app that tracks student attendance using QR codes*
    - 10c. Tools/tech used — *e.g. Flutter, Firebase, Python — or type "skip"*
    - 10d. Result or impact — *e.g. 300 active users, won 1st place — or type "skip"*
    - 10e. "Do you have another project?" → YES / NO (loop up to 4 total)
11. Technical skills — *list them separated by commas, e.g. Python, React, Figma, SQL*
12. Soft skills — *e.g. Teamwork, Leadership, Communication — or type "skip"*
13. Certifications — *e.g. Google Data Analytics | Google | 2024 — or type "skip"*
14. Extras — *awards, hackathons, volunteering, e.g. 1st place HU Hackathon 2025, volunteer tutor — or type "skip"*
15. Languages — *e.g. Arabic (Native), English (Professional)*
16. Links — *GitHub, LinkedIn, portfolio URL — or type "skip"*

### Data structure to collect

```typescript
type StructuredAnswers = {
  template: "fresher" | "experienced";
  name: string;
  phone: string;
  email: string;
  location: string;
  university: string;
  major: string;
  gradYear: string;
  gpa: string;
  targetRole: string;
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    tools: string;
    result: string;
  }>;
  technicalSkills: string;
  softSkills: string;
  certifications: string;
  extras: string;
  languages: string;
  links: string;
};
```

### Step machine approach

Use a flat `stepId` string instead of a number. Compute the next `stepId` dynamically based on collected answers.

```typescript
type StepId =
  | "name" | "phone" | "email" | "location"
  | "university" | "major" | "gradYear" | "targetRole"
  | "hasExperience"
  | `exp_company_${number}` | `exp_role_${number}` | `exp_dates_${number}` | `exp_desc_${number}` | `exp_more_${number}`
  | `proj_name_${number}` | `proj_desc_${number}` | `proj_tools_${number}` | `proj_result_${number}` | `proj_more_${number}`
  | "techSkills" | "softSkills" | "certifications" | "extras" | "languages" | "links"
  | "done";
```

Define a function `getQuestion(stepId, answers)` that returns the question text and optional hint for each step.

### Implementation steps

- [ ] **Step 1: Replace state in `app/build/page.tsx`**

Replace the top of the file. Remove the old `QUESTIONS` array, `step: number`, and `answers: string[]`. Add:

```typescript
type StructuredAnswers = {
  template: "fresher" | "experienced";
  name: string; phone: string; email: string; location: string;
  university: string; gradYear: string; targetRole: string;
  experience: Array<{ company: string; role: string; dates: string; description: string }>;
  projects: Array<{ name: string; description: string; tools: string; result: string }>;
  technicalSkills: string; softSkills: string;
  certifications: string; extras: string; languages: string; links: string;
};

type StepId =
  | "name" | "phone" | "email" | "location" | "university" | "gradYear" | "targetRole"
  | "hasExperience"
  | `exp_company_${number}` | `exp_role_${number}` | `exp_dates_${number}` | `exp_desc_${number}` | `exp_more_${number}`
  | `proj_name_${number}` | `proj_desc_${number}` | `proj_tools_${number}` | `proj_result_${number}` | `proj_more_${number}`
  | "techSkills" | "softSkills" | "certifications" | "extras" | "languages" | "links" | "done";

const INITIAL_ANSWERS: StructuredAnswers = {
  template: "fresher", name: "", phone: "", email: "", location: "",
  university: "", gradYear: "", targetRole: "",
  experience: [], projects: [],
  technicalSkills: "", softSkills: "",
  certifications: "", extras: "", languages: "", links: "",
};
```

Then in the component:
```typescript
const [stepId, setStepId] = useState<StepId>("name");
const [data, setData] = useState<StructuredAnswers>(INITIAL_ANSWERS);
const [expIndex, setExpIndex] = useState(0);
const [projIndex, setProjIndex] = useState(0);
```

- [ ] **Step 2: Write `getQuestion(stepId)` — returns `{ question: string; hint: string }`**

Add this function above the component:

```typescript
function getQuestion(stepId: StepId): { question: string; hint: string } {
  if (stepId === "name") return { question: "What's your full name?", hint: "e.g. Ahmad Khalid Al-Masri" };
  if (stepId === "phone") return { question: "What's your phone number?", hint: "e.g. 0791234567" };
  if (stepId === "email") return { question: "What's your email address?", hint: "e.g. ahmad@gmail.com" };
  if (stepId === "location") return { question: "What city and country are you in?", hint: 'e.g. Amman, Jordan — or type "skip" to use Amman, Jordan' };
  if (stepId === "university") return { question: "Which university are you at, and what's your major?", hint: "e.g. Hashemite University, Computer Engineering" };
  if (stepId === "gradYear") return { question: "When do you graduate, and what's your GPA?", hint: 'e.g. 2026, 3.7 — type "skip GPA" if you\'d rather not include it' };
  if (stepId === "targetRole") return { question: "What job role are you targeting?", hint: "e.g. Junior Software Engineer, Data Analyst, Graphic Designer" };
  if (stepId === "hasExperience") return { question: "Do you have any jobs or internships?", hint: "Tap YES or NO below" };

  const expMatch = stepId.match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idx] = expMatch;
    const n = parseInt(idx) + 1;
    if (sub === "company") return { question: `Internship/Job ${n}: What's the company name?`, hint: "e.g. Mawdoo3, Zain, Orange Jordan" };
    if (sub === "role") return { question: `What was your role or title there?`, hint: "e.g. Software Engineering Intern, Marketing Assistant" };
    if (sub === "dates") return { question: `When did you work there?`, hint: "e.g. Jun 2024 – Aug 2024, or Summer 2025" };
    if (sub === "desc") return { question: `What did you do there? Any results or numbers?`, hint: "e.g. built an internal dashboard used by 50 employees, reduced report time by 30%" };
    if (sub === "more") return { question: `Do you have another job or internship to add?`, hint: `You've added ${n} so far (max 3). Tap YES or NO.` };
  }

  const projMatch = stepId.match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idx] = projMatch;
    const n = parseInt(idx) + 1;
    if (sub === "name") return { question: `Project ${n}: What's the name of your project?`, hint: "Just the name, e.g. Attendance App, Portfolio Website, AI Traffic Model" };
    if (sub === "desc") return { question: `What does it do? Describe it in one sentence.`, hint: "e.g. A mobile app that tracks student attendance using QR codes" };
    if (sub === "tools") return { question: `What tools or technologies did you use?`, hint: 'e.g. Flutter, Firebase, Python — or type "skip"' };
    if (sub === "result") return { question: `What was the result or impact?`, hint: 'e.g. 300 active users, won 1st place at HU hackathon — or type "skip"' };
    if (sub === "more") return { question: `Do you have another project to add?`, hint: `You've added ${n} so far (max 4). Tap YES or NO.` };
  }

  if (stepId === "techSkills") return { question: "List your technical skills, separated by commas.", hint: "e.g. Python, React, Figma, SQL, Adobe Premiere" };
  if (stepId === "softSkills") return { question: "Any soft skills to add?", hint: 'e.g. Teamwork, Leadership, Public Speaking — or type "skip"' };
  if (stepId === "certifications") return { question: "Do you have any certifications?", hint: 'e.g. Google Data Analytics | Google | 2024 — or type "skip"' };
  if (stepId === "extras") return { question: "Any awards, hackathons, or volunteering to highlight?", hint: 'e.g. 1st place HU Hackathon 2025, volunteer tutor at local school — or type "skip"' };
  if (stepId === "languages") return { question: "What languages do you speak and at what level?", hint: "e.g. Arabic (Native), English (Professional), French (Basic)" };
  if (stepId === "links") return { question: "Do you have a GitHub, LinkedIn, or portfolio link?", hint: 'Paste one or more links — or type "skip"' };
  return { question: "All done!", hint: "" };
}
```

- [ ] **Step 3: Write `getNextStep(stepId, answer, data, expIndex, projIndex)` — returns next StepId**

```typescript
function isSkipAnswer(s: string) {
  return /^(skip|none|no|n\/a|-)$/i.test(s.trim());
}

function getNextStep(
  stepId: StepId,
  answer: string,
  data: StructuredAnswers,
  expIndex: number,
  projIndex: number
): StepId {
  if (stepId === "name") return "phone";
  if (stepId === "phone") return "email";
  if (stepId === "email") return "location";
  if (stepId === "location") return "university";
  if (stepId === "university") return "gradYear";
  if (stepId === "gradYear") return "targetRole";
  if (stepId === "targetRole") return "hasExperience";
  if (stepId === "hasExperience") {
    const yes = /^yes$/i.test(answer.trim());
    return yes ? `exp_company_0` : `proj_name_0`;
  }

  const expMatch = stepId.match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idxStr] = expMatch;
    const idx = parseInt(idxStr);
    if (sub === "company") return `exp_role_${idx}`;
    if (sub === "role") return `exp_dates_${idx}`;
    if (sub === "dates") return `exp_desc_${idx}`;
    if (sub === "desc") return `exp_more_${idx}`;
    if (sub === "more") {
      const addMore = /^yes$/i.test(answer.trim());
      const nextIdx = idx + 1;
      if (addMore && nextIdx < 3) return `exp_company_${nextIdx}`;
      return `proj_name_0`;
    }
  }

  const projMatch = stepId.match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idxStr] = projMatch;
    const idx = parseInt(idxStr);
    if (sub === "name") return `proj_desc_${idx}`;
    if (sub === "desc") return `proj_tools_${idx}`;
    if (sub === "tools") return `proj_result_${idx}`;
    if (sub === "result") return `proj_more_${idx}`;
    if (sub === "more") {
      const addMore = /^yes$/i.test(answer.trim());
      const nextIdx = idx + 1;
      if (addMore && nextIdx < 4) return `proj_name_${nextIdx}`;
      return "techSkills";
    }
  }

  if (stepId === "techSkills") return "softSkills";
  if (stepId === "softSkills") return "certifications";
  if (stepId === "certifications") return "extras";
  if (stepId === "extras") return "languages";
  if (stepId === "languages") return "links";
  if (stepId === "links") return "done";
  return "done";
}
```

- [ ] **Step 4: Write `applyAnswer(stepId, answer, data, expIndex, projIndex)` — returns updated data**

```typescript
function applyAnswer(
  stepId: StepId,
  answer: string,
  data: StructuredAnswers,
  expIndex: number,
  projIndex: number
): StructuredAnswers {
  const d = { ...data };
  if (stepId === "name") return { ...d, name: answer };
  if (stepId === "phone") return { ...d, phone: answer };
  if (stepId === "email") return { ...d, email: answer };
  if (stepId === "location") return { ...d, location: isSkipAnswer(answer) ? "Amman, Jordan" : answer };
  if (stepId === "university") return { ...d, university: answer };
  if (stepId === "gradYear") return { ...d, gradYear: answer };
  if (stepId === "targetRole") return { ...d, targetRole: answer };
  if (stepId === "hasExperience") return { ...d, template: /^yes$/i.test(answer.trim()) ? "experienced" : "fresher" };

  const expMatch = stepId.match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idxStr] = expMatch;
    const idx = parseInt(idxStr);
    const exps = [...d.experience];
    if (!exps[idx]) exps[idx] = { company: "", role: "", dates: "", description: "" };
    if (sub === "company") exps[idx] = { ...exps[idx], company: answer };
    if (sub === "role") exps[idx] = { ...exps[idx], role: answer };
    if (sub === "dates") exps[idx] = { ...exps[idx], dates: answer };
    if (sub === "desc") exps[idx] = { ...exps[idx], description: answer };
    return { ...d, experience: exps };
  }

  const projMatch = stepId.match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idxStr] = projMatch;
    const idx = parseInt(idxStr);
    const projs = [...d.projects];
    if (!projs[idx]) projs[idx] = { name: "", description: "", tools: "", result: "" };
    if (sub === "name") projs[idx] = { ...projs[idx], name: answer };
    if (sub === "desc") projs[idx] = { ...projs[idx], description: answer };
    if (sub === "tools") projs[idx] = { ...projs[idx], tools: answer };
    if (sub === "result") projs[idx] = { ...projs[idx], result: answer };
    return { ...d, projects: projs };
  }

  if (stepId === "techSkills") return { ...d, technicalSkills: answer };
  if (stepId === "softSkills") return { ...d, softSkills: answer };
  if (stepId === "certifications") return { ...d, certifications: answer };
  if (stepId === "extras") return { ...d, extras: answer };
  if (stepId === "languages") return { ...d, languages: answer };
  if (stepId === "links") return { ...d, links: answer };
  return d;
}
```

- [ ] **Step 5: Rewrite the `send()` function and YES/NO button rendering**

The `send()` function now calls `applyAnswer`, then `getNextStep`, updates indices, and when `stepId === "done"` calls the API.

```typescript
async function send(rawAnswer?: string) {
  const text = (rawAnswer ?? input).trim();
  if (!text || thinking) return;

  const newData = applyAnswer(stepId, text, data, expIndex, projIndex);
  setData(newData);

  const newMsgs: Msg[] = [...msgs, { role: "user", text }];
  setMsgs(newMsgs);
  setInput("");

  // Update indices for loops
  const expMatch = stepId.match(/^exp_(\w+)_(\d+)$/);
  const projMatch = stepId.match(/^proj_(\w+)_(\d+)$/);
  if (expMatch) setExpIndex(parseInt(expMatch[2]));
  if (projMatch) setProjIndex(parseInt(projMatch[2]));

  const nextStep = getNextStep(stepId, text, newData, expIndex, projIndex);
  setStepId(nextStep);

  if (nextStep === "done") {
    setThinking(true);
    try {
      const res = await fetch("/api/build-cv", {
        method: "POST",
        body: JSON.stringify({ structured: newData }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      setThinking(false);
      if (result.cv) {
        setMsgs(prev => [...prev, { role: "ai", text: "Your CV is ready! Review it below." }]);
        setCv(result.cv);
      } else throw new Error("no cv");
    } catch {
      setThinking(false);
      setMsgs(prev => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    }
    return;
  }

  setThinking(true);
  await new Promise(r => setTimeout(r, 400));
  setThinking(false);
  const { question, hint } = getQuestion(nextStep);
  const msg = hint ? `${question}\n\n_${hint}_` : question;
  setMsgs(prev => [...prev, { role: "ai", text: msg }]);
}
```

Render YES/NO buttons when stepId is `hasExperience`, `exp_more_*`, or `proj_more_*`:

```tsx
{(stepId === "hasExperience" || stepId.startsWith("exp_more") || stepId.startsWith("proj_more")) && !cv && (
  <div className="flex gap-3 mb-3">
    <button onClick={() => send("yes")} className="gold-grad text-black font-bold px-6 py-2.5 rounded-xl">
      Yes
    </button>
    <button onClick={() => send("no")} className="bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-white/20">
      No
    </button>
  </div>
)}
```

- [ ] **Step 6: Compute progress bar from stepId**

Replace the old `progress` calculation:

```typescript
const ALL_STEPS: StepId[] = [
  "name","phone","email","location","university","gradYear","targetRole","hasExperience",
  "techSkills","softSkills","certifications","extras","languages","links"
];
const baseTotal = ALL_STEPS.length + (data.experience.length * 4) + (data.projects.length * 4);
const baseCompleted = ALL_STEPS.indexOf(stepId as any) < 0
  ? ALL_STEPS.length
  : ALL_STEPS.indexOf(stepId as any);
const progress = Math.min((baseCompleted / baseTotal) * 100, 95);
```

- [ ] **Step 7: Show first question on mount**

Replace the `useEffect` that shows the first question:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    const { question, hint } = getQuestion("name");
    setMsgs(prev => [...prev, { role: "ai", text: hint ? `${question}\n\n_${hint}_` : question }]);
  }, 700);
  return () => clearTimeout(timer);
}, []);
```

- [ ] **Step 8: Commit**

```bash
git add app/build/page.tsx
git commit -m "feat: rewrite CV builder question flow with multi-project loop and template detection"
```

---

## Task 2: Update `app/api/build-cv/route.ts` to accept structured answers

**Files:**
- Modify: `app/api/build-cv/route.ts`

- [ ] **Step 1: Rewrite the route to accept `structured` object and build a new prompt**

Replace the entire file:

```typescript
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function buildPrompt(s: any): string {
  const experienceBlock = s.experience?.length
    ? s.experience.map((e: any, i: number) => `  Experience ${i+1}: ${e.company} | ${e.role} | ${e.dates} | ${e.description}`).join("\n")
    : "  None";

  const projectsBlock = s.projects?.length
    ? s.projects.map((p: any, i: number) => `  Project ${i+1}: Name: ${p.name} | What: ${p.description} | Tools: ${p.tools} | Result: ${p.result}`).join("\n")
    : "  None";

  return `You are a senior CV writer specializing in ATS-optimized resumes for students and graduates in Jordan.

Transform the raw user answers below into a professional CV JSON. Fix all spelling/grammar silently. Use strong action verbs. Quantify impact wherever possible.

RULES:
- Never output placeholder text, "skip", "none", "n/a"
- Never start summary with "I"
- Name: proper title case
- University: title case, institution name only
- Omit GPA if below 2.8 or not provided
- If experience/skills/etc is "none"/"skip" → return empty array []
- Template type is "${s.template}" — used for section ordering in frontend, not your concern
- Certifications: parse "Name | Issuer | Year" format, return as flat string array
- Extras: parse awards, hackathons, volunteering into achievements array

OBJECTIVE (summary field) — 2 sentences:
  Sentence 1: Degree + university + graduating year + GPA if >= 2.8 + target role
  Sentence 2: Top 3-5 skills/tools + most impressive achievement with numbers

EXPERIENCE BULLETS — 3-4 bullets per role, each starting with action verb (Built, Developed, Designed, Managed, Collaborated, Reduced, Increased):
  - Specific tasks with tools named
  - Quantified results when user provided numbers
  - If vague, infer realistic duties for that role

PROJECT BULLETS — 3 bullets per project:
  - What was built + tools used
  - Technical approach or challenge solved
  - Result/impact (use user's numbers if given)

SKILLS — group into categories relevant to their field:
  Tech: Programming Languages | Frameworks & Libraries | Tools & Platforms | Databases
  Creative: Software | Equipment | Creative Skills
  Business: Technical | Analytical | Communication
  Keep flat skills array too.

User data:
  Name: "${s.name}"
  Phone: "${s.phone}"
  Email: "${s.email}"
  Location: "${s.location}"
  University: "${s.university}"
  Graduation year + GPA: "${s.gradYear}"
  Target role: "${s.targetRole}"
${experienceBlock ? `  Experience:\n${experienceBlock}` : "  Experience: None"}
  Projects:
${projectsBlock}
  Technical skills: "${s.technicalSkills}"
  Soft skills: "${s.softSkills}"
  Certifications: "${s.certifications}"
  Extras (awards/hackathons/volunteering): "${s.extras}"
  Languages: "${s.languages}"
  Links: "${s.links}"

Return ONLY valid JSON, NO markdown, NO code blocks:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "links": [{ "label": "GitHub|LinkedIn|Portfolio|Behance|YouTube", "url": "string" }],
  "summary": "2 rich sentences. Specific. No I. No placeholders.",
  "education": [{
    "degree": "B.Sc. in [Full Major]",
    "institution": "University Name Only",
    "startYear": number,
    "endYear": number,
    "gpa": "string or omit"
  }],
  "experience": [{
    "title": "Job Title",
    "company": "Company",
    "startDate": "MMM YYYY",
    "endDate": "MMM YYYY or Present",
    "bullets": ["3-4 action-verb bullets"]
  }],
  "projects": [{
    "name": "Clean Title Case (max 60 chars)",
    "description": "One sentence what it is.",
    "tech": ["Tool1", "Tool2"],
    "bullets": ["3 bullets: built, how, impact"]
  }],
  "skills": ["flat array, properly spelled"],
  "skillCategories": [{ "category": "Category", "items": ["Skill1", "Skill2"] }],
  "achievements": ["Award or milestone"],
  "languages": [{ "name": "string", "level": "Native|Fluent|Intermediate|Basic" }],
  "certifications": ["Certification Name | Issuer | Year"]
}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support both old `answers` array and new `structured` object
    const prompt = body.structured ? buildPrompt(body.structured) : buildLegacyPrompt(body.answers);
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const cv = JSON.parse(text);
    return NextResponse.json({ cv });
  } catch (e) {
    console.error("build-cv error:", e);
    return NextResponse.json({ error: "Failed to build CV" }, { status: 500 });
  }
}

// Keep old prompt as fallback so CvBulkForm still works
function buildLegacyPrompt(answers: string[]): string {
  return `You are a senior CV writer. Transform these 10 raw answers into a CV JSON.
Questions and answers:
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

Return ONLY valid JSON matching the CV type: { fullName, email, phone, location, summary, education, experience, projects, skills, skillCategories, achievements, languages, certifications, links }`;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/build-cv/route.ts
git commit -m "feat: update build-cv API to accept structured answers with multi-project support"
```

---

## Task 3: Fix CvPreview — two template layouts + working PDF

**Files:**
- Modify: `components/CvPreview.tsx`

The CV type does not have a `template` field — the frontend determines layout from `cv.experience.length > 0`. If experience exists → Experienced layout (Experience first). If no experience → Fresher layout (Skills first).

### Fresher section order (Skills-First):
OBJECTIVE → SKILLS → PROJECTS → INTERNSHIPS (if any) → EDUCATION → CERTIFICATIONS → EXTRAS/ACHIEVEMENTS → LANGUAGES

### Experienced section order (Chronological):
OBJECTIVE → EXPERIENCE → PROJECTS → SKILLS → EDUCATION → CERTIFICATIONS → EXTRAS/ACHIEVEMENTS → LANGUAGES

### PDF must include ALL sections:
Currently the PDF is missing: Projects, Certifications, Achievements/Extras, Links in header, Summary/Objective. Fix all of these.

- [ ] **Step 1: Replace `downloadPdf()` in `CvPreview.tsx` with a complete rewrite**

The current PDF generator is missing Projects, Certifications, Achievements, and proper section ordering. Replace the entire `downloadPdf` function:

```typescript
function downloadPdf() {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const L = 45, R = 550, W = R - L;
    const PAGE_H = 841;
    let y = 50;

    const checkPage = (needed = 20) => {
      if (y + needed > PAGE_H - 50) { doc.addPage(); y = 50; }
    };

    const addWrapped = (text: string, x: number, maxW: number, size = 9, color = 60) => {
      doc.setFontSize(size).setTextColor(color);
      doc.splitTextToSize(text, maxW).forEach((line: string) => {
        checkPage(size + 4);
        doc.text(line, x, y);
        y += size + 4;
      });
    };

    const section = (title: string) => {
      checkPage(30);
      y += 8;
      doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(title, L, y);
      y += 4;
      doc.setDrawColor(180).setLineWidth(0.5).line(L, y, R, y);
      y += 10;
    };

    // Header
    doc.setFontSize(20).setFont("helvetica", "bold").setTextColor(0).text(cv.fullName, L, y);
    y += 16;
    const contact = [cv.phone, cv.email, cv.location].filter(Boolean).join("  |  ");
    doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(80).text(contact, L, y);
    y += 10;
    if (cv.links?.length) {
      const linkLine = cv.links.map(l => `${l.label}: ${l.url}`).join("   ");
      doc.setFontSize(8).setTextColor(100).text(linkLine, L, y);
      y += 10;
    }
    y += 6;
    doc.setDrawColor(0).setLineWidth(1).line(L, y, R, y);
    y += 14;

    // Objective/Summary
    if (cv.summary) {
      section("OBJECTIVE");
      addWrapped(cv.summary, L, W, 9, 40);
      y += 6;
    }

    const isExperienced = cv.experience.length > 0;

    if (isExperienced) {
      // EXPERIENCE first
      section("EXPERIENCE");
      cv.experience.forEach(x => {
        checkPage(40);
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(`${x.title} — ${x.company}`, L, y);
        doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100)
          .text(`${x.startDate} – ${x.endDate}`, R - doc.getTextWidth(`${x.startDate} – ${x.endDate}`), y);
        y += 13;
        x.bullets.forEach(b => { addWrapped(`• ${b}`, L + 10, W - 10, 9, 50); });
        y += 4;
      });
    }

    // PROJECTS
    if (cv.projects?.length) {
      section("PROJECTS");
      cv.projects.forEach(p => {
        checkPage(35);
        const techStr = p.tech?.length ? ` | ${p.tech.join(", ")}` : "";
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(`${p.name}${techStr}`, L, y);
        y += 13;
        p.bullets.forEach(b => { addWrapped(`• ${b}`, L + 10, W - 10, 9, 50); });
        y += 4;
      });
    }

    // SKILLS
    if (cv.skillCategories?.length) {
      section("SKILLS");
      cv.skillCategories.forEach(cat => {
        checkPage(14);
        doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0).text(`${cat.category}:`, L, y);
        doc.setFont("helvetica", "normal").setTextColor(60)
          .text(cat.items.join(", "), L + doc.getTextWidth(`${cat.category}: `) + 2, y);
        y += 13;
      });
      y += 4;
    } else if (cv.skills?.length) {
      section("SKILLS");
      addWrapped(cv.skills.join(" • "), L, W, 9, 60);
      y += 4;
    }

    if (!isExperienced && cv.experience.length > 0) {
      // Fresher: show internships after skills
      section("INTERNSHIPS");
      cv.experience.forEach(x => {
        checkPage(35);
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(`${x.title} — ${x.company}`, L, y);
        doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100)
          .text(`${x.startDate} – ${x.endDate}`, R - doc.getTextWidth(`${x.startDate} – ${x.endDate}`), y);
        y += 13;
        x.bullets.forEach(b => { addWrapped(`• ${b}`, L + 10, W - 10, 9, 50); });
        y += 4;
      });
    }

    // EDUCATION
    if (cv.education.length) {
      section("EDUCATION");
      cv.education.forEach(e => {
        checkPage(25);
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(e.degree, L, y);
        const yr = `${e.startYear} – ${e.endYear}${e.gpa ? ` | GPA ${e.gpa}` : ""}`;
        doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100)
          .text(yr, R - doc.getTextWidth(yr), y);
        y += 13;
        doc.setFontSize(9).setTextColor(60).text(e.institution, L, y);
        y += 14;
      });
    }

    // CERTIFICATIONS
    if (cv.certifications?.length) {
      section("CERTIFICATIONS");
      cv.certifications.forEach(c => { addWrapped(`• ${c}`, L + 10, W - 10, 9, 50); });
      y += 4;
    }

    // ACHIEVEMENTS / EXTRAS
    if (cv.achievements?.length) {
      section("ACHIEVEMENTS & EXTRAS");
      cv.achievements.forEach(a => { addWrapped(`• ${a}`, L + 10, W - 10, 9, 50); });
      y += 4;
    }

    // LANGUAGES
    if (cv.languages.length) {
      section("LANGUAGES");
      const langLine = cv.languages.map(l => `${l.name} (${l.level})`).join("   •   ");
      addWrapped(langLine, L, W, 9, 60);
    }

    doc.save(`${cv.fullName.replace(/\s+/g, "_")}_CV.pdf`);
  }).catch(err => console.error("PDF error:", err));
}
```

- [ ] **Step 2: Update the HTML preview in `CvPreview.tsx` to render both template orders**

In the JSX, determine layout from experience:

```typescript
const isExperienced = cv.experience.length > 0;
```

Then render sections in order. For Fresher: Skills → Projects → Internships → Education → Certs → Extras → Languages. For Experienced: Experience → Projects → Skills → Education → Certs → Extras → Languages.

The existing HTML rendering already shows sections — just reorder them conditionally using `isExperienced`. Wrap each section block in `{isExperienced ? <ExperienceFirst /> : <SkillsFirst />}` or use a `sections` array that gets rendered in order.

The simplest approach: render two conditional blocks at the section-ordering level:

```tsx
{/* Section order depends on template */}
{isExperienced ? (
  <>
    {renderExperience()}
    {renderProjects()}
    {renderSkills()}
  </>
) : (
  <>
    {renderSkills()}
    {renderProjects()}
    {cv.experience.length > 0 && renderExperience(/* label="INTERNSHIPS" */)}
  </>
)}
{renderEducation()}
{renderCertifications()}
{renderAchievements()}
{renderLanguages()}
```

Extract each section into a local render function inside the component to avoid repeating JSX.

- [ ] **Step 3: Make sure certifications and achievements render in HTML preview**

Add these two sections to the HTML preview if they are not already there:

```tsx
function renderCertifications() {
  if (!cv.certifications?.length) return null;
  return (
    <div className="mb-4">
      <h3 className="font-bold text-xs uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">Certifications</h3>
      <ul className="list-disc list-inside space-y-1">
        {cv.certifications.map((c, i) => (
          <li key={i} className="text-xs text-gray-700">{c}</li>
        ))}
      </ul>
    </div>
  );
}

function renderAchievements() {
  if (!cv.achievements?.length) return null;
  return (
    <div className="mb-4">
      <h3 className="font-bold text-xs uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">Achievements & Extras</h3>
      <ul className="list-disc list-inside space-y-1">
        {cv.achievements.map((a, i) => (
          <li key={i} className="text-xs text-gray-700">{a}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Test PDF download manually**

Run `pnpm dev`, go to `/build`, complete the flow, then click "Download PDF". Open the PDF and verify:
- All sections present (Objective, Skills or Experience, Projects, Education, Certs, Extras, Languages)
- No text overflow or overlap
- Name is bold and large at top
- Contact line is correct

- [ ] **Step 5: Commit**

```bash
git add components/CvPreview.tsx
git commit -m "feat: two CV template layouts and complete PDF with all sections"
```

---

## Task 4: Push and verify on Vercel

- [ ] **Step 1: Run local build to catch type errors**

```bash
pnpm build
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

- [ ] **Step 3: Verify on Vercel**

Open https://hired-jo-zrgu.vercel.app/build and complete the full flow end to end:
- Answer all questions
- Verify YES/NO buttons appear on template detection, experience more, project more steps
- Verify multiple projects work (add 2-3)
- Verify PDF downloads and opens correctly
- Verify both Fresher and Experienced flows produce correct section ordering

---

## Self-Review

**Spec coverage:**
- ✅ Two ATS templates (Fresher/Skills-First, Experienced/Chronological)
- ✅ Template auto-selected from "Do you have jobs/internships?" question
- ✅ Fresher still asked about internships (experience loop always asked if they say yes to internship question)
- ✅ Multi-project loop (1-4, one at a time)
- ✅ Multi-experience loop (1-3, one at a time)
- ✅ Clear questions with example inputs shown as hints
- ✅ Gemini rewrites all answers at end (one API call)
- ✅ PDF download includes all sections
- ✅ Certifications section asked and rendered
- ✅ Extras section with clear example input

**Type consistency:**
- `StructuredAnswers` defined once at top of `app/build/page.tsx`, used in `applyAnswer`, `send`, and sent to API
- `StepId` template literal pattern matches in `getNextStep` and `applyAnswer` use same regex `/^exp_(\w+)_(\d+)$/`
- `cv.experience.length > 0` used consistently for template detection in both PDF and HTML

**No placeholders:** All code blocks are complete.
