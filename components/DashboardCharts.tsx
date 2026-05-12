"use client";
import jobs from "../data/jobs.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3F2B96", "#F5B82E", "#9333EA", "#22C55E", "#EF4444", "#3B82F6", "#F97316"];

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-xs">{label}</span>
      <span className="text-white font-semibold text-xs">{value}</span>
    </div>
  );
}

function InsightsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-400 ease-out"
      style={{ borderTop: "0px solid transparent" }}
    >
      <div
        className="mt-3 pt-3 flex flex-col gap-2"
        style={{ borderTop: "1px solid rgba(245,184,46,0.2)" }}
      >
        <p className="text-[#F5B82E] text-xs font-semibold uppercase tracking-wider">Insights</p>
        {children}
      </div>
    </div>
  );
}

export function DashboardCharts() {
  const skillCount: Record<string, number> = {};
  const cityCount: Record<string, number> = {};
  const sectorCount: Record<string, number> = {};
  const seniorityCount: Record<string, number> = {};

  (jobs as any[]).forEach((j) => {
    (j.skills ?? []).forEach((s: string) => {
      skillCount[s] = (skillCount[s] ?? 0) + 1;
    });
    cityCount[j.city] = (cityCount[j.city] ?? 0) + 1;
    sectorCount[j.sector] = (sectorCount[j.sector] ?? 0) + 1;
    seniorityCount[j.seniority] = (seniorityCount[j.seniority] ?? 0) + 1;
  });

  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const cityData = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const sectorData = Object.entries(sectorCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const seniorityData = Object.entries(seniorityCount).map(([name, value]) => ({ name, value }));

  // ── computed insights ──────────────────────────────────
  const totalJobs   = (jobs as any[]).length;
  const uniqueSkills = Object.keys(skillCount).length;
  const topSkill     = topSkills[0];
  const top3Skills   = topSkills.slice(0, 3).map((s) => s.name).join(", ");
  const skillsCoverage = topSkills.reduce((s, x) => s + x.count, 0);

  const topCity      = cityData[0];
  const top3Cities   = cityData.slice(0, 3).map((c) => c.name).join(", ");
  const remoteJobs   = (jobs as any[]).filter((j) => j.remote).length;
  const internJobs   = (jobs as any[]).filter((j) => j.seniority === "Intern").length;

  const topSector    = sectorData[0];
  const techJobs     = (jobs as any[]).filter((j) => j.sector === "Tech").length;
  const uniqueSectors = sectorData.length;
  const avgJobsPerSector = (totalJobs / uniqueSectors).toFixed(1);

  const juniorJobs   = seniorityCount["Junior"] ?? 0;
  const entryLevel   = juniorJobs + internJobs;
  const entryPct     = ((entryLevel / totalJobs) * 100).toFixed(0);
  const seniorJobs   = seniorityCount["Senior"] ?? 0;
  const midJobs      = seniorityCount["Mid"] ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Top 10 Skills ─────────────────────────────── */}
      <div className="relative group p-5 bg-white/5 rounded-2xl border border-white/10 transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(245,184,46,0.12)] hover:border-[#F5B82E]/30">
        <h3 className="font-bold mb-1">Top 10 In-Demand Skills</h3>
        <p className="text-white/40 text-xs mb-3">Based on {totalJobs} Jordan jobs</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topSkills} margin={{ bottom: 40 }}>
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} angle={-35} textAnchor="end" />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Bar dataKey="count" fill="#F5B82E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <InsightsPanel>
          <StatRow label="Most demanded skill" value={`${topSkill?.name} (${topSkill?.count} jobs)`} />
          <StatRow label="Top 3 skills" value={top3Skills} />
          <StatRow label="Unique skills across all listings" value={uniqueSkills} />
          <StatRow label="Jobs mentioning a top-10 skill" value={`${skillsCoverage} mentions`} />
        </InsightsPanel>
      </div>

      {/* ── Jobs by City ──────────────────────────────── */}
      <div className="relative group p-5 bg-white/5 rounded-2xl border border-white/10 transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(245,184,46,0.12)] hover:border-[#F5B82E]/30">
        <h3 className="font-bold mb-1">Jobs by City</h3>
        <p className="text-white/40 text-xs mb-3">Geographic distribution</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={cityData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {cityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <InsightsPanel>
          <StatRow label="Top city" value={`${topCity?.name} (${topCity?.value} jobs)`} />
          <StatRow label="Top 3 cities" value={top3Cities} />
          <StatRow label="Remote / international" value={`${remoteJobs} jobs`} />
          <StatRow label="Cities represented" value={cityData.length} />
        </InsightsPanel>
      </div>

      {/* ── Jobs by Sector ────────────────────────────── */}
      <div className="relative group p-5 bg-white/5 rounded-2xl border border-white/10 transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(245,184,46,0.12)] hover:border-[#F5B82E]/30">
        <h3 className="font-bold mb-1">Jobs by Sector</h3>
        <p className="text-white/40 text-xs mb-3">Industry breakdown</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sectorData}>
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Bar dataKey="value" fill="#3F2B96" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <InsightsPanel>
          <StatRow label="Largest sector" value={`${topSector?.name} (${topSector?.value} jobs)`} />
          <StatRow label="Tech-specific jobs" value={techJobs} />
          <StatRow label="Total sectors" value={uniqueSectors} />
          <StatRow label="Avg jobs per sector" value={avgJobsPerSector} />
        </InsightsPanel>
      </div>

      {/* ── Jobs by Seniority ─────────────────────────── */}
      <div className="relative group p-5 bg-white/5 rounded-2xl border border-white/10 transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(245,184,46,0.12)] hover:border-[#F5B82E]/30">
        <h3 className="font-bold mb-1">Jobs by Seniority</h3>
        <p className="text-white/40 text-xs mb-3">Level distribution</p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={seniorityData}
              dataKey="value"
              nameKey="name"
              outerRadius={75}
              label={({ value, percent }) => `${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={{ stroke: "#ffffff40", strokeWidth: 1 }}
            >
              {seniorityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }}
              formatter={(value, name) => [value, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <InsightsPanel>
          <StatRow label="Entry-level opportunities" value={`${entryLevel} jobs (${entryPct}%)`} />
          <StatRow label="Internships" value={internJobs} />
          <StatRow label="Junior positions" value={juniorJobs} />
          <StatRow label="Mid / Senior" value={`${midJobs} / ${seniorJobs}`} />
        </InsightsPanel>
      </div>

    </div>
  );
}
