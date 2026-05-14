"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Crown,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

type Entry = {
  id: number;
  alias: string;
  score: number;
  topSkill: string;
  createdAt: string;
};

const RANK_STYLES = [
  "border-yellow-300/45 bg-yellow-300/10 shadow-[0_24px_70px_-42px_rgba(245,184,46,.9)]",
  "border-white/18 bg-white/[0.055]",
  "border-purple-300/22 bg-purple-300/8",
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function scoreLabel(score: number) {
  if (score >= 850) return "offer-ready";
  if (score >= 700) return "strong";
  if (score >= 550) return "building";
  return "early signal";
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(background = false) {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.error || "Could not load leaderboard.");
      setEntries(Array.isArray(data) ? data : []);
      setError("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not load leaderboard.";
      setEntries([]);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const topThree = entries.slice(0, 3);
  const leader = entries[0];
  const average = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length);
  }, [entries]);

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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_32%),radial-gradient(circle_at_86%_16%,rgba(91,63,200,.38),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_360px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Trophy size={14} />
                  Leaderboard
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  See who is closest to getting hired.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Hired Score ranks CV strength, market fit, completeness, and skill demand so students can turn readiness into a visible signal.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/score" className="gold-grad text-black font-extrabold px-5 py-3 rounded-2xl inline-flex items-center gap-2">
                    Get my score <ArrowRight size={16} />
                  </Link>
                  <Link href="/jobs" className="border border-white/12 bg-white/[0.045] text-white/75 hover:text-white px-5 py-3 rounded-2xl font-bold">
                    Compare jobs
                  </Link>
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Live signal</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{entries.length}</p>
                      <p className="text-sm text-white/50">ranked students</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs font-bold text-green-200">
                      <span className="h-2 w-2 rounded-full bg-green-300" /> Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{leader?.score ?? 0}</div>
                      <div className="text-[11px] text-white/40">Top score</div>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{average}</div>
                      <div className="text-[11px] text-white/40">Average</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <RefreshCw size={16} className={refreshing ? "text-yellow-200 animate-spin" : "text-yellow-200"} />
                      Refreshes every 5 seconds
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      The room can see scores update as people test their CVs.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-64 rounded-[28px] border border-white/10 bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <section className="text-center py-16 rounded-[30px] border border-white/10 bg-white/[0.035]">
              <div className="mx-auto mb-5 h-16 w-16 rounded-3xl gold-grad text-black flex items-center justify-center">
                <Trophy size={30} />
              </div>
              <h2 className="font-display text-3xl font-bold text-grad">No scores yet.</h2>
              <p className="text-white/45 mt-2">Be the first student on the board.</p>
              <Link href="/score" className="mt-6 inline-flex items-center gap-2 rounded-2xl gold-grad px-5 py-3 text-black font-extrabold">
                Get your score <ArrowRight size={16} />
              </Link>
            </section>
          )}

          {!loading && entries.length > 0 && (
            <>
              <section className="grid lg:grid-cols-3 gap-4">
                {topThree.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`relative overflow-hidden rounded-[28px] border p-5 md:p-6 ${RANK_STYLES[index] ?? "border-white/10 bg-white/[0.04]"}`}
                  >
                    <div className="absolute inset-0 dot-grid opacity-15" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="h-14 w-14 rounded-2xl gold-grad text-black flex items-center justify-center">
                        {index === 0 ? <Crown size={25} /> : <Medal size={24} />}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/45">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="relative mt-7">
                      <p className="font-display text-2xl font-bold">{entry.alias}</p>
                      <p className="text-white/45 text-sm mt-1">Top skill: {entry.topSkill || "General readiness"}</p>
                    </div>
                    <div className="relative mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-display text-5xl font-extrabold gold-text-grad">{entry.score}</p>
                        <p className="text-white/35 text-xs">out of 1000</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">
                        {scoreLabel(entry.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </section>

              <section className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
                <div className="glass rounded-[28px] p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <div className="relative flex items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--gold)" }}>Rankings</div>
                      <h2 className="font-display text-2xl font-bold text-grad">Full board</h2>
                    </div>
                    <div className="text-xs text-white/35">{entries.length} entries</div>
                  </div>

                  <div className="space-y-2">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`group grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                          index === 0 ? "border-yellow-300/35 bg-yellow-300/8" : "border-white/10 bg-black/20 hover:bg-white/[0.055]"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
                          index < 3 ? "gold-grad text-black" : "bg-white/8 text-white/45 border border-white/10"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{entry.alias}</p>
                          <p className="text-xs text-white/38 truncate">
                            {entry.topSkill || "General readiness"} / {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl font-extrabold text-yellow-100">{entry.score}</p>
                          <p className="text-[11px] text-white/30">/1000</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="glass rounded-[28px] p-5 md:p-6 sticky top-6 overflow-hidden">
                  <div className="absolute inset-0 dot-grid opacity-15" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center mb-5">
                      <Activity size={23} />
                    </div>
                    <h3 className="font-display text-2xl font-bold">What moves the score?</h3>
                    <div className="mt-5 space-y-3">
                      {[
                        ["CV strength", "Clear bullets, projects, and proof"],
                        ["Market fit", "Skills that match live hiring demand"],
                        ["Completeness", "No missing education, contact, or skills"],
                        ["Momentum", "Score improves as the CV gets sharper"],
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <p className="font-bold text-sm">{title}</p>
                          <p className="mt-1 text-xs text-white/45 leading-relaxed">{body}</p>
                        </div>
                      ))}
                    </div>
                    <Link href="/score" className="mt-5 flex items-center justify-between rounded-2xl gold-grad px-5 py-4 text-black font-extrabold">
                      Improve my rank <ArrowRight size={16} />
                    </Link>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/35">
                      <Users size={14} /> Designed for live classroom comparison
                    </div>
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
