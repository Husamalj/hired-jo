"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  MapPin,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Navbar } from "@/components/Navbar";
import type { Job } from "@/lib/types";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live-jobs")
      .then(r => r.json())
      .then((data: Job[]) => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalJobs = jobs.length;
  const cities = new Set(jobs.map((job) => job.city)).size;
  const sectors = new Set(jobs.map((job) => job.sector)).size;
  const juniorRoles = jobs.filter((job) => job.seniority === "Junior" || job.seniority === "Intern").length;
  const topCity = Object.entries(
    jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.city] = (acc[job.city] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const marketStats = [
    { label: "Live roles", value: loading ? "…" : totalJobs, icon: BriefcaseBusiness, detail: "From live job boards" },
    { label: "Cities", value: loading ? "…" : cities, icon: MapPin, detail: topCity ? `${topCity[0]} leads` : "Jordan coverage" },
    { label: "Sectors", value: loading ? "…" : sectors, icon: BarChart3, detail: "Tech and beyond" },
    { label: "Entry-level", value: loading ? "…" : juniorRoles, icon: Target, detail: "Junior + internship roles" },
  ];

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-two hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.40),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_360px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Radio size={14} />
                  Market dashboard
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Jordan job signals, translated for students.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  See which skills, cities, sectors, and seniority levels are shaping the local hiring market, then turn the signal into a sharper CV and job search.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/jobs" className="gold-grad text-black font-extrabold px-5 py-3 rounded-2xl inline-flex items-center gap-2">
                    Explore jobs <ArrowRight size={16} />
                  </Link>
                  <Link href="/score" className="glass text-white/75 hover:text-white font-bold px-5 py-3 rounded-2xl border border-white/10 inline-flex items-center gap-2">
                    Check my fit <Target size={16} />
                  </Link>
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Market pulse</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">
                        {loading ? "…" : totalJobs.toLocaleString()}
                      </p>
                      <p className="text-sm text-white/50">live jobs tracked</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center pulse-ring">
                      <TrendingUp size={23} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles size={16} className="text-yellow-200" />
                      Live market data
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      Charts reflect real scraped jobs from LinkedIn, Akhtaboot, Bayt, Wuzzuf and more — updated every 2 hours.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {marketStats.slice(0, 2).map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-black/25 border border-white/10 p-3">
                        <div className="font-display font-bold text-lg">{stat.value}</div>
                        <div className="text-[11px] text-white/40">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {marketStats.map(({ label, value, icon: Icon, detail }) => (
              <div key={label} className="glass rounded-[22px] p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/8 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl font-extrabold gold-text-grad">{value}</p>
                    <p className="font-bold text-white/80 mt-1">{label}</p>
                    <p className="text-xs text-white/38 mt-1">{detail}</p>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-white/8 border border-white/10 text-yellow-100 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {loading ? (
            <div className="text-center py-20 text-white/30">Loading live job data…</div>
          ) : (
            <DashboardCharts jobs={jobs} />
          )}
        </div>
      </main>
    </>
  );
}
