"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Handshake,
  Loader2,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

type Match = {
  id: number;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
  matchScore: number;
};

type Step = "register" | "find" | "results";

const starterPrompts = [
  "React, Python, UI Design",
  "FinTech, HealthTech, EdTech",
  "I want to build useful tools for Jordanian students.",
];

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CofounderPage() {
  const [step, setStep] = useState<Step>("register");
  const [form, setForm] = useState({
    alias: "",
    email: "",
    skills: "",
    interests: "",
    vibe: "",
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cofounder_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(parsed);
        setRegistered(true);
        setStep("find");
      } catch {
        localStorage.removeItem("cofounder_profile");
      }
    }
  }, []);

  async function register() {
    if (!form.alias || !form.email || !form.skills) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          alias: form.alias,
          email: form.email,
          skills: parseList(form.skills),
          interests: parseList(form.interests),
          vibe: form.vibe,
        }),
      });
      if (!res.ok) throw new Error("Could not save the profile.");
      setRegistered(true);
      setStep("find");
      localStorage.setItem("cofounder_profile", JSON.stringify(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile.");
    } finally {
      setLoading(false);
    }
  }

  async function findMatch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "match",
          skills: parseList(form.skills),
          interests: parseList(form.interests),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find matches.");
      setMatches(data.matches ?? []);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find matches.");
    } finally {
      setLoading(false);
    }
  }

  function resetProfile() {
    localStorage.removeItem("cofounder_profile");
    setStep("register");
    setRegistered(false);
    setMatches([]);
    setError("");
    setForm({ alias: "", email: "", skills: "", interests: "", vibe: "" });
  }

  const skillList = parseList(form.skills);
  const interestList = parseList(form.interests);
  const profileStrength = Math.round(
    ([form.alias, form.email, form.skills, form.interests, form.vibe].filter(Boolean).length / 5) * 100
  );

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-two hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.40),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_370px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Handshake size={14} />
                  Co-founder matching
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Find the teammate your idea is missing.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Register a lightweight founder profile, then match by complementary skills, shared interests, and building style.
                </p>
                <div className="mt-7 grid sm:grid-cols-3 gap-3 max-w-3xl">
                  {[
                    ["01", "Profile", "Skills and interests"],
                    ["02", "Match", "Complementary founders"],
                    ["03", "Connect", "Email intro ready"],
                  ].map(([number, label, detail]) => (
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
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Profile signal</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{profileStrength}%</p>
                      <p className="text-sm text-white/50">{registered ? "ready to match" : "complete your profile"}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                      <Users size={23} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <ShieldCheck size={16} className="text-yellow-200" />
                      Hackathon-safe intro
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      The feature is designed for fast team formation: short profiles, clear strengths, and a direct email path.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{skillList.length}</div>
                      <div className="text-[11px] text-white/40">Skills</div>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{interestList.length}</div>
                      <div className="text-[11px] text-white/40">Interests</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid lg:grid-cols-[430px_1fr] gap-5 items-start">
            <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl gold-grad text-black flex items-center justify-center">
                    {step === "register" ? <UserPlus size={22} /> : <Search size={22} />}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{step === "register" ? "Founder profile" : "Match control"}</h2>
                    <p className="text-xs text-white/42">Keep it short, specific, and useful</p>
                  </div>
                </div>

                {step === "register" && (
                  <div className="space-y-3">
                    {[
                      ["alias", "Display name", "Use a name judges can recognize"],
                      ["email", "Email", "Shared only in the connect action"],
                      ["skills", "Skills", starterPrompts[0]],
                      ["interests", "Startup interests", starterPrompts[1]],
                    ].map(([key, label, placeholder]) => (
                      <label key={key} className="block">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</span>
                        <input
                          value={form[key as keyof typeof form]}
                          onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                          placeholder={placeholder}
                          type={key === "email" ? "email" : "text"}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-yellow-300/45"
                        />
                      </label>
                    ))}
                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/35">Builder vibe</span>
                      <textarea
                        value={form.vibe}
                        onChange={(event) => setForm({ ...form, vibe: event.target.value })}
                        placeholder={starterPrompts[2]}
                        className="mt-2 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-yellow-300/45"
                      />
                    </label>
                    {error && <p className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
                    <button
                      onClick={register}
                      disabled={loading || !form.alias || !form.email || !form.skills}
                      className="w-full rounded-2xl gold-grad px-5 py-4 text-black font-extrabold disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving profile</span>
                      ) : (
                        "Register profile"
                      )}
                    </button>
                  </div>
                )}

                {step === "find" && (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center font-display font-extrabold">
                          {form.alias.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Registered profile</p>
                          <h3 className="font-display text-2xl font-bold">{form.alias}</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {skillList.slice(0, 5).map((skill) => (
                          <span key={skill} className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs text-yellow-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {registered && (
                      <p className="flex items-center gap-2 text-sm text-green-300">
                        <CheckCircle2 size={16} /> Profile saved. You can search for matches now.
                      </p>
                    )}
                    {error && <p className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
                    <button
                      onClick={findMatch}
                      disabled={loading}
                      className="w-full rounded-2xl gold-grad px-5 py-4 text-black font-extrabold disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Searching</span>
                      ) : (
                        "Find my co-founder"
                      )}
                    </button>
                    <button
                      onClick={resetProfile}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-white/70 hover:text-white font-bold flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Register a different profile
                    </button>
                  </div>
                )}

                {step === "results" && (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Search complete</p>
                      <h3 className="font-display text-2xl font-bold mt-2">{matches.length} match{matches.length === 1 ? "" : "es"} found</h3>
                      <p className="mt-2 text-sm text-white/50">
                        Review the best fit, then use the email action to start the conversation.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep("find")}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-white/70 hover:text-white font-bold flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Search again
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden min-h-[360px]">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-400/15 border border-purple-300/20 text-purple-100 flex items-center justify-center">
                        <BrainCircuit size={22} />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold">Matching logic</h2>
                        <p className="text-xs text-white/42">Complementary skills plus shared startup direction</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/45">
                      Prototype
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      [Target, "Complementary skills", "Find people who bring what you do not."],
                      [Compass, "Shared interests", "Filter toward the same startup space."],
                      [Mail, "Fast contact", "Generate a simple email intro."],
                    ].map(([Icon, title, body]) => {
                      const IconComponent = Icon as typeof Target;
                      return (
                        <div key={title as string} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                          <div className="h-10 w-10 rounded-2xl gold-grad text-black flex items-center justify-center mb-4">
                            <IconComponent size={19} />
                          </div>
                          <p className="font-display font-bold">{title as string}</p>
                          <p className="mt-2 text-xs leading-relaxed text-white/45">{body as string}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">Current profile preview</p>
                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-white/35 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(skillList.length ? skillList : ["React", "Python", "Pitching"]).map((skill) => (
                            <span key={skill} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/60">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/35 mb-2">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {(interestList.length ? interestList : ["EdTech", "Employability", "AI"]).map((interest) => (
                            <span key={interest} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/60">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/50">
                      {form.vibe || "Add one sentence about what you want to build so matches understand your direction quickly."}
                    </p>
                  </div>
                </div>
              </div>

              {step === "results" && (
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <div className="glass rounded-[28px] p-6 text-center border border-white/10">
                      <div className="mx-auto mb-4 h-14 w-14 rounded-3xl gold-grad text-black flex items-center justify-center">
                        <Users size={26} />
                      </div>
                      <h2 className="font-display text-2xl font-bold text-grad">No matches yet.</h2>
                      <p className="mt-2 text-sm text-white/45">
                        Share the page with classmates so the matching pool can grow.
                      </p>
                    </div>
                  ) : (
                    matches.map((match) => {
                      const skills = parseJsonList(match.skills);
                      const interests = parseJsonList(match.interests);
                      return (
                        <article key={match.id} className="glass rounded-[28px] p-5 md:p-6 border border-white/10 relative overflow-hidden">
                          <div className="absolute inset-0 dot-grid opacity-10" />
                          <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Potential co-founder</p>
                                <h3 className="font-display text-2xl font-bold mt-1">{match.alias}</h3>
                              </div>
                              <span className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-sm font-bold text-yellow-100">
                                {Math.round(match.matchScore * 100)}%
                              </span>
                            </div>
                            <p className="mt-4 text-sm leading-relaxed text-white/58">{match.vibe}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {skills.map((skill) => (
                                <span key={skill} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/60">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <p className="mt-4 text-xs text-white/38">Interested in: {interests.join(", ") || "Not specified"}</p>
                            <a
                              href={`mailto:${match.email}?subject=Co-founder match from Hired.jo&body=Hi ${match.alias}, I found you on Hired.jo and I think we could be a great match!`}
                              className="mt-5 inline-flex items-center gap-2 rounded-2xl gold-grad px-5 py-3 text-black font-extrabold"
                            >
                              Connect <ArrowRight size={16} />
                            </a>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
