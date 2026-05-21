"use client";
import { useState } from "react";
import { Bookmark, Building2, CheckCircle2, ExternalLink, MapPin, Sparkles, Target, X, Clock } from "lucide-react";
import type { Job, MatchResult } from "@/lib/types";

function linkedInSearchUrl(job: Job): string {
  const keywords = encodeURIComponent(job.title);
  const company = encodeURIComponent(job.company);
  const location = job.country === "UAE" ? "Dubai" : job.country === "Saudi Arabia" ? "Riyadh" : "Amman";
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}%20${company}&location=${location}`;
}

// Only use the stored URL if it points to an actual job posting, not a search/listing page.
// Otherwise we'd send users to a random page and they couldn't tell why.
function hasDirectJobUrl(job: Job): boolean {
  const u = job.url ?? "";
  if (!u.startsWith("http")) return false;
  // Reject obvious search/listing fallbacks
  if (/\/jobs\/?(\?|$)/.test(u) && !/\d{4,}/.test(u)) return false;
  return true;
}

function applyUrl(job: Job): string {
  if (hasDirectJobUrl(job)) return job.url!;
  // Source-specific listing pages are better than a useless empty search
  const q = encodeURIComponent(job.title);
  const country = job.country === "UAE" ? "uae" : job.country === "Saudi Arabia" ? "saudi-arabia" : "jordan";
  switch (job.source) {
    case "Akhtaboot":  return `https://www.akhtaboot.com/en/${country}/jobs?q=${q}`;
    case "Bayt":       return `https://www.bayt.com/en/${country}/jobs/?keyword=${q}`;
    case "Wuzzuf":     return `https://wuzzuf.net/search/jobs/?q=${q}`;
    case "Fursa":      return `https://www.for9a.com/en/jobs/countries/JO`;
    case "Naukrigulf": return `https://www.naukrigulf.com/jobs-in-${country}?q=${q}`;
    case "GulfTalent": return `https://www.gulftalent.com/jobs?search=${q}`;
    default:           return linkedInSearchUrl(job);
  }
}

