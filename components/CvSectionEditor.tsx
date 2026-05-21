"use client";
import { useState } from "react";
import { Wand2, ChevronDown } from "lucide-react";
import type { CV } from "@/lib/types";

const SECTIONS: { key: keyof CV; label: string }[] = [
  { key: "summary", label: "Summary / Objective" },
  { key: "experience", label: "Work Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "languages", label: "Languages" },
];

const QUICK_PROMPTS = [
  "Make this more concise",
  "Add stronger action verbs",
  "Make it sound more professional",
  "Quantify achievements with numbers",
  "Tailor this for a tech company",
];

interface Props {
  cv: CV;
  onCvUpdated: (cv: CV) => void;
}

export function CvSectionEditor({ cv, onCvUpdated }: Props) {
  const [section, setSection] = useState<keyof CV>("summary");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEdit, setLastEdit] = useState<string | null>(null);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setLastEdit(null);

    try {
      const res = await fetch("/api/edit-cv-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, section, prompt }),
      });
      if (!res.ok) throw new Error("Edit failed");
      const { edited } = await res.json();
      const updatedCv = { ...cv, [section]: edited };
      localStorage.setItem("hired_cv", JSON.stringify(updatedCv));
      onCvUpdated(updatedCv);
      setLastEdit(`"${SECTIONS.find((s) => s.key === section)?.label}" updated.`);
      setPrompt("");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 feature-card rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.03] p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Wand2 size={18} className="text-yellow-300" />
        <h2 className="font-display text-lg font-bold text-white">AI Section Editor</h2>
        <span className="ml-auto text-xs text-white/30 border border-white/10 rounded-full px-2 py-0.5">Premium soon</span>
      </div>
      <p className="text-white/45 text-sm">Select a section, describe what to change, and the AI will rewrite it instantly.</p>

      <form onSubmit={handleEdit} className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Section to edit</label>
          <div className="relative">
            <select
              value={String(section)}
              onChange={(e) => setSection(e.target.value as keyof CV)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
            >
              {SECTIONS.map(({ key, label }) => (
                <option key={String(key)} value={String(key)} className="bg-[#0A0716]">{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Quick suggestions</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-yellow-300/30 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Your instruction</label>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Make this more concise and add action verbs"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
          />
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}
        {lastEdit && <p className="text-green-300 text-sm">&#10003; {lastEdit}</p>}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full rounded-xl gold-grad py-3 text-sm font-extrabold text-black disabled:opacity-40"
        >
          {loading ? "AI is editing…" : "Edit with AI"}
        </button>
      </form>
    </div>
  );
}
