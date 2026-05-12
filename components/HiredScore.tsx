"use client";
import type { HiredScore } from "@/lib/types";

export function HiredScoreCard({ s }: { s: HiredScore }) {
  const pct = Math.round((s.total / 1000) * 100);
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#3F2B96] to-[#F5B82E] text-white">
      <div className="text-7xl font-extrabold tabular-nums">{s.total}</div>
      <div className="text-sm opacity-80 mb-4">/ 1000 — Hired Score</div>

      <div className="w-full bg-white/20 rounded-full h-3 mb-4">
        <div
          className="bg-white rounded-full h-3 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        {Object.entries(s.breakdown).map(([k, v]) => (
          <div key={k} className="bg-white/10 rounded-lg p-2 text-center">
            <div className="font-bold text-lg">{v}</div>
            <div className="opacity-70 capitalize">{k.replace(/([A-Z])/g, " $1")}</div>
          </div>
        ))}
      </div>

      {s.tips.length > 0 && (
        <ul className="text-sm space-y-1 bg-white/10 rounded-xl p-3">
          {s.tips.map((t, i) => (
            <li key={i}>💡 {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
