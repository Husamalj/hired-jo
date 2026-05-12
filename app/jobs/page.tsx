"use client";
import { useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { Navbar } from "@/components/Navbar";
import staticJobs from "../../data/jobs.json";
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
const COUNTRIES   = ["All", "Jordan", "UAE", "Saudi Arabia", "Palestine"];
const APPLY_FROM  = ["Jordan", "UAE", "Saudi Arabia", "Palestine"];
const INT_LOCS    = ["All", "Remote", "Jordan", "UAE", "Saudi Arabia", "Palestine", "UK"];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Jordan:       ["Amman","Irbid","Zarqa","Balqa","Madaba","Jerash","Ajloun","Mafraq","Karak","Tafilah","Ma'an","Aqaba"],
  UAE:          ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam","Al Khobar","Dhahran","Tabuk","Abha","Taif","Jubail","Yanbu","Najran","Hail","Khamis Mushait","Buraidah","Al Ahsa"],
  Palestine:    ["Ramallah","Jerusalem","Nablus","Hebron","Bethlehem","Jericho","Jenin","Tulkarm","Qalqilya","Tubas","Salfit","Gaza City","Khan Yunis","Rafah","Deir al-Balah","Jabalia"],
};

const sel = "px-4 py-2 rounded-xl bg-[#1A1340] border border-white/20 outline-none text-sm text-white appearance-none cursor-pointer";

export default function JobsPage() {
  const [allJobs, setAllJobs]       = useState<Job[]>(staticJobs as Job[]);
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
  const [applyFrom, setApplyFrom]   = useState("Jordan");
  const [intLoc, setIntLoc]         = useState("All");
  const [search, setSearch]         = useState("");

  const isInternships = type === "Internships";
  const isJobs        = type === "Jobs";

  // Fetch live jobs on mount
  useEffect(() => {
    fetch("/api/live-jobs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllJobs(data); })
      .catch(() => {/* keep static fallback */})
      .finally(() => setLiveLoading(false));
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

  const cityOptions = useMemo(() => {
    if (country === "All") return ["All"];
    return ["All", ...(CITIES_BY_COUNTRY[country] ?? [])];
  }, [country]);

  const SOURCES  = useMemo(() => ["All", ...Array.from(new Set(allJobs.map((j) => j.source)))], [allJobs]);
  const SECTORS  = useMemo(() => {
    const fromJobs = Array.from(new Set(allJobs.map((j) => j.sector)));
    const always = ["Tech","Finance","Marketing","Sales","Design","Creative","HR","Healthcare","Education","Legal","Operations","Customer Service","Construction","Other"];
    const merged = Array.from(new Set([...fromJobs, ...always]));
    return ["All", ...sortOtherLast(merged.filter((s) => s !== "All"))];
  }, [allJobs]);

  const sourcePool = useMemo(
    () => sector === "Other" ? [...allJobs, ...diverseJobs] : allJobs,
    [allJobs, diverseJobs, sector]
  );

  const filtered = useMemo(() =>
    sourcePool.filter((j) => {
      if (isInternships && j.seniority !== "Intern") return false;
      if (isJobs        && j.seniority === "Intern") return false;

      if (isInternships) {
        if (!j.remote && j.country !== applyFrom) return false;
        if (intLoc !== "All") {
          if (intLoc === "Remote" && !j.remote) return false;
          if (intLoc !== "Remote" && (j as any).internshipCountry !== intLoc && !j.remote) return false;
        }
      }

      if (sector !== "All" && j.sector   !== sector)   return false;
      if (source !== "All" && j.source   !== source)   return false;

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
    }),
    [sourcePool, type, sector, source, country, city, seniority, applyFrom, intLoc, search]
  );

  return (
    <>
      <Navbar />
      <main className="px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold">
            {isInternships ? "Internships" : "Jobs in Jordan"}
          </h1>
          {liveLoading ? (
            <span className="text-xs text-white/30 animate-pulse">Fetching live jobs…</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
              ● Live
            </span>
          )}
        </div>
        <p className="text-white/50 mb-5 text-sm">{allJobs.length} listings · updates every 30 min</p>

        {/* ── filter bar ── */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or company…"
            className="px-4 py-2 rounded-xl bg-[#1A1340] border border-white/20 outline-none text-sm text-white flex-1 min-w-[180px] placeholder:text-white/30"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
            {TYPES.map((o) => <option key={o} value={o}>{o === "All" ? "Jobs & Internships" : o}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={sel}>
            {SOURCES.map((o) => <option key={o} value={o}>{o === "All" ? "All Sources" : o}</option>)}
          </select>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={sel}>
            {SECTORS.map((o) => <option key={o} value={o}>{o === "All" ? "All Sectors" : o}</option>)}
          </select>
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
          {isInternships && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-sm whitespace-nowrap">I&apos;m in</span>
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

        {!cv && (
          <div className="mb-4 p-3 rounded-xl bg-[#F5B82E]/10 border border-[#F5B82E]/30 text-sm text-[#F5B82E]">
            💡 Build your CV on the <a href="/build" className="underline font-semibold">/build</a> page to unlock "Check fit".
          </div>
        )}

        {diverseLoading && (
          <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300 animate-pulse">
            ✨ Fetching 100 diverse jobs across 10 fields…
          </div>
        )}

        {liveLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!liveLoading && (
          <>
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
          </>
        )}
      </main>
    </>
  );
}
