"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardPenLine,
  FileText,
  Loader2,
  LogIn,
  MessageSquareText,
  Send,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CvPreview } from "@/components/CvPreview";
import { CvBulkForm } from "@/components/CvBulkForm";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { CV } from "@/lib/types";
import { loadCvFromAccount, syncCvToAccount } from "@/lib/user-data";
import { CvSectionEditor } from "@/components/CvSectionEditor";
import { UpgradeModal } from "@/components/UpgradeModal";
import type { UsageKey } from "@/lib/tiers";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

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
  projects: Array<{ name: string; description: string; tools: string; result: string; github: string }>;
  progLangs: string;
  frameworks: string;
  tools: string;
  networkingSkills: string;
  softSkills: string;
  certifications: Array<{ name: string; issuer: string; year: string }>;
  awards: string;
  volunteering: string;
  coursework: string;
  languages: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

type StepId =
  | "name" | "phone" | "email" | "location" | "university" | "gradYear" | "targetRole"
  | "hasExperience"
  | `exp_company_${number}` | `exp_role_${number}` | `exp_dates_${number}` | `exp_desc_${number}` | `exp_more_${number}`
  | `proj_name_${number}` | `proj_desc_${number}` | `proj_tools_${number}` | `proj_result_${number}` | `proj_github_${number}` | `proj_more_${number}`
  | "progLangs" | "frameworks" | "tools" | "networkingSkills" | "softSkills"
  | `cert_name_${number}` | `cert_issuer_${number}` | `cert_year_${number}` | `cert_more_${number}`
  | "awards" | "volunteering" | "coursework" | "languages"
  | "linkedin" | "github" | "portfolio"
  | "done";

