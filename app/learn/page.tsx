"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CV } from "@/lib/types";
import rawResources from "@/data/learning-resources.json";
import rawCerts from "@/data/certifications-jo.json";
import rawJobs from "@/data/jobs.json";

interface Resource {
  id: string;
  skill: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  free: boolean;
  language: string;
}

interface Cert {
  id: string;
  name: string;
  provider: string;
  url: string;
  fields: string[];
  format: string;
  free: boolean;
  language: string;
  description: string;
}

const resources = rawResources as Resource[];
const certs = rawCerts as Cert[];
const jobs = rawJobs as any[];

function loadCv(): CV | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("hired_cv");
    return raw ? (JSON.parse(raw) as CV) : null;
  } catch {
    return null;
  }
}

function getTopJobSkills(): string[] {
  const counts: Record<string, number> = {};
  jobs.forEach((j) => (j.skills ?? []).forEach((s: string) => {
    const k = s.toLowerCase();
    counts[k] = (counts[k] ?? 0) + 1;
  }));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([s]) => s);
}

export default function LearnPage() {
  const [cv, setCv] = useState<CV | null>(null);

  useEffect(() => {
    setCv(loadCv());
  }, []);

  const topJobSkills = getTopJobSkills();
  const cvSkills = (cv?.skills ?? []).map((s) => s.toLowerCase());
  const gapSkills = topJobSkills.filter((s) => !cvSkills.includes(s));

  // resources matched to gaps first, then remaining
  const gapResources = resources.filter((r) =>
    gapSkills.includes(r.skill.toLowerCase())
  );
  const otherResources = resources.filter(
    (r) => !gapSkills.includes(r.skill.toLowerCase())
  );
  const displayResources = cv
    ? [...gapResources, ...otherResources]
    : resources;

  return (
    <>
      <Navbar />
      <main className="min-h-screen grain px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-grad">
              Learning Roadmap
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Free courses and Jordan-accessible programs to close your skill gaps.
            </p>
          </div>

          {cv ? (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gold-grad flex items-center justify-center text-black font-bold text-sm shrink-0">
                {cv.fullName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-medium">{cv.fullName}</p>
                {gapSkills.length > 0 ? (
                  <p className="text-xs text-white/40">
                    {gapSkills.length} skill gap{gapSkills.length !== 1 ? "s" : ""} detected vs Jordan market —
                    showing matched courses first
                  </p>
                ) : (
                  <p className="text-xs text-green-400">
                    Your skills cover the top Jordan job market demands
                  </p>
                )}
              </div>
              <Link href="/score" className="ml-auto text-xs text-white/40 underline shrink-0">
                See your score →
              </Link>
            </div>
          ) : (
            <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-white/50">
                Build your CV to see personalized gap analysis
              </p>
              <Link href="/build" className="gold-grad text-black font-bold px-4 py-2 rounded-xl text-xs shrink-0">
                Build CV →
              </Link>
            </div>
          )}

          {/* Skill gaps */}
          {cv && gapSkills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Your Skill Gaps
              </h2>
              <div className="flex flex-wrap gap-2">
                {gapSkills.slice(0, 12).map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-300 border border-red-500/20 capitalize"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Free courses */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Free Courses
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {displayResources.map((r) => {
                const isGap = gapSkills.includes(r.skill.toLowerCase());
                return (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`glass rounded-xl p-4 space-y-2 hover:border-white/20 border transition-all ${
                      isGap ? "border-yellow-400/30" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isGap
                            ? "bg-yellow-400/15 text-yellow-300"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        {r.skill}
                      </span>
                      <span className="text-xs text-white/30 shrink-0">{r.hours}h</span>
                    </div>
                    <p className="text-sm font-medium text-white/90 leading-snug">{r.title}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{r.provider}</span>
                      <span>·</span>
                      <span>{r.language === "AR" ? "Arabic" : r.language === "EN" ? "English" : "Both"}</span>
                      {r.free && (
                        <>
                          <span>·</span>
                          <span className="text-green-400">Free</span>
                        </>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Jordan programs & certs */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Jordan Programs & Certifications
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {certs.map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl p-4 space-y-2 hover:border-white/20 border border-transparent transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-medium">
                      {c.provider}
                    </span>
                    {c.free && (
                      <span className="text-xs text-green-400 shrink-0">Free</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white/90 leading-snug">{c.name}</p>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{c.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.fields.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/30">
                        {f}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pb-4">
            <Link href="/score" className="gold-grad text-black font-bold px-5 py-2.5 rounded-xl text-sm">
              My Score →
            </Link>
            <Link href="/jobs" className="purple-grad text-white font-bold px-5 py-2.5 rounded-xl text-sm">
              Browse Jobs →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
