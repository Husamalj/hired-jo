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

  const cityData = Object.entries(cityCount).map(([name, value]) => ({ name, value }));
  const sectorData = Object.entries(sectorCount).map(([name, value]) => ({ name, value }));
  const seniorityData = Object.entries(seniorityCount).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="font-bold mb-1">Top 10 In-Demand Skills</h3>
        <p className="text-white/40 text-xs mb-3">Based on {jobs.length} Jordan jobs</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topSkills} margin={{ bottom: 40 }}>
            <XAxis
              dataKey="name"
              stroke="#ffffff60"
              fontSize={11}
              angle={-35}
              textAnchor="end"
            />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }}
            />
            <Bar dataKey="count" fill="#F5B82E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="font-bold mb-1">Jobs by City</h3>
        <p className="text-white/40 text-xs mb-3">Geographic distribution</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={cityData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {cityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="font-bold mb-1">Jobs by Sector</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sectorData}>
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }}
            />
            <Bar dataKey="value" fill="#3F2B96" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="font-bold mb-1">Jobs by Seniority</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={seniorityData} dataKey="value" nameKey="name" outerRadius={80} label>
              {seniorityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1A1340", border: "1px solid #ffffff20", borderRadius: 8 }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
