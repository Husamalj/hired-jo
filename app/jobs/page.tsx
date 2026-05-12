"use client";
import { useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { Navbar } from "@/components/Navbar";
import jobs from "../../data/jobs.json";
import type { Job } from "@/lib/types";

const allJobs = jobs as Job[];

function sortOtherLast(arr: string[]) {
  return [...arr].sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
}

const TYPES      = ["All", "Jobs", "Internships"];
const SOURCES    = ["All", "Akhtaboot", "Bayt", "Wuzzuf", "Fursa"];
const SENIORITIES= ["All", "Junior", "Mid", "Senior"];
const COUNTRIES  = ["All", "Jordan", "Palestine"];
const APPLY_FROM = ["Jordan", "Palestine"];
const INT_LOCS   = ["All", "Remote", "Jordan", "Palestine", "UK"];
const SECTORS    = ["All", ...sortOtherLast(Array.from(new Set(allJobs.map((j) => j.sector))))];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Jordan:    ["Amman","Irbid","Zarqa","Balqa","Madaba","Jerash","Ajloun","Mafraq","Karak","Tafilah","Ma'an","Aqaba"],
  Palestine: ["Ramallah","Jerusalem","Nablus","Hebron","Bethlehem","Jericho","Jenin","Tulkarm","Qalqilya","Tubas","Salfit","Gaza City","Khan Yunis","Rafah","Deir al-Balah","Jabalia"],
};

const sel = "px-4 py-2 rounded-xl bg-[#1A1340] border border-white/20 outline-none text-sm text-white appearance-none cursor-pointer";

export default function JobsPage() {
  const [cv, setCv]             = useState<any>(null);
  const [type, setType]         = useState("All");
  const [sector, setSector]     = useState("All");
  const [source, setSource]     = useState("All");
  const [country, setCountry]   = useState("All");
  const [city, setCity]         = useState("All");
  const [seniority, setSeniority] = useState("All");
  const [applyFrom, setApplyFrom] = useState("Jordan");
  const [intLoc, setIntLoc]     = useState("All");
  const [search, setSearch]     = useState("");

  const isInternships = type === "Internships";
  const isJobs        = type === "Jobs";

  useEffect(() => {
    const raw = localStorage.getItem("hired_cv");
    if (raw) setCv(JSON.parse(raw));
  }, []);

  function handleCountryChange(c: string) { setCountry(c); setCity("All"); }

  const cityOptions = useMemo(() => {
    if (country === "All") return ["All"];
    return ["All", ...(CITIES_BY_COUNTRY[country] ?? [])];
  }, [country]);

  const filtered = useMemo(() =>
    allJobs.filter((j) => {
      // type filter
      if (isInternships && j.seniority !== "Intern") return false;
      if (isJobs        && j.seniority === "Intern") return false;

      // internship-specific location logic
      if (isInternships) {
        if (!j.remote && j.country !== applyFrom) return false;
        if (intLoc !== "All") {
          if (intLoc === "Remote" && !j.remote) return false;
          if (intLoc !== "Remote" && j.internshipCountry !== intLoc && !j.remote) return false;
        }
      }

      if (sector !== "All" && j.sector    !== sector)    return false;
      if (source !== "All" && j.source    !== source)    return false;

      // country/city only shown for non-internship mode
      if (!isInternships) {
        if (country !== "All" && j.country !== country) return false;
        if (city    !== "All" && j.city    !== city)    return false;
        if (seniority !== "All" && j.seniority !== seniority) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [type, sector, source, country, city, seniority, applyFrom, intLoc, search]
  );

  return (
    <>
      <Navbar />
      <main className="px-8 py-8">
      <h1 className="text-3xl font-bold mb-1">
        {isInternships ? "Internships" : "Jobs in Jordan"}
      </h1>
      <p className="text-white/50 mb-5 text-sm">{allJobs.length} listings · May 2026</p>

      {/* ── filter bar ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-5">

        {/* search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or company…"
          className="px-4 py-2 rounded-xl bg-[#1A1340] border border-white/20 outline-none text-sm text-white flex-1 min-w-[180px] placeholder:text-white/30"
        />

        {/* type */}
        <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
          {TYPES.map((o) => <option key={o} value={o}>{o === "All" ? "Jobs & Internships" : o}</option>)}
        </select>

        {/* source */}
        <select value={source} onChange={(e) => setSource(e.target.value)} className={sel}>
          {SOURCES.map((o) => <option key={o} value={o}>{o === "All" ? "All Sources" : o}</option>)}
        </select>

        {/* sector */}
        <select value={sector} onChange={(e) => setSector(e.target.value)} className={sel}>
          {SECTORS.map((o) => <option key={o} value={o}>{o === "All" ? "All Sectors" : o}</option>)}
        </select>

        {/* non-internship filters */}
        {!isInternships && (
          <>
            <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className={sel}>
              {COUNTRIES.map((o) => <option key={o} value={o}>{o === "All" ? "All Countries" : o}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={sel} disabled={country === "All"}>
              {cityOptions.map((o) => <option key={o} value={o}>{o === "All" ? "All Cities" : o}</option>)}
            </select>
            <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className={sel}>
              {SENIORITIES.map((o) => <option key={o} value={o}>{o === "All" ? "All Levels" : o}</option>)}
            </select>
          </>
        )}

        {/* internship-only filters */}
        {isInternships && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm whitespace-nowrap">I'm in</span>
              <select value={applyFrom} onChange={(e) => setApplyFrom(e.target.value)} className={sel}>
                {APPLY_FROM.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm whitespace-nowrap">Location</span>
              <select value={intLoc} onChange={(e) => setIntLoc(e.target.value)} className={sel}>
                {INT_LOCS.map((o) => <option key={o} value={o}>{o === "All" ? "Anywhere" : o}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* cv banner */}
      {!cv && (
        <div className="mb-4 p-3 rounded-xl bg-[#F5B82E]/10 border border-[#F5B82E]/30 text-sm text-[#F5B82E]">
          💡 CV not built yet — your teammate handles that on the{" "}
          <a href="/build" className="underline font-semibold">/build</a> page. Once done, "Check fit" unlocks.
        </div>
      )}

      <p className="text-white/40 text-xs mb-4">{filtered.length} results</p>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">🔍</p>
          <p>No results. Try loosening your filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((j) => <JobCard key={j.id} job={j} cv={cv} />)}
      </div>
    </main>
    </>
  );
}
