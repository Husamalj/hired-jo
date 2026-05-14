"use client";

import { useState } from "react";
import { ClipboardPenLine, Loader2, Sparkles } from "lucide-react";
import type { CV } from "@/lib/types";

export function CvBulkForm({ onSubmit }: { onSubmit: (cv: CV) => void }) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const cv: CV = await response.json();
      if (!response.ok) throw new Error((cv as any).error || "Failed to parse CV.");
      localStorage.setItem("hired_cv", JSON.stringify(cv));
      onSubmit(cv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gold-grad text-black flex items-center justify-center">
            <ClipboardPenLine size={22} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Paste everything</h2>
            <p className="text-xs text-white/42">The parser will organize raw career notes into a CV.</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/45">
          Bulk mode
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          placeholder="Paste your information here: name, email, phone, location, experience, education, projects, skills, languages, links, awards, and anything else useful."
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          className="h-[430px] w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-5 py-4 text-white outline-none placeholder:text-white/28 focus:border-yellow-300/45"
        />

        {error && (
          <p className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !rawText.trim()}
          className="w-full rounded-2xl gold-grad px-5 py-4 text-black font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Generating CV
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Generate CV <Sparkles size={16} />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