function getQuestion(stepId: StepId): { question: string; hint: string } {
  if (stepId === "name") return { question: "What is your full name?", hint: "e.g. Ahmad Khalid Al-Masri" };
  if (stepId === "phone") return { question: "What is your phone number?", hint: "e.g. 0791234567" };
  if (stepId === "email") return { question: "What is your email address?", hint: "e.g. ahmad@gmail.com" };
  if (stepId === "location") return { question: "What city and country are you in?", hint: 'e.g. Amman, Jordan — or type "skip" to use Amman, Jordan' };
  if (stepId === "university") return { question: "Which university are you at, and what is your major?", hint: "e.g. Hashemite University, Computer Engineering" };
  if (stepId === "gradYear") return { question: "When do you graduate, and what is your GPA?", hint: 'e.g. 2026, 3.7 — type "skip GPA" if you would rather not include it' };
  if (stepId === "targetRole") return { question: "What job role are you targeting?", hint: "e.g. Junior Software Engineer, Data Analyst, Network Engineer" };
  if (stepId === "hasExperience") return { question: "Do you have any jobs or internships?", hint: "Choose yes or no below" };

  const expMatch = (stepId as string).match(/^exp_(\w+)_(\d+)$/);
  if (expMatch) {
    const [, sub, idx] = expMatch;
    const n = parseInt(idx) + 1;
    if (sub === "company") return { question: `Internship/job ${n}: what is the company name?`, hint: "e.g. Mawdoo3, Zain, Orange Jordan" };
    if (sub === "role") return { question: "What was your role or title?", hint: "e.g. Software Engineering Intern, Marketing Assistant" };
    if (sub === "dates") return { question: "When did you work there?", hint: "e.g. Jun 2024 – Aug 2024" };
    if (sub === "desc") return { question: "What did you do? Any results or numbers?", hint: "e.g. Built an internal dashboard used by 50 employees, reduced report time by 30%" };
    if (sub === "more") return { question: "Do you have another job or internship to add?", hint: `You have added ${n} so far (max 3). Choose yes or no.` };
  }

  const projMatch = (stepId as string).match(/^proj_(\w+)_(\d+)$/);
  if (projMatch) {
    const [, sub, idx] = projMatch;
    const n = parseInt(idx) + 1;
    if (sub === "name") return { question: `Project ${n}: what is the name?`, hint: "e.g. Attendance App, AI Traffic Model, Portfolio Website" };
    if (sub === "desc") return { question: "What does it do? One sentence.", hint: "e.g. A mobile app that tracks student attendance using QR codes" };
    if (sub === "tools") return { question: "What tools or technologies did you use?", hint: 'e.g. Flutter, Firebase, Python — or type "skip"' };
    if (sub === "result") return { question: "What was the result or impact?", hint: 'e.g. 300 active users, won 1st place at HU Hackathon — or type "skip"' };
    if (sub === "github") return { question: "GitHub link for this project?", hint: 'e.g. https://github.com/you/project — or type "skip"' };
    if (sub === "more") return { question: "Do you have another project to add?", hint: `You have added ${n} so far (max 4). Choose yes or no.` };
  }

  if (stepId === "progLangs") return { question: "What programming languages do you know?", hint: 'e.g. Python, SQL, JavaScript, C++ — or type "skip"' };
  if (stepId === "frameworks") return { question: "Any frameworks or libraries?", hint: 'e.g. React, Flutter, YOLOv8, TensorFlow — or type "skip"' };
  if (stepId === "tools") return { question: "What tools and platforms do you use?", hint: 'e.g. Git, Firebase, Figma, Docker, Linux — or type "skip"' };
  if (stepId === "networkingSkills") return { question: "Any networking, hardware, or other technical skills?", hint: 'e.g. Network Design, CCNA, Cisco IOS, Linux Admin — or type "skip"' };
  if (stepId === "softSkills") return { question: "Any soft skills to add?", hint: 'e.g. Teamwork, Leadership, Public Speaking — or type "skip"' };

  const certMatch = (stepId as string).match(/^cert_(\w+)_(\d+)$/);
  if (certMatch) {
    const [, sub, idx] = certMatch;
    const n = parseInt(idx) + 1;
    if (sub === "name") return { question: `Certification ${n}: what is the name?`, hint: "e.g. CCNA, Google Data Analytics, AWS Cloud Practitioner" };
    if (sub === "issuer") return { question: "Who issued it?", hint: "e.g. Cisco, Google, Amazon, Coursera" };
    if (sub === "year") return { question: "What year did you get it?", hint: "e.g. 2024" };
    if (sub === "more") return { question: "Do you have another certification?", hint: `You have added ${n} so far (max 5). Choose yes or no.` };
  }

  if (stepId === "awards") return { question: "Any awards, competition placements, or hackathons?", hint: 'e.g. 1st place HU Hackathon 2025, Top 32 HTU Sumo — or type "skip"' };
  if (stepId === "volunteering") return { question: "Any volunteering or community work?", hint: 'e.g. Volunteer tutor at local school, IEEE student chapter president — or type "skip"' };
  if (stepId === "coursework") return { question: "Any relevant courses you took at university?", hint: 'e.g. Data Structures, Computer Networks, Machine Learning — or type "skip"' };
  if (stepId === "languages") return { question: "What languages do you speak and at what level?", hint: "e.g. Arabic (Native), English (Professional), French (Basic)" };
  if (stepId === "linkedin") return { question: "What is your LinkedIn profile URL?", hint: 'e.g. https://linkedin.com/in/yourname — or type "skip"' };
  if (stepId === "github") return { question: "What is your GitHub profile URL?", hint: 'e.g. https://github.com/yourname — or type "skip"' };
  if (stepId === "portfolio") return { question: "Do you have a portfolio or personal website?", hint: 'e.g. https://yourname.com — or type "skip"' };
  return { question: "All done!", hint: "" };
}

function isSkipAnswer(s: string) {
  return /^(skip|none|no|n\/a|-)$/i.test(s.trim());
}

function getNextStep(stepId: StepId, answer: string, data: StructuredAnswers): StepId {
  if (stepId === "name") return "phone";
  if (stepId === "phone") return "email";
  if (stepId === "email") return "location";
  if (stepId === "location") return "university";
  if (stepId === "university") return "gradYear";
  if (stepId === "gradYear") return "targetRole";
  if (stepId === "targetRole") return "hasExperience";
  if (stepId === "hasExperience") return /^yes$/i.test(answer.trim()) ? "exp_company_0" : "proj_name_0";

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
    if (sub === "result") return `proj_github_${idx}` as StepId;
    if (sub === "github") return `proj_more_${idx}` as StepId;
    if (sub === "more") {
      if (/^yes$/i.test(answer.trim()) && idx + 1 < 4) return `proj_name_${idx + 1}` as StepId;
      return "progLangs";
    }
  }

  if (stepId === "progLangs") return "frameworks";
  if (stepId === "frameworks") return "tools";
  if (stepId === "tools") return "networkingSkills";
  if (stepId === "networkingSkills") return "softSkills";
  if (stepId === "softSkills") return "cert_name_0";

  const certMatch = (stepId as string).match(/^cert_(\w+)_(\d+)$/);
  if (certMatch) {
    const [, sub, idxStr] = certMatch;
    const idx = parseInt(idxStr);
    if (sub === "name") {
      if (isSkipAnswer(answer)) return "awards";
      return `cert_issuer_${idx}` as StepId;
    }
    if (sub === "issuer") return `cert_year_${idx}` as StepId;
    if (sub === "year") return `cert_more_${idx}` as StepId;
    if (sub === "more") {
      if (/^yes$/i.test(answer.trim()) && idx + 1 < 5) return `cert_name_${idx + 1}` as StepId;
      return "awards";
    }
  }

  if (stepId === "awards") return "volunteering";
  if (stepId === "volunteering") return data.template === "fresher" ? "coursework" : "languages";
  if (stepId === "coursework") return "languages";
  if (stepId === "languages") return "linkedin";
  if (stepId === "linkedin") return "github";
  if (stepId === "github") return "portfolio";
  if (stepId === "portfolio") return "done";
  return "done";
}

