"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { UpgradeModal } from "@/components/UpgradeModal";
import type { CV, Job } from "@/lib/types";
import type { UsageKey } from "@/lib/tiers";
import jobsData from "@/data/jobs.json";

const staticJobs = jobsData as Job[];

// Lazy initializer — reads localStorage once on mount, safe in "use client"
function loadInitialState(): { cv: CV | null; prefillJob: Job | null } {
  if (typeof window === "undefined") return { cv: null, prefillJob: null };
  let cv: CV | null = null;
  let prefillJob: Job | null = null;
  try {
    const raw = localStorage.getItem("hired_cv");
    if (raw) cv = JSON.parse(raw) as CV;
  } catch {}
  try {
    const raw = localStorage.getItem("hired_prefill_job");
    if (raw) {
      prefillJob = JSON.parse(raw) as Job;
      localStorage.removeItem("hired_prefill_job");
    }
  } catch {}
  return { cv, prefillJob };
}

export default function CoverPage() {
  const [{ cv, prefillJob }] = useState(loadInitialState);
  const [selectedJobId, setSelectedJobId] = useState<string>(staticJobs[0]?.id ?? "");
  // If pre-filled from job board, use that job; otherwise fall back to dropdown selection
  const [liveJob, setLiveJob] = useState<Job | null>(prefillJob);
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitKey, setLimitKey] = useState<UsageKey | null>(null);

  const activeJob: Job | undefined = liveJob ?? staticJobs.find((j) => j.id === selectedJobId);

  async function handleGenerate() {
    if (!cv || !activeJob) return;
    setLoading(true);
    setLetter("");
    setCopied(false);
    try {
      const body = liveJob
        ? { cv, job: liveJob }
        : { cv, jobId: selectedJobId };
      const res = await fetch("/api/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { setLetter("Sign in to generate cover letters."); return; }
      if (res.status === 402) { setLimitKey("cover_letters"); return; }
      const data = await res.json();
      setLetter(data.letter ?? data.error ?? "Something went wrong.");
    } catch {
      setLetter("Failed to generate cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(variantId: string) {
    const res = await fetch("/api/lemonsqueezy/checkout", {
      method: "POST",
      body: JSON.stringify({ variantId }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen grain px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl font-bold text-grad">
              Cover Letter Generator
            </h1>
            <p className="text-white/60">
              Pick a job, get a tailored letter in seconds.
            </p>
          </div>

          {!cv ? (
            <div className="glass rounded-2xl p-8 text-center space-y-4">
              <p className="text-2xl">📄</p>
              <p className="text-white/80 text-lg">No CV found in your browser.</p>
              <p className="text-white/50">Build your CV first so we can personalise the letter.</p>
              <Link
                href="/build"
                className="inline-block mt-2 gold-grad text-black font-bold px-6 py-3 rounded-xl"
              >
                Build My CV →
              </Link>
            </div>
          ) : (
            <>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gold-grad flex items-center justify-center text-black font-bold text-sm shrink-0">
                  {cv.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{cv.fullName}</p>
                  <p className="text-white/40 text-xs">{cv.skills.slice(0, 3).join(" · ")}</p>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 space-y-4">
                {liveJob ? (
                  <div className="space-y-2">
                    <label className="block text-sm text-white/60 font-medium">Writing for</label>
                    <div className="flex items-center justify-between rounded-xl border border-yellow-300/20 bg-yellow-300/8 px-4 py-3">
                      <div>
                        <p className="font-bold text-sm text-white">{liveJob.title}</p>
                        <p className="text-xs text-white/50">{liveJob.company} · {liveJob.city}</p>
                      </div>
                      <button
                        onClick={() => setLiveJob(null)}
                        className="text-xs text-white/40 hover:text-white transition"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm text-white/60 font-medium">Select a job</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none text-white"
                    >
                      {staticJobs.map((job) => (
                        <option key={job.id} value={job.id} className="bg-[#0A0716]">
                          {job.title} — {job.company} ({job.city})
                        </option>
                      ))}
                    </select>
                    {activeJob && (
                      <div className="text-xs text-white/40 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-md bg-white/5">{activeJob.sector}</span>
                        <span className="px-2 py-1 rounded-md bg-white/5">{activeJob.seniority}</span>
                        {activeJob.salaryMin && (
                          <span className="px-2 py-1 rounded-md bg-white/5">
                            {activeJob.salaryMin}–{activeJob.salaryMax} JOD
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full gold-grad text-black font-bold px-6 py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Generating…" : "Generate Cover Letter ✨"}
                </button>
              </div>

              {letter && (
                <div className="space-y-3">
                  <div className="glass rounded-2xl p-6 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto text-white/90">
                    {letter}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 purple-grad text-white font-bold px-6 py-3 rounded-xl text-sm"
                    >
                      {copied ? "Copied! ✓" : "Copy to Clipboard"}
                    </button>
                    {activeJob && (
                      <a
                        href={`mailto:?subject=Application for ${encodeURIComponent(activeJob.title)} at ${encodeURIComponent(activeJob.company)}&body=${encodeURIComponent(letter)}`}
                        className="gold-grad text-black font-bold px-5 py-3 rounded-xl text-sm shrink-0"
                      >
                        Send via Email ✉️
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/score" className="gold-grad text-black font-bold px-5 py-2 rounded-xl text-sm">
                  My Score →
                </Link>
                <Link href="/jobs" className="purple-grad text-white font-bold px-5 py-2 rounded-xl text-sm">
                  Browse Jobs →
                </Link>
                <Link href="/learn" className="glass text-white font-semibold px-5 py-2 rounded-xl text-sm border border-white/10 hover:border-white/20">
                  Learning Roadmap →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {limitKey && (
        <UpgradeModal
          usageKey={limitKey}
          onClose={() => setLimitKey(null)}
          onCheckout={handleCheckout}
        />
      )}
    </>
  );
}
