"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  Lightbulb,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { Job } from "@/lib/types";

const COLORS = ["#F5B82E", "#5B3FC8", "#38BDF8", "#22C55E", "#F97316", "#EF4444", "#A78BFA"];

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-white/45 text-xs">{label}</span>
      <span className="text-white/85 font-bold text-xs text-right">{value}</span>
    </div>
  );
}

function ChartCard({
  title,
  eyebrow,
  icon: Icon,
  children,
  insight,
  stats,
}: {
  title: string;
  eyebrow: string;
  icon: React.ElementType;
  children: React.ReactNode;
  insight: string;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden group min-h-[430px]">
      <div className="absolute inset-0 dot-grid opacity-15" />
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
              <Icon size={23} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">{eyebrow}</p>
              <h2 className="font-display text-xl md:text-2xl font-bold text-grad mt-1">{title}</h2>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] text-white/45">
            Hover
          </span>
        </div>

        <div className="relative flex-1 rounded-[24px] border border-white/10 bg-black/20 p-3">
          {children}
        </div>

        <div className="mt-4 rounded-[22px] border border-yellow-300/15 bg-yellow-300/8 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb size={17} className="text-yellow-200 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed text-white/68">{insight}</p>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-0 overflow-hidden opacity-0 group-hover:max-h-44 group-hover:opacity-100 transition-all duration-500">
            {stats.map((stat) => (
              <StatRow key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#120D26]/95 px-3 py-2 shadow-2xl">
      <p className="text-xs font-bold text-white">{label ?? item.name}</p>
      <p className="text-xs text-yellow-200 mt-1">{item.value} jobs</p>
    </div>
  );
}

// Infer skills from title + description when the job's skills array is empty
const SKILL_PATTERNS: [RegExp, string][] = [
  [/\breact\b/i, "React"],
  [/\bnext\.?js\b/i, "Next.js"],
  [/\bnode\.?js\b/i, "Node.js"],
  [/\bpython\b/i, "Python"],
  [/\bjava(?!script)\b/i, "Java"],
  [/\bjavascript\b|\bjs\b/i, "JavaScript"],
  [/\btypescript\b|\bts\b/i, "TypeScript"],
  [/\bsql\b/i, "SQL"],
  [/\bpostgres/i, "PostgreSQL"],
  [/\bmysql\b/i, "MySQL"],
  [/\bmongodb\b/i, "MongoDB"],
  [/\baws\b/i, "AWS"],
  [/\bazure\b/i, "Azure"],
  [/\bdocker\b/i, "Docker"],
  [/\bkubernetes\b|\bk8s\b/i, "Kubernetes"],
  [/\bgit\b/i, "Git"],
  [/\bfigma\b/i, "Figma"],
  [/\bphotoshop\b/i, "Photoshop"],
  [/\billustrator\b/i, "Illustrator"],
  [/\bui\/ux\b|\bux design\b|\bui design\b/i, "UI/UX"],
  [/\bgraphic design\b/i, "Graphic Design"],
  [/\bseo\b/i, "SEO"],
  [/\bdigital marketing\b/i, "Digital Marketing"],
  [/\bcontent\b/i, "Content"],
  [/\bsocial media\b/i, "Social Media"],
  [/\baccounting\b/i, "Accounting"],
  [/\bexcel\b/i, "Excel"],
  [/\bsap\b/i, "SAP"],
  [/\bsales\b/i, "Sales"],
  [/\bcustomer service\b/i, "Customer Service"],
  [/\bproject manag/i, "Project Management"],
  [/\bscrum\b|\bagile\b/i, "Agile/Scrum"],
  [/\bhr\b|human resource/i, "HR"],
  [/\brecruit/i, "Recruiting"],
  [/\bphp\b/i, "PHP"],
  [/\blaravel\b/i, "Laravel"],
  [/\bflutter\b/i, "Flutter"],
  [/\bswift\b/i, "Swift"],
  [/\bkotlin\b/i, "Kotlin"],
  [/\breact native\b/i, "React Native"],
  [/\bmachine learning\b|\bml\b/i, "Machine Learning"],
  [/\bdata analys/i, "Data Analysis"],
  [/\bpower bi\b/i, "Power BI"],
  [/\btableau\b/i, "Tableau"],
  [/\bnetwork/i, "Networking"],
  [/\bcyber/i, "Cybersecurity"],
  [/\blinux\b/i, "Linux"],
  [/\bc\+\+\b/i, "C++"],
  [/\bc#\b/i, "C#"],
  [/\.net\b/i, ".NET"],
];

function inferSkillsFromText(title: string, description = ""): string[] {
  const text = title + " " + description;
  return SKILL_PATTERNS
    .filter(([pattern]) => pattern.test(text))
    .map(([, skill]) => skill);
}

export function DashboardCharts({ jobs }: { jobs: Job[] }) {
  const skillCount: Record<string, number> = {};
  const cityCount: Record<string, number> = {};
  const sectorCount: Record<string, number> = {};
  const seniorityCount: Record<string, number> = {};

  jobs.forEach((job) => {
    // Use stored skills if available, otherwise infer from title+description
    const skills = (job.skills ?? []).length > 0
      ? job.skills
      : inferSkillsFromText(job.title, job.description ?? "");
    skills.forEach((skill: string) => {
      skillCount[skill] = (skillCount[skill] ?? 0) + 1;
    });
    cityCount[job.city] = (cityCount[job.city] ?? 0) + 1;
    sectorCount[job.sector] = (sectorCount[job.sector] ?? 0) + 1;
    seniorityCount[job.seniority] = (seniorityCount[job.seniority] ?? 0) + 1;
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

  const seniorityData = Object.entries(seniorityCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const totalJobs = jobs.length;
  const uniqueSkills = Object.keys(skillCount).length;
  const topSkill = topSkills[0];
  const top3Skills = topSkills.slice(0, 3).map((skill) => skill.name).join(", ");
  const skillsCoverage = topSkills.reduce((sum, skill) => sum + skill.count, 0);

  const topCity = cityData[0];
  const top3Cities = cityData.slice(0, 3).map((city) => city.name).join(", ");
  const remoteJobs = jobs.filter((job) => job.remote).length;
  const internJobs = jobs.filter((job) => job.seniority === "Intern").length;

  const topSector = sectorData[0];
  const techJobs = jobs.filter((job) => job.sector === "Tech").length;
  const uniqueSectors = sectorData.length;
  const avgJobsPerSector = uniqueSectors > 0 ? (totalJobs / uniqueSectors).toFixed(1) : "0";

  const juniorJobs = seniorityCount.Junior ?? 0;
  const entryLevel = juniorJobs + internJobs;
  const entryPct = totalJobs > 0 ? ((entryLevel / totalJobs) * 100).toFixed(0) : "0";
  const seniorJobs = seniorityCount.Senior ?? 0;
  const midJobs = seniorityCount.Mid ?? 0;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <ChartCard
        title="Skills in demand"
        eyebrow="Skill radar"
        icon={Sparkles}
        insight={`Students should lead with ${topSkill?.name ?? "their strongest skill"} and prove it with projects, because the top skills appear across ${skillsCoverage} listing mentions.`}
        stats={[
          { label: "Most demanded skill", value: `${topSkill?.name} (${topSkill?.count})` },
          { label: "Top 3 skills", value: top3Skills },
          { label: "Unique skills", value: uniqueSkills },
          { label: "Jobs sampled", value: totalJobs },
        ]}
      >
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={topSkills} margin={{ top: 10, right: 8, bottom: 44, left: -18 }}>
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} angle={-32} textAnchor="end" interval={0} />
            <YAxis stroke="#ffffff50" fontSize={11} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,184,46,.08)" }} />
            <Bar dataKey="count" fill="#F5B82E" radius={[8, 8, 2, 2]} isAnimationActive={false}>
              {topSkills.map((_, index) => (
                <Cell key={index} fill={index === 0 ? "#F5B82E" : COLORS[(index + 1) % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Opportunity by city"
        eyebrow="Location signal"
        icon={MapPin}
        insight={`${topCity?.name ?? "Amman"} is the strongest visible market in this sample, so location-aware search matters for students comparing on-site, hybrid, and regional options.`}
        stats={[
          { label: "Top city", value: `${topCity?.name} (${topCity?.value})` },
          { label: "Top 3 cities", value: top3Cities },
          { label: "Remote roles", value: remoteJobs },
          { label: "Cities represented", value: cityData.length },
        ]}
      >
        <ResponsiveContainer width="100%" height={270}>
          <PieChart>
            <Pie data={cityData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3} isAnimationActive={false}>
              {cityData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="rgba(10,7,22,.65)" strokeWidth={3} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-display text-3xl font-extrabold gold-text-grad">{cityData.length}</p>
            <p className="text-[11px] text-white/40">cities</p>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Sector concentration"
        eyebrow="Industry map"
        icon={BriefcaseBusiness}
        insight={`${topSector?.name ?? "Tech"} is the largest sector in the current sample, but the board still shows enough spread to support non-technical student pathways.`}
        stats={[
          { label: "Largest sector", value: `${topSector?.name} (${topSector?.value})` },
          { label: "Tech jobs", value: techJobs },
          { label: "Total sectors", value: uniqueSectors },
          { label: "Avg per sector", value: avgJobsPerSector },
        ]}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sectorData} margin={{ top: 10, right: 8, bottom: 54, left: -18 }}>
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={10} angle={-24} textAnchor="end" interval={0} />
            <YAxis stroke="#ffffff50" fontSize={11} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(91,63,200,.14)" }} />
            <Bar dataKey="value" fill="#F5B82E" radius={[8, 8, 2, 2]} isAnimationActive={false}>
              {sectorData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Seniority mix"
        eyebrow="Graduate fit"
        icon={GraduationCap}
        insight={`${entryPct}% of the sample is entry-friendly, which helps Hired.jo steer students toward roles where a stronger CV can realistically compete.`}
        stats={[
          { label: "Entry-level", value: `${entryLevel} jobs (${entryPct}%)` },
          { label: "Internships", value: internJobs },
          { label: "Junior roles", value: juniorJobs },
          { label: "Mid / Senior", value: `${midJobs} / ${seniorJobs}` },
        ]}
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={seniorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={92} paddingAngle={4} isAnimationActive={false}>
              {seniorityData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="rgba(10,7,22,.65)" strokeWidth={3} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-display text-3xl font-extrabold gold-text-grad">{entryPct}%</p>
            <p className="text-[11px] text-white/40">entry-friendly</p>
          </div>
        </div>
      </ChartCard>

      <aside className="xl:col-span-2 glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-15" />
        <div className="relative grid lg:grid-cols-[280px_1fr] gap-5 items-center">
          <div>
            <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center mb-4">
              <Compass size={23} />
            </div>
            <h2 className="font-display text-2xl font-bold text-grad">What this means</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              The dashboard should feel like career intelligence, not decoration. Every chart answers a student question before they choose a job or rewrite a CV.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              ["Learn the market", "See the skills and cities with the strongest pull."],
              ["Aim the CV", "Turn repeated requirements into proof points."],
              ["Apply smarter", "Use the job list with a clearer target."],
            ].map(([title, body], index) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-yellow-200 text-xs font-extrabold">0{index + 1}</p>
                <p className="font-display font-bold mt-2">{title}</p>
                <p className="text-xs leading-relaxed text-white/45 mt-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