function applyAnswer(stepId: StepId, answer: string, data: StructuredAnswers): StructuredAnswers {
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
    if (!projs[idx]) projs[idx] = { name: "", description: "", tools: "", result: "", github: "" };
    if (sub === "name") projs[idx] = { ...projs[idx], name: answer };
    if (sub === "desc") projs[idx] = { ...projs[idx], description: answer };
    if (sub === "tools") projs[idx] = { ...projs[idx], tools: answer };
    if (sub === "result") projs[idx] = { ...projs[idx], result: answer };
    if (sub === "github") projs[idx] = { ...projs[idx], github: isSkipAnswer(answer) ? "" : answer };
    return { ...d, projects: projs };
  }

  if (stepId === "progLangs") return { ...d, progLangs: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "frameworks") return { ...d, frameworks: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "tools") return { ...d, tools: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "networkingSkills") return { ...d, networkingSkills: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "softSkills") return { ...d, softSkills: isSkipAnswer(answer) ? "" : answer };

  const certMatch = (stepId as string).match(/^cert_(\w+)_(\d+)$/);
  if (certMatch) {
    const [, sub, idxStr] = certMatch;
    const idx = parseInt(idxStr);
    const certs = [...d.certifications];
    if (!certs[idx]) certs[idx] = { name: "", issuer: "", year: "" };
    if (sub === "name") {
      if (!isSkipAnswer(answer)) certs[idx] = { ...certs[idx], name: answer };
    }
    if (sub === "issuer") certs[idx] = { ...certs[idx], issuer: answer };
    if (sub === "year") certs[idx] = { ...certs[idx], year: answer };
    return { ...d, certifications: certs };
  }

  if (stepId === "awards") return { ...d, awards: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "volunteering") return { ...d, volunteering: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "coursework") return { ...d, coursework: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "languages") return { ...d, languages: answer };
  if (stepId === "linkedin") return { ...d, linkedin: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "github") return { ...d, github: isSkipAnswer(answer) ? "" : answer };
  if (stepId === "portfolio") return { ...d, portfolio: isSkipAnswer(answer) ? "" : answer };
  return d;
}

const INITIAL_ANSWERS: StructuredAnswers = {
  template: "fresher",
  name: "", phone: "", email: "", location: "",
  university: "", gradYear: "", targetRole: "",
  experience: [], projects: [],
  progLangs: "", frameworks: "", tools: "", networkingSkills: "", softSkills: "",
  certifications: [],
  awards: "", volunteering: "", coursework: "", languages: "",
  linkedin: "", github: "", portfolio: "",
};

const DRAFT_KEY = "hired_cv_draft";

