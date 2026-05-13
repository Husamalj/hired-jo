"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CvPreview } from "@/components/CvPreview";
import { CvBulkForm } from "@/components/CvBulkForm";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { CV } from "@/lib/types";

type Msg = { role: "user" | "ai"; text: string };

type StructuredAnswers = {
  template: "fresher" | "experienced";
  name: string;
  phone: string;
  email: string;
  location: string;
  university: string;
  gradYear: string;
  targetRole: string;
  experience: Array<{ company: string; role: string; dates: string; description: string }>;
  projects: Array<{ name: string; description: string; tools: string; result: string }>;
  technicalSkills: string;
  softSkills: string;
  certifications: string;
  extras: string;
  languages: string;
  links: string;
};

type StepId =
  | "name" | "phone" | "email" | "location" | "university" | "gradYear" | "targetRole"
  | "hasExperience"
  | `exp_company_${number}` | `exp_role_${number}` | `exp_dates_${number}` | `exp_desc_${number}` | `exp_more_${number}`
  | `proj_name_${number}` | `proj_desc_${number}` | `proj_tools_${number}` | `proj_result_${number}` | `proj_more_${number}`
  | "techSkills" | "softSkills" | "certifications" | "extras" | "languages" | "links" | "done";

function getQuestion(stepId: StepId): { question: string; hint: string } {
  if (stepId === "name") return { question: "What's your full name?", hint: "e.g. Ahmad Khalid Al-Masri" };
  if (stepId === "phone") return { question: "What's your phone number?", hint: "e.g. 0791234567" };
  if (stepId === "email") return { question: "What's your email address?", hint: "e.g. ahmad@gmail.com" };
  if (stepId === "location") return { question: "What city and country are you in?", hint: 'e.g. Amman, Jordan — or type "skip" to use Amman, Jordan' };
  if (stepId === "university") return { question: "Which university are you at, and what's your major?", hint: "e.g. Hashemite University, Computer Engineering" };
  if (stepId === "gradYear") return { question: "When do you graduate, and what's your GPA?", hint: 'e.g. 2026, 3.7 — type "skip GPA" if you\'d rather not include it' };
  if (stepId === "targetRole") return { question: "What job role are you targeting?", hint: "e.g. Junior Software Engineer, Data Analyst, Graphic Designer" };
  if (stepId === "hasExperience") return { question: "Do you have any jobs or internships?", hint: "Tap YES or NO below" };

  const expMatch = (stepId as string).match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idx] = expMatch;
    const n = parseInt(idx) + 1;
    if (sub === "company") return { question: `Internship/Job ${n}: What's the company name?`, hint: "e.g. Mawdoo3, Zain, Orange Jordan" };
    if (sub === "role") return { question: "What was your role or title there?", hint: "e.g. Software Engineering Intern, Marketing Assistant" };
    if (sub === "dates") return { question: "When did you work there?", hint: "e.g. Jun 2024 – Aug 2024, or Summer 2025" };
    if (sub === "desc") return { question: "What did you do there? Any results or numbers?", hint: "e.g. built an internal dashboard used by 50 employees, reduced report time by 30%" };
    if (sub === "more") return { question: "Do you have another job or internship to add?", hint: `You've added ${n} so far (max 3). Tap YES or NO.` };
  }

  const projMatch = (stepId as string).match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idx] = projMatch;
    const n = parseInt(idx) + 1;
    if (sub === "name") return { question: `Project ${n}: What's the name of your project?`, hint: "Just the name — e.g. Attendance App, Portfolio Website, AI Traffic Model" };
    if (sub === "desc") return { question: "What does it do? Describe it in one sentence.", hint: "e.g. A mobile app that tracks student attendance using QR codes" };
    if (sub === "tools") return { question: "What tools or technologies did you use?", hint: 'e.g. Flutter, Firebase, Python — or type "skip"' };
    if (sub === "result") return { question: "What was the result or impact?", hint: 'e.g. 300 active users, won 1st place at HU hackathon — or type "skip"' };
    if (sub === "more") return { question: "Do you have another project to add?", hint: `You've added ${n} so far (max 4). Tap YES or NO.` };
  }

  if (stepId === "techSkills") return { question: "List your technical skills, separated by commas.", hint: "e.g. Python, React, Figma, SQL, Adobe Premiere" };
  if (stepId === "softSkills") return { question: "Any soft skills to add?", hint: 'e.g. Teamwork, Leadership, Public Speaking — or type "skip"' };
  if (stepId === "certifications") return { question: "Do you have any certifications?", hint: 'e.g. Google Data Analytics | Google | 2024 — or type "skip"' };
  if (stepId === "extras") return { question: "Any awards, hackathons, or volunteering to highlight?", hint: 'e.g. 1st place HU Hackathon 2025, volunteer tutor at local school — or type "skip"' };
  if (stepId === "languages") return { question: "What languages do you speak and at what level?", hint: "e.g. Arabic (Native), English (Professional), French (Basic)" };
  if (stepId === "links") return { question: "Do you have a GitHub, LinkedIn, or portfolio link?", hint: 'Paste one or more links — or type "skip"' };
  return { question: "All done!", hint: "" };
}

