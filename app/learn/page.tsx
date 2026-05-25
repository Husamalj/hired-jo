"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  Route,
  Search,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import type { CV } from "@/lib/types";
import rawResources from "@/data/learning-resources.json";
import rawCerts from "@/data/certifications-jo.json";
import rawJobs from "@/data/jobs.json";

interface Resource {
  id: string;
  skill: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  free: boolean;
  language: string;
}

interface Cert {
  id: string;
  name: string;
  provider: string;
  url: string;
  fields: string[];
  format: string;
  free: boolean;
  language: string;
  description: string;
}

const resources = rawResources as Resource[];
const certs = rawCerts as Cert[];
const jobs = rawJobs as any[];

function loadCv(): CV | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("hired_cv");
    return raw ? (JSON.parse(raw) as CV) : null;
  } catch {
    return null;
  }
}

type DataSector = "Tech" | "Transport" | "FinTech" | "Healthcare";
type NoDataField =
  | "Creative & Design"
  | "Marketing & Media"
  | "Legal"
  | "Education"
  | "Engineering (non-IT)"
  | "Other";

type Field = DataSector | NoDataField;

const FIELD_SIGNALS: Record<Field, string[]> = {
  Healthcare: [
    "doctor", "physician", "nurse", "medical", "health", "clinical", "hospital",
    "pharmacy", "pharmacist", "dentist", "surgeon", "medicine", "patient",
    "radiology", "laboratory", "biomedical", "therapist", "nutrition", "dietitian",
  ],
  FinTech: [
    "finance", "financial", "banking", "bank", "accountant", "accounting",
    "fintech", "investment", "audit", "tax", "insurance", "actuary",
    "economics", "economist", "treasury", "compliance", "risk", "cfa", "cpa",
  ],
  Transport: [
    "transport", "logistics", "supply chain", "fleet", "driver", "shipping",
    "warehouse", "procurement", "delivery", "freight", "customs",
  ],
  Tech: [
    "software", "developer", "engineer", "programming", "frontend", "backend",
    "fullstack", "devops", "data scientist", "machine learning", "web developer",
    "mobile developer", "cybersecurity", "network engineer", "cloud", "computer science",
    "information technology", "it support", "ict",
  ],
  "Creative & Design": [
    "photographer", "photography", "graphic design", "designer", "illustrator",
    "videographer", "video editor", "animator", "motion", "ui designer", "ux designer",
    "art director", "creative", "visual", "branding", "adobe", "photoshop",
    "lightroom", "premiere", "after effects", "figma", "sketch",
  ],
  "Marketing & Media": [
    "marketing", "social media", "content creator", "copywriter", "journalist",
    "public relations", "pr ", "seo", "digital marketing", "advertising",
    "media", "communications", "brand", "influencer", "campaign",
  ],
  Legal: [
    "lawyer", "attorney", "legal", "law", "paralegal", "judge", "court",
    "litigation", "contract", "compliance officer", "llb", "llm",
  ],
  Education: [
    "teacher", "professor", "instructor", "lecturer", "tutor", "trainer",
    "curriculum", "education", "school", "university faculty", "teaching",
    "e-learning", "academic",
  ],
  "Engineering (non-IT)": [
    "civil engineer", "mechanical engineer", "electrical engineer", "structural",
    "architecture", "architect", "construction", "autocad", "solidworks",
    "manufacturing", "industrial engineer", "chemical engineer",
  ],
  Other: [],
};

const FIELD_SKILLS: Partial<Record<NoDataField, string[]>> = {
  "Creative & Design": [
    "Adobe Photoshop", "Adobe Lightroom", "Adobe Premiere Pro", "After Effects",
    "Figma", "Canva", "Illustration", "Brand Identity", "Color Theory",
    "Typography", "Video Editing", "Photography Composition",
  ],
  "Marketing & Media": [
    "Google Analytics", "Meta Ads", "SEO", "Content Strategy", "Copywriting",
    "Email Marketing", "HubSpot", "Social Media Management", "Google Ads",
    "A/B Testing", "CRM Tools",
  ],
  Legal: [
    "Legal Research", "Contract Drafting", "Legal Writing", "Microsoft Word",
    "Case Management", "Negotiation", "Compliance", "Legal Tech Tools",
  ],
  Education: [
    "Curriculum Design", "Learning Management Systems", "Public Speaking",
    "Instructional Design", "Google Classroom", "Assessment Design",
    "Microsoft Office", "Presentation Skills",
  ],
  "Engineering (non-IT)": [
    "AutoCAD", "SolidWorks", "MATLAB", "Project Management", "MS Project",
    "Structural Analysis", "BIM", "Revit", "Technical Drawing",
  ],
  Other: [],
};