function loadDraft(): { msgs: Msg[]; stepId: StepId; data: StructuredAnswers } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function BuildPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey. I will help you build a professional CV in a few minutes. Ready?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [stepId, setStepId] = useState<StepId>("name");
  const [data, setData] = useState<StructuredAnswers>(INITIAL_ANSWERS);
  const [cv, setCv] = useState<CV | null>(null);
  const [limitKey, setLimitKey] = useState<UsageKey | null>(null);
  const [history, setHistory] = useState<Array<{ stepId: StepId; data: StructuredAnswers; msgs: Msg[] }>>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialScrollDone = useRef(false);

  const handleFormSubmit = (formCv: CV) => {
    setCv(formCv);
    localStorage.setItem("hired_cv", JSON.stringify(formCv));
    syncCvToAccount(formCv).catch(console.error);
  };

  useEffect(() => {
    if (!thinking) setTimeout(() => inputRef.current?.focus(), 80);
  }, [thinking, stepId]);

  const msgCount = useRef(msgs.length);
  useEffect(() => {
    const prev = msgCount.current;
    msgCount.current = msgs.length;
    if (!initialScrollDone.current) { initialScrollDone.current = true; return; }
    if (msgs.length > prev) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  useEffect(() => {
    // Check auth status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (!user) setShowSignInBanner(true);
    });

    // Load existing CV
    const existing = localStorage.getItem("hired_cv");
    if (!existing) {
      loadCvFromAccount().then((accountCv) => {
        if (accountCv) { localStorage.setItem("hired_cv", JSON.stringify(accountCv)); setCv(accountCv); }
      }).catch(console.error);
    }

    // Restore draft
    const draft = loadDraft();
    if (draft && draft.stepId !== "name") {
      setMsgs(draft.msgs);
      setStepId(draft.stepId);
      setData(draft.data);
      const { question, hint } = getQuestion(draft.stepId);
      setMsgs((prev) => [...prev, { role: "ai", text: `Welcome back! Continuing where you left off.\n\n${hint ? `${question}\n\nTip: ${hint}` : question}` }]);
    } else {
      const timer = setTimeout(() => {
        const { question, hint } = getQuestion("name");
        setMsgs((prev) => [...prev, { role: "ai", text: hint ? `${question}\n\nTip: ${hint}` : question }]);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  async function send(rawAnswer?: string) {
    const text = (rawAnswer ?? input).trim();
    if (!text || thinking) return;

    setHistory((prev) => [...prev, { stepId, data, msgs }]);
    const newData = applyAnswer(stepId, text, data);
    setData(newData);

    const userMsg = text === "yes" ? "Yes" : text === "no" ? "No" : text;
    const newMsgs = [...msgs, { role: "user" as const, text: userMsg }];
    setMsgs(newMsgs);
    setInput("");

    const nextStep = getNextStep(stepId, text, newData);
    if (nextStep !== "done") {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ msgs: newMsgs, stepId: nextStep, data: newData }));
    }

    setStepId(nextStep);

    if (nextStep === "done") {
      // Show sign-in prompt if not logged in
      if (!isLoggedIn) {
        setThinking(false);
        setMsgs((prev) => [...prev, {
          role: "ai",
          text: "Almost there! Sign in to save your CV to your account so you never lose it. You can also continue without signing in.",
        }]);
        setShowSignInBanner(true);
        // Still build the CV — just won't be saved to account
      }
      setThinking(true);
      try {
        const res = await fetch("/api/build-cv", {
          method: "POST",
          body: JSON.stringify({ structured: newData }),
          headers: { "Content-Type": "application/json" },
        });
        if (res.status === 402) { setLimitKey("cv_builds"); setThinking(false); return; }
        const result = await res.json();
        setThinking(false);
        if (result.cv) {
          setMsgs((prev) => [...prev, { role: "ai", text: "Your CV is ready! Review it below and download when it looks right." }]);
          setCv(result.cv);
          localStorage.setItem("hired_cv", JSON.stringify(result.cv));
          syncCvToAccount(result.cv).catch(console.error);
          localStorage.removeItem(DRAFT_KEY);
        } else {
          throw new Error(result.detail ?? "No CV returned.");
        }
      } catch (err: any) {
        setThinking(false);
        setMsgs((prev) => [...prev, { role: "ai", text: `Error: ${err?.message ?? "Something went wrong. Please try again."}` }]);
      }
      return;
    }

    setThinking(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setThinking(false);
    const { question, hint } = getQuestion(nextStep);
    setMsgs((prev) => [...prev, { role: "ai", text: hint ? `${question}\n\nTip: ${hint}` : question }]);
  }

  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setStepId(prev.stepId);
    setData(prev.data);
    setMsgs(prev.msgs);
    setThinking(false);
  }

  function restartBuild() {
    setMsgs([{ role: "ai", text: "Hey. I will help you build a professional CV in a few minutes. Ready?" }]);
    setStepId("name");
    setData(INITIAL_ANSWERS);
    setCv(null);
    setHistory([]);
    setThinking(false);
    localStorage.removeItem(DRAFT_KEY);
    setTimeout(() => {
      const { question, hint } = getQuestion("name");
      setMsgs((prev) => [...prev, { role: "ai", text: hint ? `${question}\n\nTip: ${hint}` : question }]);
    }, 400);
  }

  async function handleCheckout(priceId: string) {
    const res = await fetch("/api/lemonsqueezy/checkout", {
      method: "POST",
      body: JSON.stringify({ variantId: priceId }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  }

  function saveAndScore() {
    if (!cv) return;
    localStorage.setItem("hired_cv", JSON.stringify(cv));
    syncCvToAccount(cv).catch(console.error);
    router.push("/score");
  }

  const fixedSteps = 18;
  const dynamicSteps = data.experience.length * 4 + data.projects.length * 5 + data.certifications.length * 3;
  const totalSteps = fixedSteps + dynamicSteps;
  const stepOrder = ["name","phone","email","location","university","gradYear","targetRole","hasExperience","progLangs","frameworks","tools","networkingSkills","softSkills","awards","volunteering","coursework","languages","linkedin","github","portfolio"];
  const baseIdx = stepOrder.indexOf(stepId as string);
  const completedFixed = baseIdx >= 0 ? baseIdx : stepOrder.length;
  const progress = Math.min((completedFixed / totalSteps) * 100, 95);
  const showYesNo = stepId === "hasExperience" || /^(exp|proj)_more_\d+$/.test(stepId as string) || /^cert_more_\d+$/.test(stepId as string);
  const currentQuestion = getQuestion(stepId);
  const filledFields = [data.name, data.email, data.location, data.university, data.gradYear, data.targetRole, data.progLangs].filter(Boolean).length;

  return (
    <>
      <Navbar />

      {/* Sign-in banner */}
      {showSignInBanner && !isLoggedIn && !cv && (
        <div className="sticky top-0 z-50 bg-[#F5B82E] text-black px-5 py-2.5 flex items-center justify-between gap-4 text-sm font-semibold">
          <span>Sign in to save your CV and never lose your progress.</span>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/auth/login?next=/build" className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-3 py-1.5 text-black hover:bg-black/25 transition text-xs font-bold">
              <LogIn size={13} /> Sign in
            </Link>
            <button onClick={() => setShowSignInBanner(false)} className="text-black/50 hover:text-black text-xs">Dismiss</button>
          </div>
        </div>
      )}

      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-one hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.40),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_370px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <FileText size={14} /> Build CV
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Build a clean CV through conversation.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Answer one question at a time, speak instead of typing, or paste everything at once. Hired.jo turns the raw details into an ATS-ready CV.
                </p>
                <div className="mt-7 grid sm:grid-cols-3 gap-3 max-w-3xl">
                  {[["01","Answer","Chat, voice, or paste"],["02","Generate","AI structures the CV"],["03","Use","Score, jobs, and roast"]].map(([number, label, detail]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <div className="text-yellow-200 text-xs font-bold">{number}</div>
                      <div className="font-display font-bold mt-1">{label}</div>
                      <div className="text-xs text-white/42 mt-1">{detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">CV progress</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{cv ? "Ready" : `${Math.round(progress)}%`}</p>
                      <p className="text-sm text-white/50">{cv ? "saved in browser" : "profile details collected"}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                      <Sparkles size={23} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Target size={16} className="text-yellow-200" /> Current step
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      {cv ? "Your generated CV is ready for review." : currentQuestion.question}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{filledFields}</div>
                      <div className="text-[11px] text-white/40">Fields filled</div>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{data.projects.length}</div>
                      <div className="text-[11px] text-white/40">Projects</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {!cv && (
            <section className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
              <aside className="glass rounded-[28px] p-5 md:p-6 sticky top-6 overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">Input mode</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
                      <button onClick={() => setMode("chat")} className={`rounded-xl px-3 py-3 text-sm font-extrabold transition ${mode === "chat" ? "gold-grad text-black" : "text-white/55 hover:text-white"}`}>
                        <span className="inline-flex items-center gap-2"><MessageSquareText size={16} /> Chat</span>
                      </button>
                      <button onClick={() => setMode("form")} className={`rounded-xl px-3 py-3 text-sm font-extrabold transition ${mode === "form" ? "gold-grad text-black" : "text-white/55 hover:text-white"}`}>
                        <span className="inline-flex items-center gap-2"><ClipboardPenLine size={16} /> Paste</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-center justify-between text-xs text-white/42 mb-2">
                      <span>Step {Math.min(completedFixed + 1, totalSteps)} of {totalSteps}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full gold-grad transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {[["Name", data.name], ["Target", data.targetRole], ["University", data.university], ["Skills", data.progLangs]].map(([label, value]) => (
                        <div key={label} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 size={15} className={value ? "text-green-300" : "text-white/20"} />
                          <span className="text-white/45">{label}</span>
                          <span className="ml-auto max-w-[170px] truncate text-white/72">{value || "Waiting"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <div className="h-11 w-11 rounded-2xl gold-grad text-black flex items-center justify-center mb-4">
                      <Bot size={21} />
                    </div>
                    <h2 className="font-display text-xl font-bold">ATS-ready CV</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      Your CV is built to pass applicant tracking systems — structured sections, strong action verbs, and quantified results.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden min-h-[620px]">
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="relative">
                  {mode === "form" ? (
                    <CvBulkForm onSubmit={handleFormSubmit} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl gold-grad text-black flex items-center justify-center">
                            <MessageSquareText size={22} />
                          </div>
                          <div>
                            <h2 className="font-display text-xl font-bold">CV interview</h2>
                            <p className="text-xs text-white/42">Answer naturally. Short answers are fine.</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/45">
                          {showYesNo ? "Choose" : "Type or speak"}
                        </span>
                      </div>

                      <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 h-[430px] overflow-y-auto flex flex-col gap-3">
                        {msgs.map((message, index) => (
                          <div key={index} className={`flex chat-bubble ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={message.role === "user"
                              ? "max-w-[82%] rounded-2xl rounded-br-sm gold-grad px-4 py-3 text-sm font-semibold text-black"
                              : "max-w-[82%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/78"
                            }>
                              {message.text.split("\n").map((line, lineIndex) => (
                                <span key={lineIndex} className={line.startsWith("Tip:") ? "text-white/45 text-xs" : ""}>
                                  {line}
                                  {lineIndex < message.text.split("\n").length - 1 && <br />}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {thinking && (
                          <div className="flex justify-start">
                            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/45">
                              <Loader2 size={15} className="animate-spin text-yellow-200" />
                              {stepId === "done" ? "Building your CV. This can take 10–20 seconds." : "Thinking..."}
                            </div>
                          </div>
                        )}
                        <div ref={bottomRef} />
                      </div>

                      {showYesNo ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button onClick={() => send("yes")} disabled={thinking} className="rounded-2xl gold-grad px-5 py-4 text-black font-extrabold disabled:opacity-40">Yes</button>
                          <button onClick={() => send("no")} disabled={thinking} className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-4 font-extrabold text-white/75 hover:text-white disabled:opacity-40">No</button>
                        </div>
                      ) : (
                        <div className="mt-4 flex gap-2 items-center">
                          {history.length > 0 && (
                            <button onClick={goBack} className="shrink-0 rounded-2xl border border-white/15 px-3 py-3 text-white/50 hover:text-white hover:border-white/30 transition text-xs font-semibold" title="Go back">
                              ← Back
                            </button>
                          )}
                          <VoiceRecorder onTranscript={setInput} />
                          <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            className="min-w-0 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-yellow-300/45"
                            placeholder="Type your answer..."
                            disabled={thinking}
                            autoFocus
                          />
                          <button onClick={() => send()} disabled={thinking || !input.trim()} className="rounded-2xl gold-grad px-5 py-3 text-black font-extrabold disabled:opacity-40 shrink-0 inline-flex items-center gap-2">
                            Send <Send size={15} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {cv && (
            <section className="space-y-5">
              <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                      <UserRound size={23} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">CV generated</p>
                      <h2 className="font-display text-2xl font-bold text-grad">{cv.fullName || "Your CV"}</h2>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={saveAndScore} className="gold-grad text-black font-extrabold px-5 py-3 rounded-2xl inline-flex items-center gap-2">
                      Save and get score <ArrowRight size={16} />
                    </button>
                    <button onClick={() => router.push("/jobs")} className="purple-grad text-white font-extrabold px-5 py-3 rounded-2xl">
                      Browse jobs
                    </button>
                    <button onClick={restartBuild} className="rounded-2xl border border-white/15 px-5 py-3 text-white/60 hover:text-white hover:border-white/30 transition font-semibold inline-flex items-center gap-2">
                      ↺ Rebuild CV
                    </button>
                  </div>
                </div>
              </div>
              <CvPreview cv={cv} />
              <CvSectionEditor cv={cv} onCvUpdated={(updated) => { setCv(updated); syncCvToAccount(updated).catch(console.error); }} />
            </section>
          )}
        </div>
      </main>

      {limitKey && (
        <UpgradeModal usageKey={limitKey} onClose={() => setLimitKey(null)} onCheckout={handleCheckout} />
      )}
    </>
  );
}
