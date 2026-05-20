"use client";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, GraduationCap, MapPin, Search, SlidersHorizontal, Sparkles, Target, Wifi, ArrowDownUp } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { Navbar } from "@/components/Navbar";
import { SourceFilter, sourceMatches, COMPANY_PAGES_VALUE } from "@/components/SourceFilter";
import { FilterDropdown } from "@/components/FilterDropdown";
import type { Job } from "@/lib/types";

function sortOtherLast(arr: string[]) {
  return [...arr].sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
}

const TYPES       = ["All", "Jobs", "Internships"];
const SENIORITIES = ["All", "Junior", "Mid", "Senior"];
const COUNTRIES   = ["All", "Jordan", "UAE", "Saudi Arabia", "Egypt", "Palestine"];
const INT_LOCS    = ["Anywhere", "Jordan", "UAE", "Saudi Arabia", "Egypt"];

const sel = "w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 outline-none text-sm text-white appearance-none cursor-pointer transition hover:border-white/20 focus:border-yellow-300/45";

function daysAgo(iso: string): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  if (isNaN(t)) return Infinity;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export default function JobsPage() {
  const [allJobs, setAllJobs]       = useState<Job[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [diverseLoading, setDiverseLoading] = useState(false);
  const [diverseJobs, setDiverseJobs] = useState<Job[]>([]);
  const [cv, setCv]                 = useState<any>(null);
  const [type, setType]             = useState("All");
  const [sector, setSector]         = useState("All");
  const [source, setSource]         = useState("All");
  const [country, setCountry]       = useState("All");
  const [city, setCity]             = useState("All");
  const [seniority, setSeniority]   = useState("All");
  const [intLoc, setIntLoc]         = useState("Anywhere");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const [search, setSearch]         = useState("");

  const isInternships = type === "Internships";
  const isJobs        = type === "Jobs";

  // Fetch live jobs + fire background scrape
  useEffect(() => {
    fetch("/api/live-jobs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllJobs(data); })
      .catch(() => {})
      .finally(() => setLiveLoading(false));

    // Background scrape of Akhtaboot RSS + For9a + Bayt + Wuzzuf (free, no API keys)
    fetch("/api/scrape-jobs?all=1")
      .then((r) => r.json())
      .then(() => fetch("/api/live-jobs"))
      .then((r) => r.json())
      .then((fresh) => { if (Array.isArray(fresh)) setAllJobs(fresh); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) setCv(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (sector !== "Other") return;
    if (diverseJobs.length > 0) return;
    setDiverseLoading(true);
    fetch("/api/diverse-jobs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDiverseJobs(data); })
      .catch(() => {})
      .finally(() => setDiverseLoading(false));
  }, [sector]);

  function handleCountryChange(c: string) { setCountry(c); setCity("All"); }

  // ------ Filter option lists derived from actual data ------
  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of allJobs) counts.set(j.source, (counts.get(j.source) ?? 0) + 1);
    return Array.from(counts.entries()).map(([source, count]) => ({ source, count }));
  }, [allJobs]);

  const SECTORS = useMemo(() => {
    const fromJobs = Array.from(new Set(allJobs.map((j) => j.sector).filter(Boolean)));
    return ["All", ...sortOtherLast(fromJobs)];
  }, [allJobs]);

  const cityOptions = useMemo(() => {
    if (country === "All") return ["All"];
    const cities = Array.from(new Set(
      allJobs.filter((j) => j.country === country).map((j) => j.city).filter(Boolean)
    )).sort();
    return ["All", ...cities];
  }, [country, allJobs]);

  // ------ Filtering ------
  const sourcePool = useMemo(
    () => sector === "Other" ? [...allJobs, ...diverseJobs] : allJobs,
    [allJobs, diverseJobs, sector]
  );

  const filtered = useMemo(() => {
    const out = sourcePool.filter((j) => {
      // Type
      if (isInternships && j.seniority !== "Intern") return false;
      if (isJobs        && j.seniority === "Intern") return false;

      // Remote toggle (works in all type modes)
      if (remoteOnly && !j.remote) return false;

      // Internship-specific location pill
      if (isInternships && intLoc !== "Anywhere") {
        if (j.country !== intLoc && !j.remote) return false;
      }

      // Common filters
      if (sector !== "All" && j.sector !== sector) return false;
      if (!sourceMatches(j.source, source)) return false;

      // Country/City/Level — apply for Jobs and All views (not Internships, which has its own location pill)
      if (!isInternships) {
        if (country   !== "All" && j.country   !== country)   return false;
        if (city      !== "All" && j.city      !== city)      return false;
        if (seniority !== "All" && j.seniority !== seniority) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    // Sort by newest postedAt first (or oldest)
    return out.sort((a, b) => {
      const da = daysAgo(a.postedAt);
      const db = daysAgo(b.postedAt);
      return sortNewest ? da - db : db - da;
    });
  }, [sourcePool, type, sector, source, country, city, seniority, intLoc, remoteOnly, search, sortNewest]);

  const internCount = useMemo(() => sourcePool.filter((j) => j.seniority === "Intern").length, [sourcePool]);
  const remoteCount = useMemo(() => sourcePool.filter((j) => j.remote).length, [sourcePool]);
  const liveSourceCount = useMemo(() => new Set(allJobs.map((j) => j.source)).size, [allJobs]);

  const filterSummary = [
    type === "All" ? "jobs + internships" : type.toLowerCase(),
    sector === "All" ? "all sectors" : sector,
    source === "All" ? "all sources" : source === COMPANY_PAGES_VALUE ? "company career pages" : source,
    isInternships ? (intLoc === "Anywhere" ? "anywhere" : intLoc) : country === "All" ? "all countries" : country,
    remoteOnly ? "remote only" : null,
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-x-hidden px-4 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-one hidden lg:block" />
        <div className="relative z-10 w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
          <section className="relative w-full min-w-0 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-5 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(245,184,46,.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.38),transparent_40%)]" />
            <div className="relative grid min-w-0 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-end">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <BriefcaseBusiness size={14} />
                  Find jobs
                </div>
                <h1 className="font-display text-[2.25rem] md:text-6xl font-extrabold text-grad leading-[1.08] md:leading-tight max-w-3xl">
                  <span className="block">Find roles that</span>
                  <span className="block">match your CV,</span>
                  <span className="block">not just keywords.</span>
                </h1>
                <p className="mt-5 w-full max-w-full md:max-w-3xl text-white/65 text-base md:text-lg leading-relaxed">
                  Browse live opportunities, filter by market signal, then check how your CV fits before you apply.
                </p>
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
                  {[
                    ["01", "Filter", "Source, sector, country"],
                    ["02", "Inspect", "Tap any card for details"],
                    ["03", "Match", "Score fit against your CV"],
                  ].map(([number, label, detail]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <div className="text-yellow-200 text-xs font-bold">{number}</div>
                      <div className="font-display font-bold mt-1">{label}</div>
                      <div className="text-xs text-white/42 mt-1">{detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden min-w-0">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Live signal</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{filtered.length}</p>
                      <p className="text-sm text-white/50">matching results now</p>
                    </div>
                    {liveLoading ? (
                      <span className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-xs font-bold text-yellow-100 animate-pulse shrink-0">Syncing</span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs font-bold text-green-200 shrink-0">
                        <span className="h-2 w-2 rounded-full bg-green-300" /> Live
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      [allJobs.length, "Listings"],
                      [internCount, "Internships"],
                      [remoteCount, "Remote"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl bg-black/25 border border-white/10 p-3">
                        <div className="font-display font-bold text-lg">{value}</div>
                        <div className="text-[11px] text-white/40">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {cv ? <Target size={16} className="text-yellow-200" /> : <Sparkles size={16} className="text-white/45" />}
                      {cv ? "CV match is ready" : "Build a CV to unlock matching"}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      {cv ? "Open a role and run Check fit to see matched skills, missing skills, and your score." : "The job board works now. Building a CV turns it into a fit simulator."}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="glass rounded-[28px] p-4 md:p-5 relative">
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl gold-grad text-black flex items-center justify-center">
                    <SlidersHorizontal size={21} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Search control</h2>
                    <p className="text-xs text-white/42">{filterSummary.join(" / ")}</p>
                  </div>
                </div>
                <div className="text-xs text-white/35">{liveSourceCount} sources / refreshes every 2 hours</div>
              </div>

              <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.4fr)_auto] gap-3 items-center">
                <label className="relative block">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title or company..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/25 border border-white/10 outline-none text-sm text-white placeholder:text-white/30 transition hover:border-white/20 focus:border-yellow-300/45"
                  />
                </label>
                <div className="grid grid-cols-3 min-w-0 rounded-2xl border border-white/10 bg-black/25 p-1">
                  {TYPES.map((o) => {
                    const active = type === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setType(o)}
                        className={`rounded-xl px-3 py-2 text-xs md:text-sm font-bold transition ${active ? "gold-grad text-black" : "text-white/55 hover:text-white"}`}
                      >
                        {o === "All" ? "All" : o}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick toggles: Remote + Sort — visible in every type mode */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRemoteOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition ${
                    remoteOnly
                      ? "gold-grad text-black"
                      : "border border-white/10 bg-black/25 text-white/65 hover:text-white"
                  }`}
                >
                  <Wifi size={14} /> Remote only
                  <span className={remoteOnly ? "text-black/70" : "text-white/40"}>({remoteCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortNewest((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/65 hover:text-white transition"
                >
                  <ArrowDownUp size={14} /> Sort: {sortNewest ? "Newest" : "Oldest"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">Source</span>
                  <SourceFilter value={source} onChange={setSource} sources={sourceCounts} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">Sector</span>
                  <FilterDropdown
                    value={sector}
                    onChange={setSector}
                    options={SECTORS.map((o) => ({ value: o, label: o === "All" ? "All Sectors" : o }))}
                  />
                </div>
                {!isInternships && (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">Country</span>
                      <FilterDropdown
                        value={country}
                        onChange={handleCountryChange}
                        options={COUNTRIES.map((o) => ({ value: o, label: o === "All" ? "All Countries" : o }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">City</span>
                      <FilterDropdown
                        value={city}
                        onChange={setCity}
                        disabled={country === "All"}
                        options={cityOptions.map((o) => ({ value: o, label: o === "All" ? "All Cities" : o }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">Level</span>
                      <FilterDropdown
                        value={seniority}
                        onChange={setSeniority}
                        options={SENIORITIES.map((o) => ({ value: o, label: o === "All" ? "All Levels" : o }))}
                      />
                    </div>
                  </>
                )}
                {isInternships && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/35 block">Location</span>
                    <FilterDropdown
                      value={intLoc}
                      onChange={setIntLoc}
                      options={INT_LOCS.map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {!cv && (
            <div className="rounded-2xl bg-[#F5B82E]/10 border border-[#F5B82E]/25 px-4 py-3 text-sm text-yellow-100 flex items-center gap-3">
              <Sparkles size={18} className="shrink-0" />
              <span>Build your CV on the <a href="/build" className="underline font-semibold">Build CV</a> page to unlock role-by-role fit checks.</span>
            </div>
          )}

          {diverseLoading && (
            <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-200 animate-pulse flex items-center gap-3">
              <Sparkles size={18} /> Fetching diverse roles across more fields...
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--gold)" }}>Results</div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-grad">
                  {isInternships ? "Internship matches" : "Open roles"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white/45">
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 inline-flex items-center gap-1.5"><Building2 size={13} /> {filtered.length} results</span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 inline-flex items-center gap-1.5"><Wifi size={13} /> {remoteCount} remote</span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 inline-flex items-center gap-1.5"><GraduationCap size={13} /> {internCount} internships</span>
              </div>
            </div>

            {liveLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
              </div>
            )}

            {!liveLoading && filtered.length === 0 && (
              <div className="text-center py-16 rounded-[28px] border border-white/10 bg-white/[0.035]">
                <MapPin className="mx-auto text-white/25 mb-4" size={38} />
                <p className="font-display text-xl font-bold text-white/70">No roles found</p>
                <p className="text-white/35 text-sm mt-2">Loosen one filter or search a broader title.</p>
              </div>
            )}

            {!liveLoading && filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((j) => <JobCard key={j.id} job={j} cv={cv} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
