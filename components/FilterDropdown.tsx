"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

export function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  const triggerLabel = current?.label ?? placeholder;

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-2xl bg-black/25 border outline-none text-sm text-white text-left cursor-pointer transition flex items-center justify-between gap-2 ${
          disabled ? "opacity-45 cursor-not-allowed" : open ? "border-yellow-300/45" : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-white/40 transition ${open ? "rotate-180 text-yellow-200" : ""}`} />
      </button>

      {open && !disabled && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/15 shadow-2xl shadow-black/80 overflow-hidden"
          style={{ maxHeight: "min(60vh, 380px)", zIndex: 100, background: "#100823" }}
        >
          <div className="overflow-y-auto p-1.5 space-y-0.5" style={{ maxHeight: "min(60vh, 380px)" }}>
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                    selected ? "bg-yellow-300/15 text-yellow-100 border border-yellow-300/30" : "text-white/80 hover:bg-white/8"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    {selected && <Check size={13} className="text-yellow-200 shrink-0" />}
                    <span className="truncate">{o.label}</span>
                  </span>
                  {o.count !== undefined && (
                    <span className={`shrink-0 text-xs ${selected ? "text-yellow-100/70" : "text-white/35"}`}>
                      {o.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
