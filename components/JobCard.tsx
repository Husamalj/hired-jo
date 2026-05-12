"use client";
import { useState } from "react";
import type { Job, MatchResult } from "@/lib/types";

// LinkedIn geoIds — avoids "Jordan, Pennsylvania, USA" ambiguity
const LI_GEO: Record<string, string> = {
  "Jordan":       "101282781",
  "UAE":          "104305776",
  "Saudi Arabia": "102571732",
  "Palestine":    "101620481",
};

function linkedInSearchUrl(job: Job): string {
  const q = encodeURIComponent(`${job.title} ${job.company}`);
  const geoId = LI_GEO[job.country] ?? LI_GEO["Jordan"];
  return `https://www.linkedin.com/jobs/search/?keywords=${q}&geoId=${geoId}`;
}

function applyUrl(job: Job): string {
  const q = encodeURIComponent(job.title);
  const company = encodeURIComponent(job.company);
  const country = job.country === "UAE" ? "uae" : job.country === "Saudi Arabia" ? "saudi-arabia" : "jordan";
  switch (job.source) {
    case "Akhtaboot":
      return `https://www.akhtaboot.com/en/${country}/jobs?q=${q}+${company}`;
    case "Bayt":
      return `https://www.bayt.com/en/${country}/jobs/?q=${q}`;
    case "Wuzzuf":
      return `https://wuzzuf.net/search/jobs/?q=${q}&a=hpb`;
    case "Fursa":
      return `https://www.for9a.com/search?q=${q}`;
    case "Naukrigulf":
      return `https://www.naukrigulf.com/jobs-in-${country}?q=${q}`;
    case "GulfTalent":
      return `https://www.gulftalent.com/jobs?search=${q}`;
    case "Tanqeeb":
      return `https://www.tanqeeb.com/jobs?q=${q}`;
    case "LinkedIn":
      return job.url ?? linkedInSearchUrl(job);
    default:
      return job.url ?? linkedInSearchUrl(job);
  }
}

const seniorityColor: Record<string, string> = {
  Intern: "bg-blue-500/20 text-blue-300",
  Junior: "bg-green-500/20 text-green-300",
  Mid:    "bg-yellow-500/20 text-yellow-300",
  Senior: "bg-red-500/20 text-red-300",
};

export function JobCard({ job, cv }: { job: Job; cv?: any }) {
  const [match, setMatch]       = useState<MatchResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [revealed, setRevealed] = useState(false);

  // desktop: hover
  function onEnter() { setRevealed(true); }
  function onLeave() { if (!match) setRevealed(false); }

  // mobile + desktop click: tap to toggle
  function onTap(e: React.MouseEvent) {
    // only toggle if not clicking a button/link inside the overlay
    if ((e.target as HTMLElement).closest("button,a")) return;
    setRevealed((v) => !v);
  }

  async function checkFit(e: React.MouseEvent) {
    e.stopPropagation();
    if (!cv) { alert("Build your CV first on /build"); return; }
    setLoading(true);
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv, job }),
    });
    setMatch(await res.json());
    setLoading(false);
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{ minHeight: "220px", cursor: "pointer" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onTap}
    >
      {/* ── BASE ─────────────────────────────────────── */}
      <div className="w-full h-full p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base leading-tight">{job.title}</h3>
            <p className="text-white/50 text-sm mt-0.5">{job.company} · {job.city}</p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${seniorityColor[job.seniority] ?? "bg-white/10"}`}>
            {job.seniority}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{s}</span>
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">+{job.skills.length - 5}</span>
          )}
        </div>

        {job.salaryMin ? (
          <p className="text-xs text-[#F5B82E]">{job.salaryMin}–{job.salaryMax} JOD/month</p>
        ) : job.remote ? (
          <p className="text-xs text-green-400">🌐 Remote · paid</p>
        ) : null}

        {/* hint */}
        <p className="text-white/20 text-xs mt-auto">
          Tap for details ↗
        </p>
      </div>

      {/* ── REVEAL OVERLAY ───────────────────────────── */}
      <div
        className="absolute inset-0 rounded-2xl p-5 flex flex-col gap-3"
        style={{
          background: "linear-gradient(135deg,#2a1f6e 0%,#1A1340 100%)",
          border: "1px solid rgba(245,184,46,0.35)",
          clipPath: revealed ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
          transition: "clip-path 0.45s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: revealed ? "auto" : "none",
        }}
      >
        {/* close hint top-right */}
        <button
          className="absolute top-3 right-3 text-white/30 hover:text-white text-lg leading-none"
          onClick={(e) => { e.stopPropagation(); setRevealed(false); if (!match) {} }}
        >
          ×
        </button>

        <div>
          <h3 className="font-bold text-sm leading-tight text-white pr-6">{job.title}</h3>
          <p className="text-white/50 text-xs">{job.company} · {job.city}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {job.remote && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">🌐 Remote</span>
            )}
            {job.internshipCountry && job.internshipCountry !== "Remote" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">📍 {job.internshipCountry}</span>
            )}
          </div>
        </div>

        <p className="text-white/65 text-xs leading-relaxed line-clamp-3">{job.description}</p>

        {match ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#F5B82E]">{match.score}%</span>
              <span className="text-white/40 text-xs">match</span>
            </div>
            {match.matchedSkills.length > 0 && (
              <p className="text-green-400 text-xs">✓ {match.matchedSkills.slice(0, 3).join(", ")}</p>
            )}
            {match.missingSkills.length > 0 && (
              <p className="text-orange-300 text-xs">✗ Missing: {match.missingSkills.slice(0, 3).join(", ")}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {job.skills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{s}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <button
            onClick={checkFit}
            disabled={loading}
            className="flex-1 py-2 text-xs rounded-xl bg-[#F5B82E] text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Checking…" : match ? `${match.score}% match ✓` : "Check fit"}
          </button>
          <a
            href={applyUrl(job)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-2 text-xs rounded-xl border border-white/20 text-white/70 hover:text-white"
          >
            Apply →
          </a>
          <a
            href={linkedInSearchUrl(job)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-2 text-xs rounded-xl border border-[#0A66C2]/50 text-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
          >
            in
          </a>
        </div>

        <p className="text-white/20 text-xs">{job.source} · {job.postedAt}</p>
      </div>
    </div>
  );
}