function isSkipAnswer(s: string) {
  return /^(skip|none|no|n\/a|-)$/i.test(s.trim());
}

function getNextStep(
  stepId: StepId,
  answer: string
): StepId {
  if (stepId === "name") return "phone";
  if (stepId === "phone") return "email";
  if (stepId === "email") return "location";
  if (stepId === "location") return "university";
  if (stepId === "university") return "gradYear";
  if (stepId === "gradYear") return "targetRole";
  if (stepId === "targetRole") return "hasExperience";
  if (stepId === "hasExperience") {
    return /^yes$/i.test(answer.trim()) ? "exp_company_0" : "proj_name_0";
  }

  const expMatch = (stepId as string).match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idxStr] = expMatch;
    const idx = parseInt(idxStr);
    if (sub === "company") return `exp_role_${idx}` as StepId;
    if (sub === "role") return `exp_dates_${idx}` as StepId;
    if (sub === "dates") return `exp_desc_${idx}` as StepId;
    if (sub === "desc") return `exp_more_${idx}` as StepId;
    if (sub === "more") {
      if (/^yes$/i.test(answer.trim()) && idx + 1 < 3) return `exp_company_${idx + 1}` as StepId;
      return "proj_name_0";
    }
  }

  const projMatch = (stepId as string).match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idxStr] = projMatch;
    const idx = parseInt(idxStr);
    if (sub === "name") return `proj_desc_${idx}` as StepId;
    if (sub === "desc") return `proj_tools_${idx}` as StepId;
    if (sub === "tools") return `proj_result_${idx}` as StepId;
    if (sub === "result") return `proj_more_${idx}` as StepId;
    if (sub === "more") {
      if (/^yes$/i.test(answer.trim()) && idx + 1 < 4) return `proj_name_${idx + 1}` as StepId;
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

function applyAnswer(
  stepId: StepId,
  answer: string,
  data: StructuredAnswers
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

  const expMatch = (stepId as string).match(/^exp_(\w+)_(\d+)$/);
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

  const projMatch = (stepId as string).match(/^proj_(\w+)_(\d+)$/);
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

const INITIAL_ANSWERS: StructuredAnswers = {
  template: "fresher", name: "", phone: "", email: "", location: "",
  university: "", gradYear: "", targetRole: "",
  experience: [], projects: [],
  technicalSkills: "", softSkills: "",
  certifications: "", extras: "", languages: "", links: "",
};

export default function BuildPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey! I'll help you build a professional CV in just a few minutes. Ready? Let's go!" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [stepId, setStepId] = useState<StepId>("name");
  const [data, setData] = useState<StructuredAnswers>(INITIAL_ANSWERS);
  const [cv, setCv] = useState<CV | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = (formCv: CV) => {
    setCv(formCv);
    localStorage.setItem("hired_cv", JSON.stringify(formCv));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { question, hint } = getQuestion("name");
      setMsgs(prev => [...prev, { role: "ai", text: hint ? `${question}\n\n💡 ${hint}` : question }]);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  async function send(rawAnswer?: string) {
    const text = (rawAnswer ?? input).trim();
    if (!text || thinking) return;

    const newData = applyAnswer(stepId, text, data);
    setData(newData);

    const userMsg = text === "yes" ? "✅ Yes" : text === "no" ? "❌ No" : text;
    const newMsgs: Msg[] = [...msgs, { role: "user", text: userMsg }];
    setMsgs(newMsgs);
    setInput("");

    const nextStep = getNextStep(stepId, text);
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
          setMsgs(prev => [...prev, { role: "ai", text: "Your CV is ready! Review it below and download when happy." }]);
          setCv(result.cv);
          localStorage.setItem("hired_cv", JSON.stringify(result.cv));
        } else throw new Error(result.detail ?? "no cv returned");
      } catch (err: any) {
        setThinking(false);
        setMsgs(prev => [...prev, { role: "ai", text: `Error: ${err?.message ?? "Something went wrong. Please try again."}` }]);
      }
      return;
    }

    setThinking(true);
    await new Promise(r => setTimeout(r, 400));
    setThinking(false);
    const { question, hint } = getQuestion(nextStep);
    const msgText = hint ? `${question}\n\n💡 ${hint}` : question;
    setMsgs(prev => [...prev, { role: "ai", text: msgText }]);
  }

  function saveAndScore() {
    if (!cv) return;
    localStorage.setItem("hired_cv", JSON.stringify(cv));
    router.push("/score");
  }

  const FIXED_STEPS = 14;
  const dynamicSteps = data.experience.length * 4 + data.projects.length * 4;
  const totalSteps = FIXED_STEPS + dynamicSteps;
  const STEP_ORDER = ["name","phone","email","location","university","gradYear","targetRole","hasExperience","techSkills","softSkills","certifications","extras","languages","links"];
  const baseIdx = STEP_ORDER.indexOf(stepId as string);
  const completedFixed = baseIdx >= 0 ? baseIdx : STEP_ORDER.length;
  const progress = Math.min(((completedFixed) / totalSteps) * 100, 95);

  const showYesNo = stepId === "hasExperience" || /^(exp|proj)_more_\d+$/.test(stepId as string);

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
              <span>Step {Math.min(completedFixed + 1, totalSteps)} of {totalSteps}</span>
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
                        {m.text.split('\n').map((line, li) => (
                          <span key={li}>
                            {line.startsWith('💡')
                              ? <span className="text-white/50 text-xs">{line}</span>
                              : line}
                            {li < m.text.split('\n').length - 1 && <br/>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm text-white/40">
                        <span className="blink">●</span> {stepId === "done" ? "Building your CV… this takes 10–20 seconds" : "thinking…"}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* YES/NO buttons */}
                {showYesNo && (
                  <div className="flex gap-3 mb-3 justify-center">
                    <button
                      onClick={() => send("yes")}
                      disabled={thinking}
                      className="gold-grad text-black font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-40"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => send("no")}
                      disabled={thinking}
                      className="bg-white/10 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-white/20 disabled:opacity-40"
                    >
                      No
                    </button>
                  </div>
                )}

                {/* Input row */}
                {!showYesNo && (
                  <div className="flex gap-2 items-center">
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
                      onClick={() => send()}
                      disabled={thinking || !input.trim()}
                      className="gold-grad text-black font-bold px-5 py-3 rounded-xl disabled:opacity-40 shrink-0"
                    >
                      Send
                    </button>
                  </div>
                )}
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
