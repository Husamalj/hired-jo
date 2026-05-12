"use client";
import { useEffect, useState } from "react";

type Entry = {
  id: number;
  alias: string;
  score: number;
  topSkill: string;
  createdAt: string;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="px-8 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hired Score Leaderboard</h1>
          <p className="text-white/50 text-sm mt-1">Live · refreshes every 5 s</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 animate-pulse">
          ● LIVE
        </span>
      </div>

      {loading && <p className="text-white/40 animate-pulse">Loading…</p>}

      {!loading && entries.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <p className="text-4xl mb-3">🏆</p>
          <p>No scores yet — be the first!</p>
          <a href="/score" className="mt-2 inline-block text-[#F5B82E] underline text-sm">
            Get your score →
          </a>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${
              i === 0
                ? "border-[#F5B82E]/50 bg-[#F5B82E]/5"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="text-2xl w-8 text-center">
              {MEDALS[i] ?? <span className="text-white/30 text-base font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{e.alias}</p>
              <p className="text-white/40 text-xs">Top skill: {e.topSkill}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#F5B82E]">{e.score}</p>
              <p className="text-white/30 text-xs">/ 1000</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
