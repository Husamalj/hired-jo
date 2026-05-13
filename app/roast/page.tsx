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
            <div className="glass rounded-2xl p-8 text-center space-y-4">
              <p className="text-2xl">🤔</p>
              <p className="text-white/80 text-lg">You haven&apos;t built your CV yet.</p>
              <p className="text-white/50">
                The roast engine needs something to work with.
              </p>
              <Link
                href="/build"
                className="inline-block mt-2 gold-grad text-black font-bold px-6 py-3 rounded-xl"
              >
                Build My CV First →
              </Link>
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