function daysAgo(iso: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function postedLabel(iso: string): string {
  const d = daysAgo(iso);
  if (d === null) return "";
  if (d <= 0) return "Today";
  if (d === 1) return "1 day ago";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// Salary detection: JSearch usually returns USD annual, scrapers don't set salary at all.
// Hide salary unless we have a known currency hint; otherwise just show sector.
function salaryLabel(job: Job): string | null {
  if (!job.salaryMin) return null;
  const min = job.salaryMin;
  const max = job.salaryMax ?? min;
  // Heuristic: >5000 = likely annual USD, <5000 = likely monthly local
  if (min > 5000) return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k / yr`;
  return `${min}–${max} / mo`;
}

const seniorityColor: Record<string, string> = {
  Intern: "bg-blue-400/12 text-blue-200 border-blue-300/20",
  Junior: "bg-green-400/12 text-green-200 border-green-300/20",
  Mid: "bg-yellow-400/12 text-yellow-100 border-yellow-300/20",
  Senior: "bg-red-400/12 text-red-200 border-red-300/20",
};

interface JobCardProps {
  job: Job;
  cv?: any;
  saved?: boolean;
  onToggleSave?: (jobId: string, save: boolean) => void;
}

export function JobCard({ job, cv, saved, onToggleSave }: JobCardProps) {
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function onEnter() { setRevealed(true); }
  function onLeave() { if (!match) setRevealed(false); }

  function onTap(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button,a")) return;
    setRevealed((v) => !v);
  }

  async function checkFit(e: React.MouseEvent) {
    e.stopPropagation();
    if (!cv) { alert("Build your CV first on /build"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, job }),
      });
      setMatch(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const salary = salaryLabel(job);
  const age = daysAgo(job.postedAt);
  const ageLabel = postedLabel(job.postedAt);
  const ageStale = age !== null && age > 30;
  const company = job.company === "Undisclosed" || !job.company ? "Confidential" : job.company;

  return (
    <div
      className="feature-card group relative min-h-[270px] overflow-hidden rounded-2xl select-none transition duration-300"
      style={{ cursor: "pointer" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onTap}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative h-full min-h-[270px] rounded-2xl border border-white/10 bg-white/[0.045] p-5 flex flex-col gap-4 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-white/55">
                <Building2 size={12} /> {job.source}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${seniorityColor[job.seniority] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                {job.seniority}
              </span>
              {job.remote && (
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-bold bg-green-400/12 text-green-200 border-green-300/20">
                  Remote
                </span>
              )}
              {ageLabel && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
                  ageStale ? "bg-orange-400/10 text-orange-200 border-orange-300/20" : "bg-white/5 text-white/50 border-white/10"
                }`}>
                  <Clock size={10} /> {ageLabel}
                </span>
              )}
            </div>
            <h3 className="font-display text-xl font-bold leading-tight text-white line-clamp-2">{job.title}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
              <MapPin size={14} /> {company} / {job.city}
            </p>
          </div>
          <div className="h-11 w-11 shrink-0 rounded-2xl gold-grad text-black flex items-center justify-center shadow-[0_18px_45px_-24px_rgba(245,184,46,.9)]">
            <Target size={21} strokeWidth={2.4} />
          </div>
        </div>

        <p className="relative text-sm text-white/55 leading-relaxed line-clamp-3">{job.description}</p>

        <div className="relative flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-black/25 border border-white/10 text-white/62">{s}</span>
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-black/25 border border-white/10 text-white/35">+{job.skills.length - 5}</span>
          )}
        </div>

        <div className="relative mt-auto flex items-center justify-between gap-3 text-xs">
          <div className="text-white/35">
            {salary ? <span className="text-yellow-100">{salary}</span> : <span>{job.sector}</span>}
          </div>
          <span className="text-white/25 group-hover:text-yellow-100 transition">Tap for details</span>
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, rgba(42,31,110,.98) 0%, rgba(20,14,42,.98) 56%, rgba(10,7,22,.98) 100%)",
          border: "1px solid rgba(245,184,46,0.35)",
          clipPath: revealed ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
          transition: "clip-path 0.45s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: revealed ? "auto" : "none",
        }}
      >
        <div className="absolute inset-0 dot-grid opacity-15" />
        <button
          type="button"
          aria-label="Close job details"
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/25 border border-white/10 text-white/40 hover:text-white flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setRevealed(false); }}
        >
          <X size={15} />
        </button>

        <div className="relative pr-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-100/70">Role detail</p>
          <h3 className="font-display text-lg font-bold leading-tight mt-1">{job.title}</h3>
          <p className="text-white/48 text-xs mt-1">{company} / {job.city}, {job.country}</p>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {job.remote && <span className="text-xs px-2.5 py-1 rounded-full bg-green-400/12 text-green-200 border border-green-300/20">Remote</span>}
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/55 border border-white/10">{job.sector}</span>
            {ageLabel && <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/50 border border-white/10">{ageLabel}</span>}
          </div>
        </div>

        <p className="relative text-xs text-white/68 leading-relaxed">{job.description}</p>

        {match ? (
          <div className="relative rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-extrabold gold-text-grad">{match.score}%</span>
              <span className="text-xs text-white/45">match</span>
            </div>
            {match.matchedSkills.length > 0 && <p className="text-green-200 text-xs"><CheckCircle2 size={13} className="inline mr-1" />{match.matchedSkills.slice(0, 3).join(", ")}</p>}
            {match.missingSkills.length > 0 && <p className="text-orange-200 text-xs">Missing: {match.missingSkills.slice(0, 3).join(", ")}</p>}
          </div>
        ) : (
          <div className="relative flex flex-wrap gap-1.5 overflow-hidden max-h-[74px]">
            {job.skills.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">{s}</span>
            ))}
          </div>
        )}

        <div className={`relative grid gap-2 mt-auto ${onToggleSave ? "grid-cols-[1fr_auto_auto_auto]" : "grid-cols-[1fr_auto_auto]"}`}>
          <button
            onClick={checkFit}
            disabled={loading}
            className="rounded-2xl gold-grad px-4 py-3 text-xs font-extrabold text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : match ? `${match.score}% match` : "Check fit"}
          </button>
          <a
            href={applyUrl(job)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-xs font-bold text-white/75 hover:text-white inline-flex items-center gap-1.5"
          >
            Apply <ExternalLink size={13} />
          </a>
          <a
            href={linkedInSearchUrl(job)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Search this job on LinkedIn"
            className="rounded-2xl border border-[#0A66C2]/45 bg-[#0A66C2]/10 px-3 py-3 text-[#7DB6FF] hover:text-white inline-flex items-center"
          >
            <span className="font-bold text-sm leading-none">in</span>
          </a>
          {onToggleSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(job.id, !saved); }}
              className={`rounded-2xl border px-3 py-3 text-xs inline-flex items-center gap-1.5 transition ${
                saved
                  ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-200"
                  : "border-white/15 bg-white/5 text-white/55 hover:text-white"
              }`}
              aria-label={saved ? "Unsave job" : "Save job"}
            >
              <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <p className="relative text-white/22 text-[11px] flex items-center gap-1.5">
          <Sparkles size={12} /> {job.source}{ageLabel ? ` / ${ageLabel}` : ""}
        </p>
      </div>
    </div>
  );
}
