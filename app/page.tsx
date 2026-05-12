import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link href="/" className="font-display font-bold text-2xl tracking-tight">
          Hired<span style={{ color: "var(--gold)" }}>.jo</span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm text-white/60">
          <Link className="hover:text-white" href="/build">Build CV</Link>
          <Link className="hover:text-white" href="/jobs">Find Jobs</Link>
          <Link className="hover:text-white" href="/score">My Score</Link>
          <Link className="hover:text-white" href="/dashboard">Market</Link>
          <Link className="hover:text-white" href="/cofounder">Co-founders</Link>
          <Link className="hover:text-white" href="/leaderboard">Leaderboard</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-2 text-xs text-white/50 px-3 py-1.5 rounded-full glass">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live · 60 jobs scraped
          </span>
          <Link href="/build" className="px-4 py-2 rounded-full gold-grad text-black text-sm font-bold ring-gold">
            Get hired →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-8 pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">

          {/* LEFT */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs mb-6">
              <span style={{ color: "var(--gold)" }}>⬢</span>
              <span className="text-white/70">Made in Jordan · Powered by Gemini 2.0</span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] text-grad">
              From graduate<br />
              to <span className="gold-text-grad">hired</span>.
            </h1>
            <p className="mt-6 text-lg text-white/65 max-w-xl leading-relaxed">
              The AI career copilot for Jordanian graduates. It <b className="text-white">interviews</b> you to build your CV, scrapes <b className="text-white">real Jordan jobs</b>, and tells you exactly what to learn to <b className="text-white">get hired</b>.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/build" className="group inline-flex items-center gap-3 px-6 py-4 rounded-2xl gold-grad text-black font-bold ring-gold">
                <span className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center">🗣</span>
                Build my CV
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/roast" className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass font-semibold text-white">
                🔥 <span>Roast my CV</span>
              </Link>
              <Link href="/jobs" className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass font-semibold text-white">
                📊 <span>Browse Jordan jobs</span>
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-6 text-xs text-white/40">
              <div className="flex -space-x-2">
                {["from-purple-500 to-pink-500","from-amber-400 to-orange-500","from-emerald-400 to-teal-500","from-blue-400 to-indigo-600"].map((g, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2`} style={{ borderColor: "var(--ink)" }}></div>
                ))}
              </div>
              <span>Job feed: <b className="text-white/80">Akhtaboot · Bayt · Wuzzuf · Fursa · LinkedIn · Indeed · Glassdoor · Naukrigulf · GulfTalent · Tanqeeb</b></span>
              <span className="hidden md:inline">Updated <b className="text-white/80">May 2026</b></span>
            </div>
          </div>

          {/* RIGHT: chat mockup */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 purple-grad opacity-25 blur-3xl rounded-[40px]"></div>
              <div className="relative glass rounded-[28px] p-5 float">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-xs text-white/40">hired.jo/build</span>
                  <div className="pulse-ring w-2 h-2 rounded-full" style={{ background: "var(--gold)" }}></div>
                </div>
                <div className="space-y-2">
                  <div className="chat-bubble chat-1 flex">
                    <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm max-w-[85%]">
                      Hey! I&apos;ll help you build a CV in 5 minutes. What&apos;s your full name?
                    </div>
                  </div>
                  <div className="chat-bubble chat-2 flex justify-end">
                    <div className="px-4 py-2.5 rounded-2xl rounded-br-sm gold-grad text-black text-sm font-medium max-w-[85%]">
                      Khalid Masoud — CE student at Hashemite University.
                    </div>
                  </div>
                  <div className="chat-bubble chat-3 flex">
                    <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm max-w-[85%]">
                      Nice. Tell me about your strongest graduation project — what problem did it solve?
                    </div>
                  </div>
                  <div className="chat-bubble chat-4 flex justify-end">
                    <div className="px-4 py-2.5 rounded-2xl rounded-br-sm gold-grad text-black text-sm font-medium max-w-[85%]">
                      Real-time pose-estimation app in Flutter + TF-Lite, 30 FPS on mid-range Android.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 blink"></span>
                    AI is writing your CV…
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
                  <button className="w-9 h-9 rounded-xl gold-grad text-black font-bold flex items-center justify-center text-lg">🎤</button>
                  <div className="flex-1 text-sm text-white/40 px-2">Type or speak your answer…</div>
                  <button className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold">Send</button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[["5m","avg build"],["0–1000","hired score"],["60","JO jobs"]].map(([val, label]) => (
                    <div key={label} className="p-2 rounded-xl bg-white/5">
                      <div className="font-display font-bold text-lg gold-text-grad">{val}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 glass rounded-2xl px-4 py-3 shadow-2xl">
                <div className="text-[10px] uppercase tracking-widest text-white/40">CV ready</div>
                <div className="font-display font-bold text-xl">Khalid_Masoud_CV.pdf</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
