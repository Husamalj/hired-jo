"use client";
import { useState } from "react";
import type { CV } from "@/lib/types";

export function CvBulkForm({ onSubmit }: { onSubmit: (cv: CV) => void }) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const cv: CV = await response.json();
      localStorage.setItem("hired_cv", JSON.stringify(cv));
      onSubmit(cv);
    } catch (error) {
      console.error("Error parsing CV:", error);
      alert("Failed to parse CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col justify-center">
      <div className="glass rounded-xl p-12">
        <h2 className="text-4xl font-bold mb-3">📝 Paste Your CV</h2>
        <p className="text-white/60 mb-8">Just paste everything about yourself. AI will organize it into a professional CV.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            placeholder="Paste your information here. Include your name, email, phone, location, experience, education, projects, skills, languages... anything about yourself. The AI will organize it."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-96 px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-lg focus:outline-none focus:border-gold"
          />

          <button
            type="submit"
            disabled={loading || !rawText.trim()}
            className="w-full gold-grad text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ Generating CV..." : "✨ Generate CV"}
          </button>
        </form>
      </div>
    </div>
  );
}
