"use client";
import { useRef, useState } from "react";
import { Upload, CheckCircle2, X } from "lucide-react";
import type { CV } from "@/lib/types";

interface Props {
  onCvLoaded: (cv: CV) => void;
}

export function CvUploadBanner({ onCvLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-cv", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to parse CV");
      const cv: CV = await res.json();
      localStorage.setItem("hired_cv", JSON.stringify(cv));
      onCvLoaded(cv);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-300/20 bg-green-400/8 px-4 py-3 text-sm text-green-200">
        <CheckCircle2 size={16} className="shrink-0" />
        <span>CV uploaded — Check Fit is now unlocked on all job cards.</span>
        <button onClick={() => setDismissed(true)} className="ml-auto text-white/30 hover:text-white"><X size={15} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-yellow-300/5 px-4 py-3 text-sm">
      <Upload size={15} className="shrink-0 text-yellow-200/70" />
      <span className="text-white/55">Already have a CV? Upload it to unlock <strong className="text-white/80">Check Fit</strong>.</span>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="ml-auto shrink-0 rounded-xl gold-grad px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
      >
        {loading ? "Parsing…" : "Upload CV"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <span className="ml-2 text-red-300 text-xs">{error}</span>}
      <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/50"><X size={14} /></button>
    </div>
  );
}
