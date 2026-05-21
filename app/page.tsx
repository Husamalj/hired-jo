"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BotMessageSquare,
  Flame,
  Handshake,
  Mail,
  Mic,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";

const TOTAL_FRAMES = 145;
const ROAST_URL = "https://hired-jo-zrgu.vercel.app/roast";

type Feature = {
  icon: LucideIcon;
  gold: boolean;
  title: string;
  href: string;
  desc: string;
  signal: string;
  outcome: string;
  metric: string;
  badge?: string;
};

const FEATURES: Feature[] = [
  {
    icon: BotMessageSquare,
    gold: true,
    title: "Chat-to-CV",
    href: "/build",
    desc: "The AI interviews you in 5 minutes. No blank pages. Bullets follow the STAR pattern.",
    signal: "Voice or chat answers become clean CV bullets",
    outcome: "ATS-ready PDF",
    metric: "5 min",
  },
  {
    icon: Mic,
    gold: false,
    title: "Voice Mode",
    href: "/build",
    desc: "Speak in English. Your CV writes itself live. Powered by Web Speech.",
    signal: "Talk through projects, skills, and wins",
    outcome: "Hands-free CV draft",
    metric: "Live",
  },
  {
    icon: BarChart3,
    gold: false,
    title: "Market Dashboard",
    href: "/dashboard",
    desc: "Real-time view of top skills, salaries, and cities scraped from Akhtaboot, Bayt, Wuzzuf.",
    signal: "Jordan jobs turn into salary and skill trends",
    outcome: "Market clarity",
    metric: "60+ jobs",
  },
  {
    icon: Target,
    gold: true,
    title: "Job Fit Simulator",
    href: "/jobs",
    desc: "Pick any job. Get a match score, missing skills, and a CV rewritten just for it.",
    signal: "Compare your CV against a real role",
    outcome: "Gap report",
    metric: "0-100",
  },
  {
    icon: Trophy,
    gold: false,
    title: "Hired Score",
    href: "/score",
    desc: "A 0-1000 score across four dimensions, with a public leaderboard you can climb.",
    signal: "Your profile gets scored across readiness signals",
    outcome: "Rank + next step",
    metric: "1000",
  },
  {
    icon: Mail,
    gold: false,
    title: "Cover Letter Gen",
    href: "/cover",
    desc: "One click. A tailored cover letter ready to send.",
    signal: "Your CV connects directly to the job post",
    outcome: "Human letter",
    metric: "10 sec",
  },
  {
    icon: Handshake,
    gold: true,
    title: "Find My Co-founder",
    href: "/cofounder",
    desc: "Embedding-based match by complementary skills, then send a real email.",
    signal: "Match by complementary skills and build style",
    outcome: "Founder intro",
    metric: "Top 3",
  },
  {
    icon: Flame,
    gold: false,
    title: "Roast My CV",
    href: "/roast",
    desc: "Scan a QR. Paste your CV. Get scored, roasted, and rewritten in 10 seconds.",
    signal: "Brutal feedback becomes a practical rewrite",
    outcome: "Better CV",
    metric: "Demo",
    badge: "demo",
  },
];

const STATS = [
  { value: "46%", label: "Jordan youth unemployment", note: "The urgency" },
  { value: "75%", label: "CVs killed by ATS", note: "The blocker" },
  { value: "~40%", label: "jobs filled via wasta", note: "The reality" },
  { value: "0", label: "tools showing real JO data", note: "The gap" },
];

function ScrollHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let done = 0;
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/f${String(i).padStart(3, "0")}.jpg`;
      img.onload = () => {
        done++;
        setLoadCount(done);
        if (done === TOTAL_FRAMES) {
          setLoaded(true);
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx) ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
        }
      };
      images.push(img);
    }
    framesRef.current = images;
  }, []);

  useEffect(() => {
    if (!loaded) return;
    function onScroll() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!container || !canvas || !ctx) return;
      const p = Math.min(1, Math.max(0, window.scrollY / (container.offsetHeight - window.innerHeight)));
      setProgress(p);
      const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(p * TOTAL_FRAMES));
      const img = framesRef.current[idx];
      if (img?.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded]);

  const s1 = op(progress, 0, 0.12, 0.25, 0.35);
  const s2 = op(progress, 0.32, 0.44, 0.57, 0.67);
  const s3 = op(progress, 0.65, 0.76, 99, 99);

  return (
    <div ref={containerRef} style={{ height: "280vh" }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} width={1280} height={720}
          className="absolute inset-0 w-full h-full object-cover" />

        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "#0A0716" }}>
            <div className="text-white/50 text-sm mb-3 font-display">Loading experience…</div>
            <div className="w-48 h-1 rounded-full bg-white/10">
              <div className="h-full rounded-full gold-grad transition-all duration-100"
                style={{ width: `${(loadCount / TOTAL_FRAMES) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(10,7,22,0.55) 0%, rgba(10,7,22,0.2) 50%, rgba(10,7,22,0.7) 100%)" }} />

        {/* Navbar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <Navbar />
        </div>

        {/* Scene 1 */}
        <div className="absolute inset-0 flex items-center px-10 md:px-24 pointer-events-none"
          style={{ opacity: s1, transition: "opacity 0.4s ease" }}>
          <div className="max-w-2xl">
            <p className="text-white/50 uppercase tracking-widest text-xs mb-4">Jordan, 2026</p>
            <h1 className="font-display font-extrabold leading-tight mb-5"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
              46% of graduates<br />
              <span style={{ color: "#F5B82E" }}>can't find work.</span>
            </h1>
            <p className="text-white/70 text-lg" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
              Your CV is rejected before a human ever reads it.
            </p>
          </div>
        </div>

        {/* Scene 2 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: s2, transition: "opacity 0.4s ease" }}>
          <div className="text-center max-w-2xl px-8">
            <p className="text-white/50 uppercase tracking-widest text-xs mb-4">The fix</p>
            <h2 className="font-display font-extrabold leading-tight mb-5"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
              Your story <span style={{ color: "#F5B82E" }}>deserves</span><br />to be told right.
            </h2>
            <p className="text-white/70 text-lg" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
              Experience ✓ &nbsp;&nbsp; Skills ⚡ &nbsp;&nbsp; Summary ✨
            </p>
          </div>
        </div>

        {/* Scene 3 — CTA buttons sitting in the golden lower third */}
        <div className="absolute inset-x-0 bottom-16 flex justify-center"
          style={{ opacity: s3, transition: "opacity 0.4s ease", pointerEvents: s3 > 0.5 ? "auto" : "none" }}>
          <div className="flex flex-col items-center gap-4"
            style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))" }}>
            <Link href="/build"
              className="px-14 py-6 rounded-2xl gold-grad text-black font-extrabold text-2xl tracking-tight">
              Build my CV
            </Link>
            <Link href="/roast"
              className="px-10 py-5 rounded-2xl font-extrabold text-xl tracking-tight text-white"
              style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", backdropFilter: "blur(12px)" }}>
              Roast my CV
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div className="h-full gold-grad" style={{ width: `${progress * 100}%`, transition: "width 0.05s linear" }} />
        </div>

        {loaded && progress < 0.03 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-sm animate-bounce">
            <span>scroll</span><span>↓</span>
          </div>
        )}
      </div>
    </div>
  );
}

function op(p: number, i0: number, i1: number, o0: number, o1: number) {
  if (p < i0) return 0;
  if (p < i1) return (p - i0) / (i1 - i0);
  if (p < o0) return 1;
  if (p < o1) return 1 - (p - o0) / (o1 - o0);
  return 0;
}

