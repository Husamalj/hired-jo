"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelectDropdown({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function toggle(opt: string) {
    if (opt === "All") { onChange([]); return; }
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next);
  }

  const displayLabel = selected.length === 0
    ? label
    : selected.length === 1
    ? selected[0]
    : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          selected.length > 0
            ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-100"
            : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80"
        }`}
      >
        {displayLabel}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-2xl border border-white/10 bg-[#0A0716] shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            {["All", ...options].map((opt) => {
              const isSelected = opt === "All" ? selected.length === 0 : selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition ${
                    isSelected ? "bg-yellow-300/12 text-yellow-100" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {opt}
                  {isSelected && opt !== "All" && <Check size={13} className="text-yellow-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
