"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TOTAL_FRAMES = 145;

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

        {/* Navbar inside hero */}
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20">
          <Link href="/" className="font-display font-bold text-2xl tracking-tight">
            Hired<span style={{ color: "var(--gold)" }}>.jo</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm text-white/70">
            <Link className="hover:text-white" href="/build">Build CV</Link>
            <Link className="hover:text-white" href="/jobs">Find Jobs</Link>
            <Link className="hover:text-white" href="/score">My Score</Link>
            <Link className="hover:text-white" href="/dashboard">Market</Link>
            <Link className="hover:text-white" href="/cofounder">Co-founders</Link>
            <Link className="hover:text-white" href="/leaderboard">Leaderboard</Link>
          </div>
          <Link href="/build" className="px-4 py-2 rounded-full gold-grad text-black text-sm font-bold">
            Get hired →
          </Link>
        </nav>

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

        {/* Scene 3 — video has Hired.jo baked in, just show the CTA buttons */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: s3, transition: "opacity 0.4s ease", pointerEvents: s3 > 0.5 ? "auto" : "none" }}>
          <div className="text-center px-8">
            <div className="flex gap-4 flex-wrap justify-center items-center">
              <Link href="/build" className="px-8 py-4 rounded-2xl gold-grad text-black font-bold text-lg">
                Build my CV
              </Link>
              <Link href="/roast" className="px-8 py-4 rounded-2xl glass text-white font-bold text-lg">
                Roast my CV
              </Link>
            </div>
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

      {/* STATS STRIP */}
      <section className="border-y border-white/5 py-5 mt-8">
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
      <section className="px-8 py-24 max-w-7xl mx-auto">
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
      <section className="px-8 pb-24">
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
      <footer className="px-8 py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg">Hired<span style={{ color: "var(--gold)" }}>.jo</span></span>
            <span>·</span>
            <span>Built at HU AI Employability Hackathon 2026</span>
          </div>
          <a href="https://github.com/Husamalj/hired-jo" className="hover:text-white" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>

    </div>
  );
}
