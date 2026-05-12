"use client";
import { useState } from "react";

type Match = {
  id: number;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
  matchScore: number;
};

export default function CofounderPage() {
  const [step, setStep] = useState<"register" | "find" | "results">("register");
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

  async function register() {
    if (!form.alias || !form.email || !form.skills) return;
    setLoading(true);
    await fetch("/api/cofounder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        alias: form.alias,
        email: form.email,
        skills: form.skills.split(",").map((s) => s.trim()),
        interests: form.interests.split(",").map((s) => s.trim()),
        vibe: form.vibe,
      }),
    });
    setLoading(false);
    setRegistered(true);
    setStep("find");
  }

  async function findMatch() {
    setLoading(true);
    const res = await fetch("/api/cofounder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "match",
        skills: form.skills.split(",").map((s) => s.trim()),
        interests: form.interests.split(",").map((s) => s.trim()),
      }),
    });
    const data = await res.json();
    setMatches(data.matches ?? []);
    setLoading(false);
    setStep("results");
  }

  return (
    <main className="px-8 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Find My Co-founder</h1>
      <p className="text-white/60 mb-8">
        Register your profile, then get matched with complementary founders in Jordan.
      </p>

      {step === "register" && (
        <div className="space-y-4">
          <input
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            placeholder="Display name (not your real name)"
            className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Your email (shared only with matches)"
            className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none"
            type="email"
          />
          <input
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="Your skills (comma-separated: React, Python, UI Design)"
            className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none"
          />
          <input
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            placeholder="Startup interests (e.g. FinTech, HealthTech, EdTech)"
            className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none"
          />
          <textarea
            value={form.vibe}
            onChange={(e) => setForm({ ...form, vibe: e.target.value })}
            placeholder="One sentence about you and what you want to build"
            className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none h-24 resize-none"
          />
          <button
            onClick={register}
            disabled={loading || !form.alias || !form.email || !form.skills}
            className="w-full py-3 rounded-xl bg-[#F5B82E] text-black font-bold disabled:opacity-50"
          >
            {loading ? "Saving…" : "Register my profile"}
          </button>
        </div>
      )}

      {step === "find" && (
        <div className="text-center space-y-4">
          {registered && (
            <p className="text-green-400 font-semibold">
              ✓ Profile registered! Now find your match.
            </p>
          )}
          <button
            onClick={findMatch}
            disabled={loading}
            className="px-8 py-4 rounded-xl bg-[#3F2B96] text-white font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Searching…" : "🔍 Find my co-founder"}
          </button>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your top matches</h2>
          {matches.length === 0 && (
            <p className="text-white/50">
              No profiles yet — share this page with your network to grow the pool!
            </p>
          )}
          {matches.map((m) => {
            const skills: string[] = (() => { try { return JSON.parse(m.skills); } catch { return []; } })();
            const interests: string[] = (() => { try { return JSON.parse(m.interests); } catch { return []; } })();
            return (
              <div key={m.id} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{m.alias}</h3>
                  <span className="text-xs bg-[#F5B82E]/20 text-[#F5B82E] px-2 py-1 rounded-full">
                    {Math.round(m.matchScore * 100)}% match
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-2">{m.vibe}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {skills.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/10">{s}</span>
                  ))}
                </div>
                <p className="text-xs text-white/40 mb-3">Interested in: {interests.join(", ")}</p>
                <a
                  href={`mailto:${m.email}?subject=Co-founder match from Hired.jo&body=Hi ${m.alias}, I found you on Hired.jo and I think we could be a great match!`}
                  className="inline-block px-4 py-2 rounded-xl bg-[#3F2B96] text-white text-sm font-semibold"
                >
                  ✉ Connect
                </a>
              </div>
            );
          })}
          <button
            onClick={() => setStep("find")}
            className="text-sm text-white/40 hover:text-white underline"
          >
            ← Search again
          </button>
        </div>
      )}
    </main>
  );
}
