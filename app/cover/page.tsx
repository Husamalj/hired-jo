"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CV, Job } from "@/lib/types";
import jobsData from "@/data/jobs.json";

const jobs = jobsData as Job[];

export default function CoverPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id ?? "");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) {
      try {
        setCv(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  async function handleGenerate() {
    if (!cv || !selectedJobId) return;
    setLoading(true);
    setLetter("");
    setCopied(false);
    try {
      const res = await fetch("/api/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, jobId: selectedJobId }),
      });
      const data = await res.json();
      setLetter(data.letter ?? data.error ?? "Something went wrong.");
    } catch {
      setLetter("Failed to generate cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <>
      <Navbar />
      <main className="min-h-screen grain px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
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
              {/* CV pill */}
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gold-grad flex items-center justify-center text-black font-bold text-sm shrink-0">
                  {cv.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{cv.fullName}</p>
                  <p className="text-white/40 text-xs">{cv.skills.slice(0, 3).join(" · ")}</p>
                </div>
              </div>

              {/* Job selector */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <label className="block text-sm text-white/60 font-medium">
                  Select a job
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 outline-none text-white"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id} className="bg-[#0A0716]">
                      {job.title} — {job.company} ({job.city})
                    </option>
                  ))}
                </select>

                {selectedJob && (
                  <div className="text-xs text-white/40 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-white/5">{selectedJob.sector}</span>
                    <span className="px-2 py-1 rounded-md bg-white/5">{selectedJob.seniority}</span>
                    {selectedJob.salaryMin && (
                      <span className="px-2 py-1 rounded-md bg-white/5">
                        {selectedJob.salaryMin}–{selectedJob.salaryMax} JOD
                      </span>
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

              {/* Letter output */}
              {letter && (
                <div className="space-y-3">
                  <div className="glass rounded-2xl p-6 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto text-white/90">
                    {letter}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full purple-grad text-white font-bold px-6 py-3 rounded-xl"
                  >
                    {copied ? "Copied! ✓" : "Copy to Clipboard"}
                  </button>
                </div>
              )}

              {/* Quick nav */}
              <div className="flex gap-3 pt-2">
                <Link href="/jobs" className="gold-grad text-black font-bold px-5 py-2 rounded-xl text-sm">
                  Browse Jobs →
                </Link>
                <Link href="/roast" className="purple-grad text-white font-bold px-5 py-2 rounded-xl text-sm">
                  Roast My CV 🔥
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
