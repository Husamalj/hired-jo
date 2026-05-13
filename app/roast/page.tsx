"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CV } from "@/lib/types";

interface AdviceItem {
  title: string;
  body: string;
}

function parseAdvice(raw: string): AdviceItem[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  const items: AdviceItem[] = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*[:\s—-]*(.*)/);
    if (match) {
      items.push({ title: match[1].trim(), body: match[2].trim() });
    } else if (line.match(/^\d+\.\s+/) && items.length < 5) {
      const text = line.replace(/^\d+\.\s+/, "");
      const boldMatch = text.match(/\*\*(.+?)\*\*[:\s—-]*(.*)/);
      if (boldMatch) {
        items.push({ title: boldMatch[1].trim(), body: boldMatch[2].trim() });
      } else {
        items.push({ title: `Tip ${items.length + 1}`, body: text });
      }
    }
  }
  return items.slice(0, 5);
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

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) {
      try {
        setCv(JSON.parse(raw));
      } catch {
        // malformed storage — ignore
      }
    }
  }, []);

  // Typewriter effect
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
    }, 15);
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
      setRoast(data.roast ?? "Something went wrong.");
      setAdvice(data.advice ?? "");
    } catch {
      setRoast("Failed to connect to the roast engine. Try again.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function renderMarkdown(text: string) {
    return text.split("\n\n").map((para, pi) => (
      <p key={pi} className="mb-4 leading-relaxed">
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
      <main className="min-h-screen grain px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl font-bold text-grad">
              Roast My CV 🔥
            </h1>
            <p className="text-white/60">
              Brutal honesty + real advice from your AI career coach.
            </p>
          </div>

          {!cv ? (
            <div className="space-y-4">
              <div
                className={`glass rounded-2xl p-10 text-center cursor-pointer transition-all border-2 ${dragOver ? "border-yellow-400/60 bg-yellow-400/5" : "border-white/10 hover:border-white/20"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {uploading ? (
                  <div className="space-y-3">
                    <div className="text-3xl animate-pulse">⚙️</div>
                    <p className="text-white/70 text-lg">Reading your CV…</p>
                    <p className="text-white/40 text-sm">AI is extracting your details</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-4xl">📄</div>
                    <p className="text-white/90 text-lg font-semibold">Drop your CV here</p>
                    <p className="text-white/50 text-sm">PDF or DOCX · click to browse</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="text-red-400 text-sm text-center">{uploadError}</p>
              )}

              <div className="text-center">
                <p className="text-white/30 text-sm mb-3">— or —</p>
                <Link href="/build" className="gold-grad text-black font-bold px-6 py-3 rounded-xl inline-block">
                  Build a new CV with AI →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="glass rounded-2xl p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/50 text-sm">CV loaded for</p>
                  <p className="font-bold text-lg">{cv.fullName || "Uploaded CV"}</p>
                  <p className="text-white/40 text-sm">{cv.education?.[0]?.institution ?? cv.email ?? ""}</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem("hired_cv");
                      setCv(null);
                    }}
                    className="mt-2 text-xs text-white/30 hover:text-white/60 underline"
                  >
                    Upload a different CV
                  </button>
                </div>
                <button
                  onClick={handleRoast}
                  disabled={loading}
                  className="gold-grad text-black font-bold px-6 py-3 rounded-xl shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Roasting…" : "Roast my CV 🔥"}
                </button>
              </div>

              {(displayed || loading) && (
                <div className="glass rounded-2xl p-6 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🔥</span>
                    <h2 className="font-bold text-white/80 text-sm uppercase tracking-widest">The Roast</h2>
                  </div>
                  {loading && !displayed ? (
                    <div className="flex items-center gap-3 text-white/50">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      Summoning the roast…
                    </div>
                  ) : (
                    <div className="text-sm text-white/90">
                      {renderMarkdown(displayed)}
                      {!done && (
                        <span className="inline-block w-1 h-4 bg-yellow-400 ml-0.5 blink align-middle" />
                      )}
                    </div>
                  )}
                </div>
              )}

              {done && adviceItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <h2 className="font-bold text-white/80 text-sm uppercase tracking-widest">How to Fix It</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {adviceItems.map((item, i) => (
                      <div key={i} className="glass rounded-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-[#F5B82E]">{item.title}</p>
                        <p className="text-xs text-white/60 leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {done && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/score" className="gold-grad text-black font-bold px-6 py-3 rounded-xl text-center">
                    Get My Hired Score →
                  </Link>
                  <Link href="/jobs" className="purple-grad text-white font-bold px-6 py-3 rounded-xl text-center">
                    Browse Jobs →
                  </Link>
                  <Link href="/cover" className="glass text-white font-bold px-6 py-3 rounded-xl text-center border border-white/10 hover:border-white/20">
                    Generate Cover Letter
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
