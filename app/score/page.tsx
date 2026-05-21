"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CV, HiredScore } from "@/lib/types";
import { syncScoreToAccount } from "@/lib/user-data";

const DIMENSIONS = [
  {
    key: "cvStrength" as const,
    label: "CV Strength",
    max: 300,
    color: "#F5B82E",
    desc: "Quality of written content — summary, bullet points, and projects.",
  },
  {
    key: "skillDemand" as const,
    label: "Skill Demand",
    max: 300,
    color: "#A78BFA",
    desc: "How many of your skills appear in real Jordan job postings.",
  },
  {
    key: "marketFit" as const,
    label: "Market Fit",
    max: 200,
    color: "#34D399",
    desc: "Career evidence — work experience, education, certifications.",
  },
  {
    key: "completeness" as const,
    label: "Completeness",
    max: 200,
    color: "#60A5FA",
    desc: "How fully your profile is filled out across all sections.",
  },
];

function ScoreBar({
  label,
  value,
  max,
  color,
  desc,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  desc: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-white/90">{label}</span>
        <span className="text-xs tabular-nums" style={{ color }}>
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-xs text-white/40">{desc}</p>
    </div>
  );
}

function tier(total: number) {
  if (total >= 800) return { label: "Elite", color: "#F5B82E" };
  if (total >= 600) return { label: "Strong", color: "#34D399" };
  if (total >= 400) return { label: "Average", color: "#60A5FA" };
  if (total >= 200) return { label: "Needs Work", color: "#F97316" };
  return { label: "Incomplete", color: "#F87171" };
}

export default function ScorePage() {
  const [score, setScore] = useState<HiredScore | null>(null);
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) {
      setHasCV(true);
      fetchScore(JSON.parse(raw));
    }
  }, []);

  async function fetchScore(cv: CV, submitAlias?: string) {
    setLoading(true);
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv, alias: submitAlias }),
    });
    const data = await res.json();
    setScore(data);
    if (data.total != null) {
      syncScoreToAccount(data.total, data).catch(console.error);
    }
    setLoading(false);
    if (submitAlias) {
      if (data.dbError) {
        setSaveError(`DB error: ${data.dbError}`);
      } else {
        setSubmitted(true);
      }
    }
  }

  async function handleSubmitToLeaderboard() {
    if (!alias.trim()) return;
    const raw = localStorage.getItem("hired_cv");
    if (!raw) return;
    await fetchScore(JSON.parse(raw), alias.trim());
  }

  if (!hasCV) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen grain px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Get Your Hired Score</h1>
          <p className="text-white/60">
            You need to build your CV first.{" "}
            <a href="/build" className="text-[#F5B82E] underline">
              Build it now →
            </a>
          </p>
        </main>
      </>
    );
  }

  const t = score ? tier(score.total) : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen grain px-6 py-10">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Your Hired Score</h1>
            <p className="text-white/50 text-sm mt-1">
              Scored against real Jordan job market data.
            </p>
          </div>

          {loading && (
            <div className="glass rounded-2xl p-10 text-center text-white/50 animate-pulse">
              Calculating…
            </div>
          )}

          {score && t && (
            <>
              {/* Big score */}
              <div className="glass rounded-2xl p-6 flex items-center gap-6">
                <div>
                  <div
                    className="text-7xl font-extrabold tabular-nums"
                    style={{ color: t.color }}
                  >
                    {score.total}
                  </div>
                  <div className="text-white/40 text-sm">/ 1000</div>
                </div>
                <div className="flex-1">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2"
                    style={{ background: t.color + "22", color: t.color }}
                  >
                    {t.label}
                  </span>
                  <p className="text-white/50 text-xs leading-relaxed">
                    4 dimensions below show exactly how your points were earned.
                  </p>
                </div>
              </div>

              {/* Breakdown bars */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Score Breakdown
                </h2>
                {DIMENSIONS.map((d) => (
                  <ScoreBar
                    key={d.key}
                    label={d.label}
                    value={score.breakdown[d.key]}
                    max={d.max}
                    color={d.color}
                    desc={d.desc}
                  />
                ))}
              </div>

              {/* Leaderboard submit */}
              {!submitted ? (
                <div className="glass rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-white/60">Submit to the live leaderboard</p>
                  <div className="flex gap-2">
                    <input
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitToLeaderboard()}
                      placeholder="Pick a display name"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 outline-none text-sm"
                    />
                    <button
                      onClick={handleSubmitToLeaderboard}
                      className="px-5 py-3 rounded-xl gold-grad text-black font-semibold text-sm shrink-0"
                    >
                      Submit
                    </button>
                  </div>
                  {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                </div>
              ) : (
                <p className="text-green-400 font-semibold text-sm">
                  Score submitted!{" "}
                  <Link href="/leaderboard" className="underline">
                    See rankings →
                  </Link>
                </p>
              )}

              {/* Next steps */}
              <div className="flex flex-wrap gap-3 pb-4">
                <Link
                  href="/roast"
                  className="gold-grad text-black font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Roast My CV 🔥
                </Link>
                <Link
                  href="/cover"
                  className="purple-grad text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Cover Letter ✨
                </Link>
                <Link
                  href="/learn"
                  className="glass text-white font-semibold px-5 py-2.5 rounded-xl text-sm border border-white/10 hover:border-white/20"
                >
                  Learning Roadmap →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