function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const selectedFeature = FEATURES[activeFeature];
  const SelectedIcon = selectedFeature.icon;

  return (
    <section className="px-5 md:px-8 py-24 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-end mb-12">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--gold)" }}>What it does</div>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-grad leading-tight">Everything you need to land your first job.</h2>
        </div>
        <div className="lg:justify-self-end max-w-md">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-5">
            <div
              className="h-full gold-grad transition-all duration-500"
              style={{ width: `${((activeFeature + 1) / FEATURES.length) * 100}%` }}
            />
          </div>
          <p className="text-white/55 leading-relaxed">Hover a tool to see how it moves a graduate from blank page to confident application.</p>
        </div>
      </div>

        <div className="grid lg:grid-cols-[1fr_390px] gap-5 lg:gap-7 items-start">
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {FEATURES.map(({ icon: Icon, gold, title, href, desc, badge }, i) => {
            const isActive = i === activeFeature;
            return (
              <Link
                key={title}
                href={href}
                onMouseEnter={() => setActiveFeature(i)}
                onFocus={() => setActiveFeature(i)}
                aria-current={isActive ? "step" : undefined}
                className={`feature-card group relative min-h-[184px] overflow-hidden rounded-2xl p-5 transition duration-300 ${
                  isActive ? "feature-card-active" : "glass hover:bg-white/[0.07]"
                }`}
              >
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${gold || isActive ? "gold-grad text-black" : "bg-white/10 text-white"} flex items-center justify-center shrink-0 transition`}>
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/30">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-xl mt-5 mb-2">
                  {title}
                  {badge && <span className="text-[10px] uppercase ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-200">demo</span>}
                </h3>
                <p className="text-sm text-white/58 leading-relaxed">{desc}</p>
                <div className={`mt-5 text-xs font-bold ${isActive ? "text-yellow-200" : "text-white/0"} transition`}>
                  Open tool
                </div>
              </Link>
            );
          })}
        </div>

          <aside className="order-first lg:order-none lg:sticky lg:top-8 glass rounded-[28px] p-5 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                  <SelectedIcon size={23} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Active tool</p>
                  <h3 className="font-display text-2xl font-bold">{selectedFeature.title}</h3>
                </div>
              </div>
              <div className="rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-sm font-bold text-yellow-100">
                {selectedFeature.metric}
              </div>
            </div>

            <div className="relative mb-7 rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="absolute left-8 top-8 bottom-8 w-px bg-white/10" />
              {[
                { label: "Input", value: selectedFeature.signal },
                { label: "Hired.jo", value: "AI turns messy career data into a focused next move" },
                { label: "Output", value: selectedFeature.outcome },
              ].map((step, i) => (
                <div key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className={`z-10 mt-1 h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    i === 1 ? "gold-grad text-black border-transparent workflow-pulse" : "bg-[#0A0716] border-white/15 text-white/50"
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">{step.label}</p>
                    <p className="text-sm text-white/75 mt-1 leading-relaxed">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-7">
              {FEATURES.map((feature, i) => (
                <button
                  key={feature.title}
                  type="button"
                  aria-label={`Preview ${feature.title}`}
                  onClick={() => setActiveFeature(i)}
                  className={`h-2 rounded-full transition ${i === activeFeature ? "gold-grad" : "bg-white/10 hover:bg-white/20"}`}
                />
              ))}
            </div>

            <Link href={selectedFeature.href} className="group flex items-center justify-between rounded-2xl gold-grad px-5 py-4 text-black font-extrabold">
              Try {selectedFeature.title}
              <span className="transition group-hover:translate-x-1">-&gt;</span>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function QrCallout() {
  return (
    <section className="px-5 md:px-8 pb-24">
      <div className="max-w-7xl mx-auto rounded-[32px] relative overflow-hidden border border-white/10 bg-[#140E2A]">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,184,46,.20),transparent_32%),radial-gradient(circle_at_82%_70%,rgba(91,63,200,.65),transparent_45%)]" />
        <div className="relative grid lg:grid-cols-[1fr_360px] gap-10 items-center p-8 md:p-12 lg:p-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-yellow-200 mb-5">
              Live demo
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-extrabold mb-5 leading-tight">
              Scan the roast room.<br />Paste a CV. Get the verdict.
            </h2>
            <p className="text-white/72 max-w-2xl text-lg leading-relaxed">
              Built for judges and live audiences: no account, no setup, just a phone scan and a brutally useful CV roast in seconds.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-2xl">
              {[
                ["01", "Scan"],
                ["02", "Paste CV"],
                ["03", "Roast + fixes"],
              ].map(([number, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <div className="text-yellow-200 text-xs font-bold">{number}</div>
                  <div className="font-display font-bold mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs border border-white/10">100% anonymous</span>
              <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs border border-white/10">No sign-up</span>
              <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs border border-white/10">Phone-ready demo</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <a
              href={ROAST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-[28px] bg-white p-5 shadow-2xl ring-gold transition duration-300 hover:-translate-y-1"
              aria-label="Open the Hired.jo roast demo"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white p-3">
                <QRCodeSVG
                  value={ROAST_URL}
                  size={208}
                  bgColor="#ffffff"
                  fgColor="#0A0716"
                  level="H"
                  marginSize={2}
                />
                <div className="qr-scan-line pointer-events-none" />
              </div>
              <div className="mt-4 rounded-2xl bg-[#0A0716] px-4 py-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Scan or tap</div>
                <div className="text-white font-bold text-[11px] sm:text-sm mt-1 whitespace-nowrap">hired-jo-zrgu.vercel.app/roast</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="px-5 md:px-8 pt-10">
      <div className="max-w-7xl mx-auto rounded-[28px] border border-white/10 bg-white/[0.035] p-3 md:p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
                className="stat-tile rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 md:px-5 md:py-4"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-3xl font-extrabold gold-text-grad">{stat.value}</div>
                  <div className="text-white/72 font-bold mt-1">{stat.label}</div>
                </div>
                <span className="mt-1 h-2.5 w-2.5 rounded-full gold-grad shadow-[0_0_18px_rgba(245,184,46,.65)]" />
              </div>
              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/32">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Crawler-visible SEO content — visually hidden, fully readable to search engines and AI agents */}
      <div className="sr-only">
        <h1>Hired.jo — From graduate to hired. The AI career copilot for Jordanian graduates.</h1>
        <p>
          Hired.jo helps Jordanian graduates build an ATS-ready CV in 5 minutes through a friendly AI interview,
          match against 60+ live Jordan jobs scraped from Akhtaboot, Bayt, Wuzzuf, Fursa, LinkedIn, Indeed,
          Glassdoor, Naukrigulf, GulfTalent, and Tanqeeb, and get a personalized Hired Score (0–1000) with
          a learning plan to close the gap to the role you want.
        </p>
        <h2>What Hired.jo does</h2>
        <ul>
          <li>Build my CV — AI interviews you and writes a clean ATS-ready CV, free PDF download.</li>
          <li>Find Jobs — live Jordan job board with AI matching against your CV.</li>
          <li>My Score — Hired Score out of 1000 plus tips to improve it.</li>
          <li>Roast my CV — brutally honest AI feedback on your resume.</li>
          <li>Cover Letter — tailored cover letters in 10 seconds.</li>
          <li>Co-founder — match with complementary founders in Jordan.</li>
          <li>Leaderboard — see how you rank against other Jordanian graduates.</li>
          <li>Market Dashboard — live analytics on top skills, salaries, and hiring trends across Jordan.</li>
        </ul>
      </div>

      <ScrollHero />

      <div className="post-hero-world relative -mt-12 overflow-hidden pt-12">
        <div className="hero-to-content-fade" />
        <div className="paper-bg paper-bg-one" />
        <div className="paper-bg paper-bg-two" />
        <div className="relative z-10">

      {/* STATS STRIP */}
      <StatsBand />
      <section className="hidden">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-lg font-display font-bold text-white/30">
          {["46% Jordan youth unemployment","75% of CVs killed by ATS","~40% of jobs filled via wasta","0 tools showing real JO data"].map((t, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span style={{ color: "var(--gold)" }}>●</span>}
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <FeatureShowcase />
      <section className="hidden">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--gold)" }}>What it does</div>
            <h2 className="font-display text-5xl font-bold text-grad">Everything you need to land your first job.</h2>
          </div>
          <p className="text-white/50 max-w-xs">Eight features, one workflow. From blank page to signed offer letter.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🗣", gold: true,  title: "Chat-to-CV",         href: "/build",     desc: "The AI interviews you in 5 minutes. No blank pages. Bullets follow the STAR pattern." },
            { icon: "🎤", gold: false, title: "Voice Mode",         href: "/build",     desc: "Speak in English. Your CV writes itself live. Powered by Web Speech." },
            { icon: "📊", gold: false, title: "Market Dashboard",   href: "/dashboard", desc: "Real-time view of top skills, salaries, and cities — scraped from Akhtaboot, Bayt, Wuzzuf." },
            { icon: "🎯", gold: true,  title: "Job Fit Simulator",  href: "/jobs",      desc: "Pick any job. Get a match score, missing skills, and a CV rewritten just for it." },
            { icon: "🏆", gold: false, title: "Hired Score",        href: "/score",     desc: "A 0–1000 score across four dimensions, with a public leaderboard you can climb." },
            { icon: "✉",  gold: false, title: "Cover Letter Gen",   href: "/build",     desc: "One click. A tailored cover letter + mailto: link ready to fire." },
            { icon: "🤝", gold: true,  title: "Find My Co-founder", href: "/cofounder", desc: "Embedding-based match by complementary skills, then send a real email." },
            { icon: "🔥", gold: false, title: "Roast My CV",        href: "/roast",     desc: "Scan a QR. Paste your CV. Get scored, roasted, and rewritten in 10 seconds.", badge: true },
          ].map(({ icon, gold, title, href, desc, badge }) => (
            <Link key={title} href={href} className="group p-6 rounded-3xl glass hover:bg-white/[0.07] transition block">
              <div className={`w-12 h-12 rounded-2xl ${gold ? "gold-grad text-black" : "bg-white/10"} text-2xl flex items-center justify-center mb-5`}>{icon}</div>
              <h3 className="font-display font-bold text-xl mb-2">
                {title}
                {badge && <span className="text-[10px] uppercase ml-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">demo</span>}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* QR CALLOUT */}
      <QrCallout />
      <section className="hidden">
        <div className="max-w-7xl mx-auto rounded-[32px] purple-grad p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-20"></div>
          <div className="relative grid md:grid-cols-3 gap-10 items-center">
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--gold)" }}>Try it now</div>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Scan. Paste your CV.<br />Watch it get <span className="gold-text-grad">roasted</span>.
              </h2>
              <p className="text-white/80 max-w-lg">
                We&apos;re presenting this live. Scan the code, paste any CV, get a brutal-but-useful roast plus a glow-up rewrite — in under 10 seconds.
              </p>
              <div className="mt-6 flex gap-3">
                <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs">100% anonymous</span>
                <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs">No sign-up</span>
                <span className="px-3 py-1.5 rounded-full bg-black/30 text-xs">Free forever</span>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="bg-white p-5 rounded-3xl shadow-2xl ring-gold">
                <div className="w-44 h-44 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="#0A0716"/>
                    <g fill="#F5F2FF">
                      <rect x="6" y="6" width="22" height="22" fill="#fff"/><rect x="10" y="10" width="14" height="14" fill="#0A0716"/><rect x="13" y="13" width="8" height="8" fill="#fff"/>
                      <rect x="72" y="6" width="22" height="22" fill="#fff"/><rect x="76" y="10" width="14" height="14" fill="#0A0716"/><rect x="79" y="13" width="8" height="8" fill="#fff"/>
                      <rect x="6" y="72" width="22" height="22" fill="#fff"/><rect x="10" y="76" width="14" height="14" fill="#0A0716"/><rect x="13" y="79" width="8" height="8" fill="#fff"/>
                      <rect x="34" y="8" width="4" height="4"/><rect x="42" y="8" width="4" height="4"/><rect x="50" y="12" width="4" height="4"/><rect x="58" y="8" width="4" height="4"/>
                      <rect x="34" y="32" width="4" height="4"/><rect x="40" y="36" width="4" height="4"/><rect x="48" y="34" width="4" height="4"/><rect x="56" y="38" width="4" height="4"/>
                      <rect x="8" y="40" width="4" height="4"/><rect x="16" y="44" width="4" height="4"/><rect x="24" y="38" width="4" height="4"/><rect x="32" y="46" width="4" height="4"/>
                      <rect x="40" y="50" width="4" height="4"/><rect x="48" y="48" width="4" height="4"/><rect x="56" y="54" width="4" height="4"/><rect x="64" y="50" width="4" height="4"/>
                      <rect x="72" y="56" width="4" height="4"/><rect x="80" y="52" width="4" height="4"/><rect x="36" y="74" width="4" height="4"/><rect x="44" y="78" width="4" height="4"/>
                      <rect x="52" y="76" width="4" height="4"/><rect x="60" y="82" width="4" height="4"/><rect x="38" y="86" width="4" height="4"/><rect x="46" y="90" width="4" height="4"/>
                    </g>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl gold-grad flex items-center justify-center text-black font-bold text-sm">.jo</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-black font-bold text-sm">hired-jo-zrgu.vercel.app/roast</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 md:px-8 py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-white/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display font-bold text-lg tracking-tight">Hired<span style={{ color: "var(--gold)", letterSpacing: 0 }}>.jo</span></span>
            <span>·</span>
            <span>AI Career Copilot for Arab Graduates</span>
          </div>
          <a href="https://github.com/Husamalj/hired-jo" className="hover:text-white" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>

        </div>
      </div>

    </div>
  );
}
