"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CvPreview } from "@/components/CvPreview";
import { CvBulkForm } from "@/components/CvBulkForm";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { CV } from "@/lib/types";

type Msg = { role: "user" | "ai"; text: string };

const QUESTIONS = [
  "What's your full name?",
  "Which university or institution are you at, and what's your field of study?",
  "What year do you graduate, and what's your GPA (optional — just skip if you'd rather not)?",
  "Tell me about your best project or work — what did you create or do?",
  "What tools, devices, or software did you use in this work? (or type 'skip' if not relevant)",
  "What was the result or impact? (any number works — clients, views, grade, downloads, revenue…)",
  "Any work experience or internships? Describe briefly, or say 'none'.",
  "List your top skills — technical, creative, or soft skills, separated by commas.",
  "What languages do you speak?",
];

function detectField(uniMajorAnswer: string): "tech" | "creative" | "business" | "medical" | "other" {
  const t = uniMajorAnswer.toLowerCase();
  if (/computer|software|engineer|cs |programming|cyber|network|data science|it |information tech/.test(t)) return "tech";
  if (/photo|film|cinema|visual|design|art|media|graphic|animation|video|creative|ux|ui |illustration|fashion|interior|architect/.test(t)) return "creative";
  if (/business|marketing|finance|accounting|management|economics|commerce|mba/.test(t)) return "business";
  if (/medicine|medical|pharmacy|nursing|dentist|health|clinical/.test(t)) return "medical";
  return "other";
}

function getLinksQuestion(answers: string[]): string {
  const field = detectField(answers[1] ?? "");
  switch (field) {
    case "tech":
      return "Do you have a GitHub, LinkedIn, or personal portfolio site? (paste links or type 'skip')";
    case "creative":
      return "Do you have a Behance, Instagram, YouTube, or portfolio website? (paste links or type 'skip')";
    case "business":
      return "Do you have a LinkedIn or any professional profile link? (paste or type 'skip')";
    case "medical":
      return "Do you have a LinkedIn or any academic/professional profile? (paste or type 'skip')";
    default:
      return "Do you have a LinkedIn or any professional/portfolio link? (paste or type 'skip')";
  }
}

async function stubChat(step: number): Promise<string> {
  return QUESTIONS[step] ?? "Thanks! Your CV is ready.";
}

async function askAI(messages: Msg[]): Promise<{ done: boolean; reply?: string; cv?: CV }> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    // fallback to stub if API not ready
    const step = messages.filter(m => m.role === "ai").length;
    return { done: false, reply: await stubChat(step) };
  }
}

// Auto-correct common misspellings and normalize text
const SKILL_CORRECTIONS: Record<string, string> = {
  pythin: "Python", pyhton: "Python", phyton: "Python", "python3": "Python",
  javascrip: "JavaScript", javscript: "JavaScript", javasript: "JavaScript",
  typescirpt: "TypeScript", typscript: "TypeScript",
  recat: "React", raect: "React",
  "c++": "C++", cpp: "C++", "c plus plus": "C++",
  ccna: "CCNA", html5: "HTML", css3: "CSS",
  figam: "Figma", figm: "Figma",
  photoshoop: "Photoshop", photshop: "Photoshop",
  lightoom: "Lightroom", lightroon: "Lightroom",
  premire: "Premiere Pro", "premiere pro": "Premiere Pro",
  afterefects: "After Effects",
  ilustrator: "Illustrator",
  node: "Node.js", nodejs: "Node.js",
  mongo: "MongoDB", mangodb: "MongoDB",
  postgress: "PostgreSQL", posgres: "PostgreSQL", postgres: "PostgreSQL",
  mysql: "MySQL", sqllite: "SQLite", sqlite: "SQLite",
  dockerr: "Docker", kubernets: "Kubernetes",
  tensorflow: "TensorFlow", tenserflow: "TensorFlow",
  flutter: "Flutter", dart: "Dart",
  git: "Git", github: "GitHub", giithub: "GitHub",
};

