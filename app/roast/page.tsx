"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Flame,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import type { CV } from "@/lib/types";

interface AdviceItem {
  title: string;
  body: string;
}

function parseAdvice(raw: string): AdviceItem[] {
  const lines = raw.split("\n").filter((line) => line.trim());
  const items: AdviceItem[] = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*[:\s\u2014-]*(.*)/);
    if (match) {
      items.push({ title: match[1].trim(), body: match[2].trim() });
    } else if (line.match(/^\d+\.\s+/) && items.length < 5) {
      const text = line.replace(/^\d+\.\s+/, "");
      const boldMatch = text.match(/\*\*(.+?)\*\*[:\s\u2014-]*(.*)/);
      if (boldMatch) items.push({ title: boldMatch[1].trim(), body: boldMatch[2].trim() });
      else items.push({ title: `Tip ${items.length + 1}`, body: text });
    }
  }
  return items.slice(0, 5);
}

function cvCompleteness(cv: CV) {
  const checks = [
    Boolean(cv.fullName),
    Boolean(cv.summary),
    (cv.skills ?? []).length > 0,
    (cv.projects ?? []).length > 0,
    (cv.education ?? []).length > 0,
    (cv.experience ?? []).length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function RoastPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [roast, setRoast] = useState("");
  const [advice, setAdvice] = useState("");
  const [displayed, setDisplayed] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const adviceItems = done && advice ? parseAdvice(advice) : [];
  const completeness = cv ? cvCompleteness(cv) : 0;

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) {
      try {
        setCv(JSON.parse(raw));
      } catch {
        // Ignore malformed local CV data.
      }
    }
  }, []);

  useEffect(() => {
    if (!roast) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(roast.slice(0, i));
      if (i >= roast.length) {
        clearInterval(intervalRef.current!);
        setDone(true);
      }
    }, 12);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roast]);

  async function handleFile(file: File) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-cv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      localStorage.setItem("hired_cv", JSON.stringify(data.cv));
      setCv(data.cv);
      setRoast("");
      setAdvice("");
      setDisplayed("");
      setDone(false);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRoast() {
    if (!cv) return;
    setLoading(true);
    setRoast("");
    setAdvice("");
    setDisplayed("");
    setDone(false);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roast failed");
      setRoast(data.roast ?? "The roast engine returned an empty response.");
      setAdvice(data.advice ?? "");
    } catch (e: unknown) {
      setRoast(e instanceof Error ? e.message : "Failed to connect to the roast engine. Try again.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function renderMarkdown(text: string) {
    return text.split("\n\n").map((para, pi) => (
      <p key={pi} className="mb-4 leading-relaxed last:mb-0">
        {para.split(/(\*\*[^*]+\*\*)/).map((chunk, ci) =>
          chunk.startsWith("**") && chunk.endsWith("**") ? (
            <strong key={ci}>{chunk.slice(2, -2)}</strong>
          ) : (
            chunk
          )
        )}
      </p>
    ));
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-one hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,184,46,.20),transparent_32%),radial-gradient(circle_at_86%_16%,rgba(91,63,200,.42),transparent_43%)]" />
            <div className="relative grid lg:grid-cols-[1fr_360px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Flame size={14} />
                  Roast CV
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Brutal feedback, useful fixes, better CV.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Upload a CV or use your saved profile. Hired.jo reads the weak signals, calls out the gaps, and turns feedback into a next action.
                </p>
                <div className="mt-7 grid sm:grid-cols-3 gap-3 max-w-3xl">
                  {[
                    ["01", "Upload", "PDF or DOCX"],
                    ["02", "Roast", "Direct critique"],
                    ["03", "Repair", "Five focused fixes"],
                  ].map(([number, label, detail]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <div className="text-yellow-200 text-xs font-bold">{number}</div>
                      <div className="font-display font-bold mt-1">{label}</div>
                      <div className="text-xs text-white/42 mt-1">{detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">CV signal</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{cv ? `${completeness}%` : "--"}</p>
                      <p className="text-sm text-white/50">{cv ? "profile completeness" : "waiting for CV"}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                      <WandSparkles size={23} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <ShieldCheck size={16} className="text-yellow-200" />
                      Demo-safe workflow
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      The page keeps the CV local in the browser and only sends it when you request the roast.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{cv?.skills?.length ?? 0}</div>
                      <div className="text-[11px] text-white/40">Skills</div>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{cv?.projects?.length ?? 0}</div>
                      <div className="text-[11px] text-white/40">Projects</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid lg:grid-cols-[420px_1fr] gap-5 items-start">
            <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl gold-grad text-black flex items-center justify-center">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Roast input</h2>
                    <p className="text-xs text-white/42">Use a saved CV or upload a new one</p>
                  </div>
                </div>

                {!cv ? (
                  <div className="space-y-4">
                    <div
                      className={`relative cursor-pointer overflow-hidden rounded-[24px] border-2 p-8 text-center transition ${
                        dragOver ? "border-yellow-300/60 bg-yellow-300/10" : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFile(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                        }}
                      />
                      <div className="mx-auto mb-4 h-14 w-14 rounded-3xl gold-grad text-black flex items-center justify-center">
                        {uploading ? <Sparkles size={25} className="animate-pulse" /> : <FileText size={26} />}
                      </div>
                      <p className="font-display text-xl font-bold">{uploading ? "Reading your CV..." : "Drop your CV here"}</p>
                      <p className="text-white/45 text-sm mt-2">{uploading ? "Extracting career details" : "PDF or DOCX / click to browse"}</p>
                    </div>

                    {uploadError && <p className="text-red-300 text-sm">{uploadError}</p>}

                    <Link href="/build" className="flex items-center justify-between rounded-2xl gold-grad px-5 py-4 text-black font-extrabold">
                      Build a new CV <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">CV loaded for</p>
                      <h3 className="font-display text-2xl font-bold mt-2">{cv.fullName || "Uploaded CV"}</h3>
                      <p className="text-white/45 text-sm mt-1">{cv.education?.[0]?.institution ?? cv.email ?? "Ready to roast"}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(cv.skills ?? []).slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/60">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleRoast}
                      disabled={loading}
                      className="w-full rounded-2xl gold-grad px-5 py-4 text-black font-extrabold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Roasting..." : "Roast my CV"}
                    </button>

                    <button
                      onClick={() => {
                        localStorage.removeItem("hired_cv");
                        setCv(null);
                        setRoast("");
                        setAdvice("");
                        setDisplayed("");
                        setDone(false);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-white/70 hover:text-white font-bold flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Upload a different CV
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden min-h-[300px]">
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-red-300/35 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-red-400/15 border border-red-300/20 text-red-100 flex items-center justify-center">
                        <Flame size={22} />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold">The roast</h2>
                        <p className="text-xs text-white/42">Specific, direct, and fixable</p>
                      </div>
                    </div>
                    {loading && <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1.5 text-xs text-yellow-100">Live</span>}
                  </div>

                  {loading && !displayed ? (
                    <div className="flex items-center gap-3 text-white/55">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      Summoning the roast...
                    </div>
                  ) : displayed ? (
                    <div className="text-sm md:text-base text-white/82 leading-relaxed">
                      {renderMarkdown(displayed)}
                      {!done && <span className="inline-block w-1 h-4 bg-yellow-400 ml-0.5 blink align-middle" />}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-6 text-white/45">
                      <Target size={24} className="text-yellow-200 mb-4" />
                      <p className="font-bold text-white/70">Your CV roast will appear here.</p>
                      <p className="text-sm mt-2">Load a CV, then run the roast to reveal the strongest gaps and the quickest fixes.</p>
                    </div>
                  )}
                </div>
              </div>

              {done && adviceItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-200" />
                    <h2 className="font-bold text-white/80 text-sm uppercase tracking-widest">How to fix it</h2>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {adviceItems.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="glass rounded-2xl p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                          <div className="h-7 w-7 rounded-xl gold-grad text-black flex items-center justify-center text-xs font-extrabold shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-yellow-100">{item.title}</p>
                            <p className="text-xs text-white/58 leading-relaxed mt-1">{item.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {done && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Link href="/score" className="gold-grad text-black font-extrabold px-5 py-4 rounded-2xl text-center">
                    Get score
                  </Link>
                  <Link href="/jobs" className="purple-grad text-white font-extrabold px-5 py-4 rounded-2xl text-center">
                    Browse jobs
                  </Link>
                  <Link href="/cover" className="glass text-white/80 hover:text-white font-extrabold px-5 py-4 rounded-2xl text-center border border-white/10">
                    Cover letter
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
