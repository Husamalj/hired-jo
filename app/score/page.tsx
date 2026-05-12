"use client";
import { useEffect, useState } from "react";
import { HiredScoreCard } from "@/components/HiredScore";
import { Navbar } from "@/components/Navbar";
import type { CV, HiredScore } from "@/lib/types";

export default function ScorePage() {
  const [score, setScore] = useState<HiredScore | null>(null);
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) {
      setHasCV(true);
      fetchScore(JSON.parse(raw));
    }
  }, []);

  async function fetchScore(cv: CV, submitAlias?: string) {
    setLoading(true);
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv, alias: submitAlias }),
    });
    const data = await res.json();
    setScore(data);
    setLoading(false);
    if (submitAlias) setSubmitted(true);
  }

  async function handleSubmitToLeaderboard() {
    if (!alias.trim()) return;
    const raw = localStorage.getItem("hired_cv");
    if (!raw) return;
    await fetchScore(JSON.parse(raw), alias.trim());
  }

  if (!hasCV) {
    return (
      <>
        <Navbar />
        <main className="px-8 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Get Your Hired Score</h1>
          <p className="text-white/60">
            You need to build your CV first.{" "}
            <a href="/build" className="text-[#F5B82E] underline">
              Build it now →
            </a>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="px-8 py-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Hired Score</h1>
      <p className="text-white/60 mb-6">
        Based on your CV vs real Jordan job market data.
      </p>

      {loading && <p className="text-white/50 animate-pulse">Calculating…</p>}
      {score && <HiredScoreCard s={score} />}

      {score && !submitted && (
        <div className="mt-6 flex gap-2">
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Pick a display name for the leaderboard"
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 outline-none"
          />
          <button
            onClick={handleSubmitToLeaderboard}
            className="px-5 py-3 rounded-xl bg-[#F5B82E] text-black font-semibold"
          >
            Submit
          </button>
        </div>
      )}
      {submitted && (
        <p className="mt-4 text-green-400 font-semibold">
          🎉 Score submitted to the leaderboard!{" "}
          <a href="/leaderboard" className="underline">
            See rankings →
          </a>
        </p>
      )}
    </main>
    </>
  );
}