function correctSkill(s: string): string {
  const lower = s.toLowerCase().trim();
  return SKILL_CORRECTIONS[lower] ?? s.trim();
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function cleanName(s: string): string {
  return s.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function isSkip(s: string): boolean {
  return /^(skip|n\/a|none|no|not needed|not applicable|nothing|na|-)$/i.test(s.trim());
}

function parseLinks(raw: string): { label: string; url: string }[] {
  const results: { label: string; url: string }[] = [];
  const parts = raw.split(/[\s,]+/);
  parts.forEach(p => {
    const url = p.replace(/^https?:\/\//i, "").trim();
    if (!url || url.length < 4) return;
    if (/github\.com/i.test(url)) results.push({ label: "GitHub", url: `https://${url}` });
    else if (/behance\.net/i.test(url)) results.push({ label: "Behance", url: `https://${url}` });
    else if (/linkedin\.com/i.test(url)) results.push({ label: "LinkedIn", url: `https://${url}` });
    else if (/youtube\.com|youtu\.be/i.test(url)) results.push({ label: "YouTube", url: `https://${url}` });
    else if (/instagram\.com/i.test(url)) results.push({ label: "Instagram", url: `https://${url}` });
    else if (/dribbble\.com/i.test(url)) results.push({ label: "Dribbble", url: `https://${url}` });
    else results.push({ label: "Portfolio", url: `https://${url}` });
  });
  return results;
}

function buildSkillCategories(
  field: string,
  skillList: string[],
  techList: string[]
): { category: string; items: string[] }[] {
  const all = [...new Set([...skillList, ...techList])];
  if (all.length === 0) return [];

  const softKeywords = /communication|teamwork|leadership|problem.solving|time management|creativity|storytelling|collaboration|presentation/i;
  const equipKeywords = /canon|nikon|sony|dji|drone|camera|lens|microphone|gimbal|tripod/i;
  const softwareKeywords = /photoshop|lightroom|premiere|after effects|illustrator|figma|indesign|davinci|resolve|final cut|audition/i;
  const progKeywords = /python|javascript|typescript|react|node|java|c\+\+|sql|html|css|php|swift|kotlin|flutter/i;
  const creativeKeywords = /photography|videography|cinematography|color grading|editing|retouching|illustration|animation|motion graphics|visual/i;

  if (field === "creative") {
    const software = all.filter(s => softwareKeywords.test(s));
    const equipment = all.filter(s => equipKeywords.test(s));
    const creative = all.filter(s => creativeKeywords.test(s) && !softwareKeywords.test(s) && !equipKeywords.test(s));
    const soft = all.filter(s => softKeywords.test(s));
    const rest = all.filter(s => !software.includes(s) && !equipment.includes(s) && !creative.includes(s) && !soft.includes(s));
    return [
      software.length ? { category: "Software", items: software } : null,
      equipment.length ? { category: "Equipment", items: equipment } : null,
      (creative.length || rest.length) ? { category: "Creative Skills", items: [...creative, ...rest] } : null,
      soft.length ? { category: "Soft Skills", items: soft } : null,
    ].filter(Boolean) as { category: string; items: string[] }[];
  }

  if (field === "tech") {
    const prog = all.filter(s => progKeywords.test(s));
    const tools = all.filter(s => softwareKeywords.test(s) || /git|docker|linux|aws|firebase|figma/i.test(s));
    const soft = all.filter(s => softKeywords.test(s));
    const rest = all.filter(s => !prog.includes(s) && !tools.includes(s) && !soft.includes(s));
    return [
      prog.length ? { category: "Programming", items: prog } : null,
      tools.length ? { category: "Tools & Technologies", items: tools } : null,
      (soft.length || rest.length) ? { category: "Other Skills", items: [...rest, ...soft] } : null,
    ].filter(Boolean) as { category: string; items: string[] }[];
  }

  // Generic fallback — one flat category
  return [{ category: "Skills", items: all }];
}

function parseExperience(raw: string): CV["experience"] {
  if (!raw.trim() || isSkip(raw)) return [];

  // Try to extract company name — look for "at CompanyName" pattern
  const atMatch = raw.match(/\bat\s+([A-Za-z0-9؀-ۿ&'.\- ]+?)(?:,|\.|$)/i);
  const company = atMatch ? atMatch[1].trim() : raw.split(/,/)[0].trim();

  // Extract dates — look for year or season patterns
  const yearMatch = raw.match(/\b(20\d{2})\b/);
  const seasonMatch = raw.match(/\b(summer|winter|spring|fall)\s*(20\d{2})?/i);
  const startDate = yearMatch ? `06/${yearMatch[1]}` : "06/2025";
  const endDate = raw.match(/present|current|now/i) ? "Present" : `09/${yearMatch?.[1] ?? "2025"}`;

  // Extract role
  const roleMatch = raw.match(/^([^,@]+?)(?:\s+(?:intern|at|@)|,)/i);
  const role = roleMatch ? roleMatch[1].trim() : "Software Engineering Intern";

  // Build specific bullets from the raw experience text
  const bullets: string[] = [];
  const sentences = raw.split(/[.,;]/).map(s => s.trim()).filter(s => s.length > 8);
  const actionWords = /covered|edited|shot|photographed|filmed|designed|built|developed|managed|created|wrote|produced|assisted|supported|handled|coordinated/i;
  const actionSentences = sentences.filter(s => actionWords.test(s));
  if (actionSentences.length > 0) {
    actionSentences.slice(0, 3).forEach(s => {
      const clean = s.charAt(0).toUpperCase() + s.slice(1);
      bullets.push(clean + (clean.endsWith(".") ? "" : "."));
    });
  } else {
    const numberMatches = raw.match(/\d+[\+%]?\s*\w+/g) ?? [];
    if (numberMatches.length > 0) {
      bullets.push(`Delivered measurable results at ${company}, including ${numberMatches.join(", ")}.`);
    } else {
      bullets.push(`Gained hands-on experience at ${company} in a professional environment.`);
      if (sentences.length > 1) {
        const extra = sentences[1].charAt(0).toUpperCase() + sentences[1].slice(1);
        bullets.push(extra + (extra.endsWith(".") ? "" : "."));
      }
    }
  }

  return [{ title: role.length > 40 ? "Software Engineering Intern" : role, company, startDate, endDate, bullets }];
}

function buildCvFromAnswers(answers: string[]): CV {
  const [
    fullName = "",
    uniMajor = "",
    gradGpa = "",
    projectDesc = "",
    projectTech = "",
    projectOutcome = "",
    experience = "",
    skills = "",
    languages = "",
    links = "",
  ] = answers;

  const field = detectField(uniMajor);

  // Parse university and major
  const uniParts = uniMajor.split(/,|\bat\b|-/i).map(s => s.trim()).filter(Boolean);
  const university = toTitleCase(uniParts[0] ?? "Hashemite University");
  const major = toTitleCase(uniParts[1] ?? "");

  // Parse graduation year and GPA
  const yearMatch = gradGpa.match(/\b(20\d{2})\b/);
  const endYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() + 1;
  const gpaMatch = gradGpa.match(/[\d]+\.[\d]+/);
  const gpa = gpaMatch ? gpaMatch[0] : undefined;
  const showGpa = gpa && parseFloat(gpa) >= 2.8 ? gpa : undefined;

  // Tech / tools
  const techList = isSkip(projectTech)
    ? []
    : projectTech.split(/,|and/i).map(s => correctSkill(s)).filter(s => s.length > 1);

  // Skills — auto-correct
  const skillList = skills
    .split(/,/)
    .map(s => correctSkill(s))
    .filter(s => s.length > 1 && !isSkip(s));

  // Clean project name
  const rawProjectName = projectDesc.replace(/^(i made |i built |i created |i developed |i designed )/i, "").split(/\.|,/)[0].trim();
  const projectName = toTitleCase(rawProjectName).slice(0, 65) || "Personal Project";

  // Project description — one clean sentence
  const projectDescription = toTitleCase(
    projectDesc.replace(/^(i made |i built |i created |i developed |i designed )/i, "").split(/\./)[0].trim()
  );

  // Project bullets from outcome
  const projectBullets: string[] = [];
  if (projectOutcome.trim() && !isSkip(projectOutcome)) {
    const outcomes = projectOutcome.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 5);
    outcomes.forEach(o => {
      const clean = o.charAt(0).toUpperCase() + o.slice(1);
      // Enhance bare numbers: "15000 views on YouTube" → "Achieved 15,000+ views on YouTube"
      const enhanced = clean
        .replace(/^(\d{4,})\s+views/i, (_, n) => `Achieved ${parseInt(n).toLocaleString()}+ views`)
        .replace(/^won\s+/i, "Received recognition for ")
        .replace(/^screened\s+/i, "Selected for screening ");
      projectBullets.push(enhanced + (enhanced.endsWith(".") ? "" : "."));
    });
  }
  if (techList.length > 0) {
    projectBullets.push(`Produced using ${techList.join(", ")}.`);
  }
  if (projectBullets.length === 0) {
    projectBullets.push(`Independently designed and developed ${projectName}.`);
  }

  // Achievements — extract from outcome
  const achievements: string[] = [];
  if (projectOutcome.trim() && !isSkip(projectOutcome)) {
    const parts = projectOutcome.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 5);
    parts.forEach(p => {
      if (/award|prize|winner|best|first|recogni|festival|screened/i.test(p)) {
        achievements.push(toTitleCase(p.replace(/^won\s+/i, "")) + (p.endsWith(".") ? "" : "."));
      } else if (/\d{3,}/.test(p)) {
        const clean = p.charAt(0).toUpperCase() + p.slice(1);
        achievements.push(clean + (clean.endsWith(".") ? "" : "."));
      }
    });
  }

  // Rich field-aware summary (3 sentences)
  const topSkills = skillList.slice(0, 3).join(", ") || techList.slice(0, 3).join(", ") || "professional tools";
  const allTools = [...new Set([...techList, ...skillList])].slice(0, 5).join(", ");
  const hasExp = !isSkip(experience) && experience.trim().length > 3;
  const topAchievement = achievements[0] ?? (projectOutcome && !isSkip(projectOutcome) ? projectOutcome.split(/[,;]/)[0].trim() : "");

  const fieldTargets: Record<string, string> = {
    creative: "media production and visual content creation roles",
    tech: "software development and engineering roles",
    business: "business development and management roles",
    medical: "healthcare and clinical roles",
    other: "professional roles in their field",
  };

  const sentence1 = `${major || "Student"} at ${university}, graduating ${endYear}${showGpa ? ` with a GPA of ${showGpa}` : ""}.`;
  const sentence2 = allTools.length > 0
    ? `Experienced in ${allTools}.`
    : `Skilled in ${topSkills}.`;
  const sentence3 = topAchievement.length > 5
    ? `${topAchievement.charAt(0).toUpperCase() + topAchievement.slice(1)}${topAchievement.endsWith(".") ? "" : "."}` +
      (hasExp ? ` Gained practical experience through internship work.` : "")
    : hasExp
      ? `Gained practical industry experience through internship work, targeting ${fieldTargets[field]}.`
      : `Strong academic and project background, targeting ${fieldTargets[field]}.`;

  const summary = `${sentence1} ${sentence2} ${sentence3}`;

  // Skill categories
  const skillCategories = buildSkillCategories(field, skillList, techList);

  // Parse links
  const parsedLinks = isSkip(links) ? [] : parseLinks(links);



  return {
    fullName: cleanName(fullName),
    email: "",
    phone: "",
    location: "Amman, Jordan",
    summary,
    education: [
      {
        degree: major ? `B.Sc. in ${major}` : "Bachelor's Degree",
        institution: university,
        startYear: endYear - 4,
        endYear,
        gpa: showGpa,
      },
    ],
    experience: parseExperience(experience),
    projects: [
      {
        name: projectName,
        description: projectDescription,
        tech: techList,
        bullets: projectBullets,
      },
    ],
    skills: [...new Set([...skillList, ...techList])],
    skillCategories: skillCategories.length ? skillCategories : undefined,
    achievements: achievements.length ? achievements : undefined,
    links: parsedLinks.length ? parsedLinks : undefined,
    languages: languages
      .split(/,|and/i)
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({
        name: toTitleCase(name),
        level: /arabic|english|french|german|spanish/i.test(name)
          ? ("Native" as const)
          : ("Intermediate" as const),
      })),
    certifications: [],
  };
}

export default function BuildPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey! I'll help you build a professional CV in just a few minutes. Ready? Let's go!" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [cv, setCv] = useState<CV | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = (formCv: CV) => {
    setCv(formCv);
    localStorage.setItem("hired_cv", JSON.stringify(formCv));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  // Ask first question on mount
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = await stubChat(0);
      setMsgs(prev => [...prev, { role: "ai", text: q }]);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;

    const newAnswers = [...answers, text];
    setAnswers(newAnswers);
    const newMsgs: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(newMsgs);
    setInput("");
    setThinking(true);

    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep > QUESTIONS.length) {
      // Use Gemini to build a proper CV from raw answers
      try {
        const res = await fetch("/api/build-cv", {
          method: "POST",
          body: JSON.stringify({ answers: newAnswers }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setThinking(false);
        if (data.cv) {
          setMsgs(prev => [...prev, { role: "ai", text: "Perfect! Here's your professional CV. Review it below." }]);
          setCv(data.cv);
        } else {
          throw new Error("No CV returned");
        }
      } catch {
        // Fallback to local parser if API fails
        const builtCv = buildCvFromAnswers(newAnswers);
        setThinking(false);
        setMsgs(prev => [...prev, { role: "ai", text: "Here's your CV. Review it below." }]);
        setCv(builtCv);
      }
    } else {
      // Next question — last question is dynamic based on field
      const q = nextStep === QUESTIONS.length
        ? getLinksQuestion(newAnswers)
        : await stubChat(nextStep);
      setThinking(false);
      setMsgs(prev => [...prev, { role: "ai", text: q }]);
    }
  }

  function goBack() {
    if (step === 0 || thinking) return;
    const prevStep = step - 1;
    // Remove last user message and the AI question that followed it
    setMsgs(prev => {
      // Remove trailing AI message (the current question) and the user's last answer
      const trimmed = [...prev];
      // Remove last AI message (current question shown after user answered)
      if (trimmed[trimmed.length - 1]?.role === "ai") trimmed.pop();
      // Remove last user message
      if (trimmed[trimmed.length - 1]?.role === "user") {
        setInput(trimmed[trimmed.length - 1].text);
        trimmed.pop();
      }
      return trimmed;
    });
    setAnswers(prev => prev.slice(0, -1));
    setStep(prevStep);
  }

  function saveAndScore() {
    if (!cv) return;
    localStorage.setItem("hired_cv", JSON.stringify(cv));
    router.push("/score");
  }

  const TOTAL_STEPS = QUESTIONS.length + 1; // +1 for dynamic links question
  const progress = Math.min((step / TOTAL_STEPS) * 100, 100);

  return (
    <div className="min-h-screen grain dot-grid">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-grad font-display font-bold text-3xl mb-1">Build your CV</h1>
            <p className="text-white/60 text-sm">{mode === "chat" ? "Talk or type. I'll write your CV for you." : "Fill all your information at once."}</p>
          </div>
          {!cv && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode("chat")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "chat"
                    ? "gold-grad text-black"
                    : "bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setMode("form")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "form"
                    ? "gold-grad text-black"
                    : "bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                📝 Form
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!cv && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full gold-grad transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!cv ? (
          <>
            {mode === "form" ? (
              <CvBulkForm onSubmit={handleFormSubmit} />
            ) : (
              <>
                {/* Chat window */}
            <div className="glass rounded-2xl p-5 mb-4 h-[50vh] overflow-y-auto flex flex-col gap-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex chat-bubble ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={m.role === "user"
                    ? "px-4 py-2.5 rounded-2xl rounded-br-sm gold-grad text-black text-sm font-medium max-w-[80%]"
                    : "px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm max-w-[80%]"
                  }>
                    {m.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm text-white/40">
                    <span className="blink">●</span> thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="flex gap-2 items-center">
              {step > 0 && (
                <button
                  onClick={goBack}
                  disabled={thinking}
                  title="Go back to previous question"
                  className="shrink-0 px-3 py-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white disabled:opacity-40 transition-colors text-sm font-medium"
                >
                  ←
                </button>
              )}
              <VoiceRecorder onTranscript={setInput} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none text-white placeholder:text-white/30"
                placeholder="Type your answer…"
                disabled={thinking}
                autoFocus
              />
              <button
                onClick={send}
                disabled={thinking || !input.trim()}
                className="gold-grad text-black font-bold px-5 py-3 rounded-xl disabled:opacity-40 shrink-0"
              >
                Send
              </button>
            </div>
              </>
            )}
          </>
        ) : (
          <>
            <CvPreview cv={cv} />
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={saveAndScore} className="gold-grad text-black font-bold px-6 py-3 rounded-xl">
                Save &amp; Get My Score →
              </button>
              <button onClick={() => router.push("/jobs")} className="purple-grad text-white font-bold px-6 py-3 rounded-xl">
                Browse Jobs →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