function detectField(cv: CV): Field {
  const haystack = [
    ...(cv.experience ?? []).map((item) => `${item.title} ${item.company}`),
    ...(cv.education ?? []).map((item) => `${item.degree} ${item.institution}`),
    ...(cv.skills ?? []),
    cv.summary ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const scores: Record<Field, number> = {} as Record<Field, number>;
  for (const [field, keywords] of Object.entries(FIELD_SIGNALS) as [Field, string[]][]) {
    scores[field] = keywords.filter((keyword) => haystack.includes(keyword)).length;
  }

  const best = (Object.entries(scores) as [Field, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "Other";
}

function hasJobData(field: Field): field is DataSector {
  return ["Tech", "Transport", "FinTech", "Healthcare"].includes(field);
}

function getTopSkillsFromJobs(sector: DataSector): string[] {
  const sectorJobs = jobs.filter((job) => job.sector === sector);
  const pool = sectorJobs.length >= 3 ? sectorJobs : jobs;
  const counts: Record<string, number> = {};
  pool.forEach((job) =>
    (job.skills ?? []).forEach((skill: string) => {
      const key = skill.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    })
  );
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([skill]) => skill);
}

function normalizeText(text: string) {
  return text
    .replaceAll("\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d", "-")
    .replaceAll("\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153", "-")
    .replaceAll("\u00c3\u201a\u00c2\u00b7", "/")
    .replaceAll("\u00c3\u00a2\u00e2\u20ac\u00a0\u00e2\u20ac\u2122", "->");
}

function languageLabel(language: string) {
  if (language === "AR") return "Arabic";
  if (language === "EN") return "English";
  return "Both";
}

export default function LearnPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCv(loadCv());
  }, []);

  const field: Field = cv ? detectField(cv) : "Tech";
  const cvSkills = (cv?.skills ?? []).map((skill) => skill.toLowerCase());

  let gapSkills: string[] = [];
  let noDataMode = false;

  if (!cv) {
    const counts: Record<string, number> = {};
    jobs.forEach((job) =>
      (job.skills ?? []).forEach((skill: string) => {
        const key = skill.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      })
    );
    gapSkills = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([skill]) => skill);
  } else if (hasJobData(field)) {
    const topSkills = getTopSkillsFromJobs(field);
    gapSkills = topSkills.filter((skill) => !cvSkills.includes(skill));
  } else {
    noDataMode = true;
    const fieldSkills = FIELD_SKILLS[field as NoDataField] ?? [];
    gapSkills = fieldSkills
      .filter((skill) => !cvSkills.includes(skill.toLowerCase()))
      .map((skill) => skill.toLowerCase());
  }

  const gapResources = resources.filter((resource) => gapSkills.includes(resource.skill.toLowerCase()));
  const otherResources = resources.filter((resource) => !gapSkills.includes(resource.skill.toLowerCase()));
  const allDisplayResources = cv ? [...gapResources, ...otherResources] : resources;

  const q = search.toLowerCase().trim();
  const displayResources = q
    ? allDisplayResources.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.skill.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q)
      )
    : allDisplayResources;
  const displayCerts = q
    ? certs.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        c.fields.some((f) => f.toLowerCase().includes(q)) ||
        c.description.toLowerCase().includes(q)
      )
    : certs;
  const totalHours = allDisplayResources.reduce((sum, resource) => sum + resource.hours, 0);

  const roadmapStats = [
    { label: "Skill targets", value: gapSkills.length || resources.length, icon: Target },
    { label: "Free courses", value: resources.filter((resource) => resource.free).length, icon: BookOpen },
    { label: "Programs", value: certs.length, icon: GraduationCap },
    { label: "Study hours", value: totalHours, icon: Timer },
  ];

  const fieldMessage = cv
    ? noDataMode
      ? `Detected ${field}. Showing general industry recommendations because the prototype job sample has limited coverage for this field.`
      : gapSkills.length > 0
      ? `${gapSkills.length} skill gap${gapSkills.length !== 1 ? "s" : ""} compared with the current ${field} job sample.`
      : `Your CV already covers the top ${field} skill signals in the current job sample.`
    : "Build or upload a CV to turn this into a personalized learning plan.";

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-one hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.40),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_370px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Route size={14} />
                  Learning roadmap
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Close the gap between your CV and the next role.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Hired.jo turns CV signals into a focused study plan: missing skills, free courses, and Jordan-accessible programs you can act on quickly.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/build" className="gold-grad text-black font-extrabold px-5 py-3 rounded-2xl inline-flex items-center gap-2">
                    Build CV <ArrowRight size={16} />
                  </Link>
                  <Link href="/jobs" className="glass text-white/75 hover:text-white font-bold px-5 py-3 rounded-2xl border border-white/10 inline-flex items-center gap-2">
                    Browse jobs <Compass size={16} />
                  </Link>
                </div>
              </div>

              <aside className="glass rounded-[26px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Roadmap mode</p>
                      <p className="font-display text-3xl font-extrabold gold-text-grad mt-1">{cv ? "Personal" : "Starter"}</p>
                      <p className="text-sm text-white/50">{cv ? field : "General skill map"}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center">
                      <Sparkles size={23} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Lightbulb size={16} className="text-yellow-200" />
                      Learning signal
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">{fieldMessage}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{resources.length}</div>
                      <div className="text-[11px] text-white/40">Courses</div>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="font-display font-bold text-lg">{certs.length}</div>
                      <div className="text-[11px] text-white/40">Programs</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roadmapStats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass rounded-[22px] p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/8 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl font-extrabold gold-text-grad">{value}</p>
                    <p className="font-bold text-white/80 mt-1">{label}</p>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-white/8 border border-white/10 text-yellow-100 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            <aside className="glass rounded-[28px] p-5 md:p-6 sticky top-6 overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-15" />
              <div className="relative space-y-5">
                {cv ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center font-display font-extrabold">
                        {cv.fullName?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/35">CV loaded</p>
                        <h2 className="font-display text-xl font-bold truncate">{cv.fullName || "Uploaded CV"}</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/55">{fieldMessage}</p>
                    <Link href="/score" className="mt-4 flex items-center justify-between rounded-2xl gold-grad px-5 py-4 text-black font-extrabold">
                      See score <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <div className="h-12 w-12 rounded-2xl gold-grad text-black flex items-center justify-center mb-4">
                      <FileText size={23} />
                    </div>
                    <h2 className="font-display text-2xl font-bold">No CV loaded</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      Start with a general roadmap now, or build a CV to reveal personalized gaps.
                    </p>
                    <Link href="/build" className="mt-4 flex items-center justify-between rounded-2xl gold-grad px-5 py-4 text-black font-extrabold">
                      Build CV <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-yellow-200" />
                    <h3 className="font-display text-xl font-bold">{noDataMode ? "Recommended skills" : "Skill targets"}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gapSkills.slice(0, 12).map((skill) => (
                      <span
                        key={skill}
                        className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                          noDataMode
                            ? "bg-purple-500/10 text-purple-200 border-purple-400/20"
                            : "bg-yellow-300/10 text-yellow-100 border-yellow-300/20"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {noDataMode && (
                    <p className="text-xs text-white/35 leading-relaxed mt-4">
                      These suggestions are general industry recommendations, not verified local job counts.
                    </p>
                  )}
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              {/* Search bar */}
              <label className="relative flex items-center">
                <Search size={17} className="absolute left-4 text-white/35 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses, skills, providers…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.045] border border-white/10 outline-none text-sm text-white placeholder:text-white/30 transition hover:border-white/20 focus:border-yellow-300/45"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 text-white/30 hover:text-white transition text-xs"
                  >
                    Clear
                  </button>
                )}
              </label>

              <section className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">Free courses</p>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-grad mt-1">Study the highest-impact gaps first.</h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/45">
                      {displayResources.length} resources
                    </span>
                  </div>

                  {displayResources.length === 0 && (
                    <p className="text-white/35 text-sm py-6 text-center">No courses match "{search}".</p>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {displayResources.map((resource) => {
                      const isGap = gapSkills.includes(resource.skill.toLowerCase());
                      return (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group/card rounded-[22px] border p-4 transition hover:-translate-y-1 ${
                            isGap
                              ? "border-yellow-300/28 bg-yellow-300/8"
                              : "border-white/10 bg-black/22 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isGap ? "gold-grad text-black" : "bg-white/8 text-white/50"}`}>
                              {resource.skill}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-white/35 shrink-0">
                              <Timer size={13} /> {resource.hours}h
                            </span>
                          </div>
                          <p className="mt-4 font-display text-lg font-bold leading-snug text-white/90 group-hover/card:text-yellow-100">
                            {normalizeText(resource.title)}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/42">
                            <span>{resource.provider} / {languageLabel(resource.language)}</span>
                            <span className="inline-flex items-center gap-1 text-green-300">
                              {resource.free ? <CheckCircle2 size={13} /> : null}
                              {resource.free ? "Free" : "Paid"}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-yellow-100 opacity-0 group-hover/card:opacity-100 transition">
                            Open resource <ExternalLink size={13} />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">Programs and certifications</p>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-grad mt-1">Local paths with stronger proof.</h2>
                    </div>
                    <Layers3 className="text-yellow-100/70 shrink-0" />
                  </div>

                  {displayCerts.length === 0 && (
                    <p className="text-white/35 text-sm py-6 text-center">No programs match "{search}".</p>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {displayCerts.map((cert) => (
                      <a
                        key={cert.id}
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/card rounded-[22px] border border-white/10 bg-black/22 p-4 transition hover:-translate-y-1 hover:border-yellow-300/25"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-200">
                            {cert.provider}
                          </span>
                          <span className={`text-xs shrink-0 ${cert.free ? "text-green-300" : "text-white/35"}`}>
                            {cert.free ? "Free" : "Paid"}
                          </span>
                        </div>
                        <p className="mt-4 font-display text-lg font-bold leading-snug text-white/90 group-hover/card:text-yellow-100">
                          {normalizeText(cert.name)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/48 line-clamp-2">
                          {normalizeText(cert.description)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {cert.fields.slice(0, 3).map((fieldName) => (
                            <span key={fieldName} className="rounded-lg bg-white/6 px-2 py-1 text-[11px] text-white/38">
                              {fieldName}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-yellow-100 opacity-0 group-hover/card:opacity-100 transition">
                          Open program <ExternalLink size={13} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
