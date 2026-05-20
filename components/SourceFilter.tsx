"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Building, ChevronDown, Globe, Search, X } from "lucide-react";

// Source classification — drives both the grouped UI and the "Company pages" wildcard match
const JOB_BOARDS = new Set([
  "LinkedIn", "Akhtaboot", "Bayt", "Wuzzuf", "Fursa",
  "Indeed", "Glassdoor", "GulfTalent", "Naukrigulf",
]);

const AGGREGATORS = new Set([
  "BeBee", "ReliefWeb", "UN Talent", "UNjobnet",
]);

// Special sentinel for "any company career page (not a major board)"
export const COMPANY_PAGES_VALUE = "__company_pages__";

export function classifySource(source: string): "board" | "aggregator" | "company" {
  if (JOB_BOARDS.has(source)) return "board";
  if (AGGREGATORS.has(source)) return "aggregator";
  return "company";
}

/** Does a job's source match the given filter value? Handles the company-pages sentinel. */
export function sourceMatches(jobSource: string, filterValue: string): boolean {
  if (filterValue === "All") return true;
  if (filterValue === COMPANY_PAGES_VALUE) return classifySource(jobSource) === "company";
  return jobSource === filterValue;
}

type Counts = Map<string, number>;

export function SourceFilter({
  value,
  onChange,
  sources,
}: {
  value: string;
  onChange: (v: string) => void;
  sources: Array<{ source: string; count: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showCompanies, setShowCompanies] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape
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

  const counts: Counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sources) m.set(s.source, s.count);
    return m;
  }, [sources]);

  // Group sources, keep only ones we actually have, and sort each group by count desc
  const groups = useMemo(() => {
    const boards: Array<{ source: string; count: number }> = [];
    const aggs: Array<{ source: string; count: number }> = [];
    const companies: Array<{ source: string; count: number }> = [];
    for (const { source, count } of sources) {
      const cls = classifySource(source);
      if (cls === "board") boards.push({ source, count });
      else if (cls === "aggregator") aggs.push({ source, count });
      else companies.push({ source, count });
    }
    const bySaved = (a: { count: number }, b: { count: number }) => b.count - a.count;
    boards.sort(bySaved);
    aggs.sort(bySaved);
    companies.sort(bySaved);
    return { boards, aggs, companies };
  }, [sources]);

  const companyTotal = groups.companies.reduce((s, x) => s + x.count, 0);

  const filteredCompanies = useMemo(() => {
    if (!query.trim()) return groups.companies;
    const q = query.toLowerCase();
    return groups.companies.filter((c) => c.source.toLowerCase().includes(q));
  }, [groups.companies, query]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  // Label for the closed trigger
  const triggerLabel =
    value === "All" ? "All Sources" :
    value === COMPANY_PAGES_VALUE ? `Company Career Pages (${companyTotal})` :
    value;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 rounded-2xl bg-black/25 border outline-none text-sm text-white cursor-pointer transition flex items-center justify-between gap-2 ${
          open ? "border-yellow-300/45" : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="truncate text-left">{triggerLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-white/40 transition ${open ? "rotate-180 text-yellow-200" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-2 rounded-2xl border border-white/12 bg-[#120A2B]/98 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{ maxHeight: "min(70vh, 540px)" }}
        >
          {/* Search */}
          <div className="p-3 border-b border-white/8">
            <label className="relative block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter sources (optional)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/35 border border-white/10 outline-none text-xs text-white placeholder:text-white/30 focus:border-yellow-300/45"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
                  aria-label="Clear"
                >
                  <X size={13} />
                </button>
              )}
            </label>
          </div>

          <div className="overflow-y-auto p-2 space-y-3" style={{ maxHeight: "calc(min(70vh, 540px) - 60px)" }}>
            {/* All Sources */}
            <button
              type="button"
              onClick={() => pick("All")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-between ${
                value === "All" ? "gold-grad text-black" : "text-white/80 hover:bg-white/8"
              }`}
            >
              <span className="inline-flex items-center gap-2"><Globe size={14} /> All Sources</span>
              <span className={value === "All" ? "text-black/70 text-xs" : "text-white/40 text-xs"}>
                {sources.reduce((s, x) => s + x.count, 0)}
              </span>
            </button>

            {/* Major Job Boards */}
            {groups.boards.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-yellow-200/60 font-bold flex items-center gap-1.5">
                  <Briefcase size={11} /> Job Boards
                </div>
                <div className="space-y-0.5">
                  {groups.boards
                    .filter((b) => !query.trim() || b.source.toLowerCase().includes(query.toLowerCase()))
                    .map((b) => (
                      <button
                        key={b.source}
                        type="button"
                        onClick={() => pick(b.source)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                          value === b.source ? "bg-yellow-300/15 text-yellow-100 border border-yellow-300/30" : "text-white/75 hover:bg-white/8"
                        }`}
                      >
                        <span>{b.source}</span>
                        <span className="text-white/35 text-xs">{b.count}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Aggregators */}
            {groups.aggs.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-purple-200/60 font-bold flex items-center gap-1.5">
                  <Globe size={11} /> Aggregators
                </div>
                <div className="space-y-0.5">
                  {groups.aggs
                    .filter((b) => !query.trim() || b.source.toLowerCase().includes(query.toLowerCase()))
                    .map((b) => (
                      <button
                        key={b.source}
                        type="button"
                        onClick={() => pick(b.source)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                          value === b.source ? "bg-yellow-300/15 text-yellow-100 border border-yellow-300/30" : "text-white/75 hover:bg-white/8"
                        }`}
                      >
                        <span>{b.source}</span>
                        <span className="text-white/35 text-xs">{b.count}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Company Career Pages — collapsible */}
            {groups.companies.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold flex items-center gap-1.5">
                  <Building size={11} /> Company Career Pages
                </div>

                {/* Quick "all company pages" pill */}
                <button
                  type="button"
                  onClick={() => pick(COMPANY_PAGES_VALUE)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                    value === COMPANY_PAGES_VALUE ? "bg-yellow-300/15 text-yellow-100 border border-yellow-300/30" : "text-white/75 hover:bg-white/8"
                  }`}
                >
                  <span className="font-bold">All company pages</span>
                  <span className="text-white/35 text-xs">{companyTotal}</span>
                </button>

                {/* Expander */}
                {!query.trim() && (
                  <button
                    type="button"
                    onClick={() => setShowCompanies((v) => !v)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/85 hover:bg-white/5 transition flex items-center justify-between"
                  >
                    <span>{showCompanies ? "Hide individual pages" : `Show ${groups.companies.length} individual pages`}</span>
                    <ChevronDown size={13} className={`transition ${showCompanies ? "rotate-180" : ""}`} />
                  </button>
                )}

                {(showCompanies || query.trim()) && (
                  <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto">
                    {filteredCompanies.length === 0 && (
                      <div className="px-3 py-2 text-xs text-white/35">No company pages match "{query}"</div>
                    )}
                    {filteredCompanies.map((b) => (
                      <button
                        key={b.source}
                        type="button"
                        onClick={() => pick(b.source)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                          value === b.source ? "bg-yellow-300/15 text-yellow-100 border border-yellow-300/30" : "text-white/70 hover:bg-white/8"
                        }`}
                      >
                        <span className="truncate pr-2">{b.source}</span>
                        <span className="text-white/35 text-xs shrink-0">{b.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
