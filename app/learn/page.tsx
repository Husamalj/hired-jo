"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Star,
  Target,
  Timer,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { CV } from "@/lib/types";
import rawResources from "@/data/learning-resources.json";
import rawCerts from "@/data/certifications-jo.json";
import rawJobs from "@/data/jobs.json";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Resource {
  id: string;
  skill: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  free: boolean;
  language: string;
  fromInternet?: boolean;
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

interface RatingInfo {
  avg: number;
  count: number;
  userRating: number | null;
}

// ─── Arabic → English dictionary ─────────────────────────────────────────────
const AR_EN: Record<string, string> = {
  بايثون: "python", جافا: "java", جافاسكريبت: "javascript",
  تايبسكريبت: "typescript", "سي شارب": "c#", "سي بلس بلس": "c++",
  روبي: "ruby", سويفت: "swift", كوتلن: "kotlin", غو: "go",
  راست: "rust", "بي اتش بي": "php",
  "ريأكت": "react", "ريآكت": "react", أنجولار: "angular", فيو: "vue",
  نود: "node", "نود جي إس": "nodejs", لارافيل: "laravel",
  فلاتر: "flutter", فلاسك: "flask", دجانغو: "django",
  سبرينج: "spring", نكست: "next.js", نيكست: "next.js",
  جيت: "git", دوكر: "docker", كوبيرنيتس: "kubernetes",
  "ديف أوبس": "devops", لينكس: "linux",
  "علم البيانات": "data science", "تحليل البيانات": "data analysis",
  "تحليل بيانات": "data analysis", "ذكاء اصطناعي": "artificial intelligence",
  "الذكاء الاصطناعي": "artificial intelligence",
  "تعلم الآلة": "machine learning", "تعلم عميق": "deep learning",
  "شبكات عصبية": "neural networks", "معالجة اللغة": "nlp",
  "تنقيب البيانات": "data mining", "قواعد البيانات": "database",
  "قاعدة البيانات": "database", سكيول: "sql", "ماي سكيول": "mysql",
  بوستجريس: "postgresql", منغو: "mongodb", ريديس: "redis",
  "فاير بيس": "firebase", "حوسبة سحابية": "cloud computing",
  سحابة: "cloud", "أمن المعلومات": "cybersecurity",
  "أمن سيبراني": "cybersecurity", "أمن إلكتروني": "cybersecurity",
  شبكات: "networking", "شبكات حاسوب": "computer networks",
  تصميم: "design", "تصميم جرافيك": "graphic design",
  "تصميم جرافيكي": "graphic design", "تصميم واجهات": "ui design",
  "تجربة مستخدم": "ux design", فوتوشوب: "photoshop",
  أدوبي: "adobe", إليستريتور: "illustrator", فيجما: "figma",
  كانفا: "canva", بريمير: "premiere pro", "أفتر إيفكتس": "after effects",
  "لايت روم": "lightroom", إنديزاين: "indesign",
  تصوير: "photography", مونتاج: "video editing",
  "تصميم هوية": "brand identity",
  تسويق: "marketing", "تسويق رقمي": "digital marketing",
  "التسويق الرقمي": "digital marketing", سيو: "seo",
  "تحسين محركات البحث": "seo", "إدارة وسائل التواصل": "social media management",
  "وسائل التواصل الاجتماعي": "social media",
  "كوبي رايتنغ": "copywriting", "كتابة إعلانية": "copywriting",
  "إعلانات جوجل": "google ads", "إعلانات ميتا": "meta ads",
  "جوجل أناليتيكس": "google analytics",
  تحليلات: "analytics", "هاب سبوت": "hubspot", "هب سبوت": "hubspot",
  "استراتيجية محتوى": "content strategy",
  "بريد إلكتروني": "email marketing", "تسويق بالبريد": "email marketing",
  إدارة: "management", "إدارة مشاريع": "project management",
  مشاريع: "project management", محاسبة: "accounting",
  مالية: "finance", تمويل: "finance", اقتصاد: "economics",
  "ريادة أعمال": "entrepreneurship", أعمال: "business",
  "موارد بشرية": "human resources",
  قانون: "law", قانوني: "legal", محاماة: "law",
  تعليم: "education", "تصميم المناهج": "curriculum design",
  تدريس: "teaching", تدريب: "training",
  هندسة: "engineering", أوتوكاد: "autocad",
  سوليدووركس: "solidworks", ريفيت: "revit",
  ماتلاب: "matlab", بيم: "bim",
  إكسل: "excel", وورد: "word", باوربوينت: "powerpoint",
  أوفيس: "microsoft office", "أوفيس 365": "microsoft 365",
  "لغة إنجليزية": "english language", إنجليزي: "english",
  "لغة عربية": "arabic", برمجة: "programming",
  "تطوير ويب": "web development", "تطوير تطبيقات": "mobile development",
  تطوير: "development", طب: "medicine", تمريض: "nursing",
  صيدلة: "pharmacy",
};

function translateArabic(text: string): string {
  const t = text.trim();
  if (AR_EN[t]) return AR_EN[t];
  let result = t;
  for (const [ar, en] of Object.entries(AR_EN)) {
    result = result.replace(new RegExp(ar, "g"), en);
  }
  return result;
}

function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

// ─── Data ─────────────────────────────────────────────────────────────────────
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
  Healthcare: ["doctor","physician","nurse","medical","health","clinical","hospital","pharmacy","pharmacist","dentist","surgeon","medicine","patient","radiology","laboratory","biomedical","therapist","nutrition","dietitian"],
  FinTech: ["finance","financial","banking","bank","accountant","accounting","fintech","investment","audit","tax","insurance","actuary","economics","economist","treasury","compliance","risk","cfa","cpa"],
  Transport: ["transport","logistics","supply chain","fleet","driver","shipping","warehouse","procurement","delivery","freight","customs"],
  Tech: ["software","developer","engineer","programming","frontend","backend","fullstack","devops","data scientist","machine learning","web developer","mobile developer","cybersecurity","network engineer","cloud","computer science","information technology","it support","ict"],
  "Creative & Design": ["photographer","photography","graphic design","designer","illustrator","videographer","video editor","animator","motion","ui designer","ux designer","art director","creative","visual","branding","adobe","photoshop","lightroom","premiere","after effects","figma","sketch"],
  "Marketing & Media": ["marketing","social media","content creator","copywriter","journalist","public relations","pr ","seo","digital marketing","advertising","media","communications","brand","influencer","campaign"],
  Legal: ["lawyer","attorney","legal","law","paralegal","judge","court","litigation","contract","compliance officer","llb","llm"],
  Education: ["teacher","professor","instructor","lecturer","tutor","trainer","curriculum","education","school","university faculty","teaching","e-learning","academic"],
  "Engineering (non-IT)": ["civil engineer","mechanical engineer","electrical engineer","structural","architecture","architect","construction","autocad","solidworks","manufacturing","industrial engineer","chemical engineer"],
  Other: [],
};

const FIELD_SKILLS: Partial<Record<NoDataField, string[]>> = {
  "Creative & Design": ["Adobe Photoshop","Adobe Lightroom","Adobe Premiere Pro","After Effects","Figma","Canva","Illustration","Brand Identity","Color Theory","Typography","Video Editing","Photography Composition"],
  "Marketing & Media": ["Google Analytics","Meta Ads","SEO","Content Strategy","Copywriting","Email Marketing","HubSpot","Social Media Management","Google Ads","A/B Testing","CRM Tools"],
  Legal: ["Legal Research","Contract Drafting","Legal Writing","Microsoft Word","Case Management","Negotiation","Compliance","Legal Tech Tools"],
  Education: ["Curriculum Design","Learning Management Systems","Public Speaking","Instructional Design","Google Classroom","Assessment Design","Microsoft Office","Presentation Skills"],
  "Engineering (non-IT)": ["AutoCAD","SolidWorks","MATLAB","Project Management","MS Project","Structural Analysis","BIM","Revit","Technical Drawing"],
  Other: [],
};

function detectField(cv: CV): Field {
  const haystack = [
    ...(cv.experience ?? []).map((e) => `${e.title} ${e.company}`),
    ...(cv.education ?? []).map((e) => `${e.degree} ${e.institution}`),
    ...(cv.skills ?? []),
    cv.summary ?? "",
  ].join(" ").toLowerCase();

  const scores: Record<Field, number> = {} as Record<Field, number>;
  for (const [field, kws] of Object.entries(FIELD_SIGNALS) as [Field, string[]][]) {
    scores[field] = kws.filter((k) => haystack.includes(k)).length;
  }
  const best = (Object.entries(scores) as [Field, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "Other";
}

function hasJobData(field: Field): field is DataSector {
  return ["Tech","Transport","FinTech","Healthcare"].includes(field);
}

function getTopSkillsFromJobs(sector: DataSector): string[] {
  const pool = jobs.filter((j) => j.sector === sector);
  const use = pool.length >= 3 ? pool : jobs;
  const counts: Record<string, number> = {};
  use.forEach((j) => (j.skills ?? []).forEach((s: string) => { const k = s.toLowerCase(); counts[k] = (counts[k] ?? 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([s]) => s);
}

function normalizeText(text: string) {
  return text.replaceAll("Ã¢â‚¬â€", "-").replaceAll("Ã¢â‚¬â€œ", "-").replaceAll("Ã‚Â·", "/").replaceAll("Ã¢â€ â€™", "->");
}

function langLabel(l: string) {
  return l === "AR" ? "Arabic" : l === "EN" ? "English" : "Both";
}

function courseKey(r: Resource): string {
  return r.fromInternet ? r.url : r.id;
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({
  courseId, info, authToken, onRated,
}: {
  courseId: string;
  info: RatingInfo | undefined;
  authToken: string | null;
  onRated: (id: string, rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  const avg = info?.avg ?? 0;
  const count = info?.count ?? 0;
  const userRating = info?.userRating ?? 0;
  const display = hovered || userRating || 0;

  async function handleClick(star: number) {
    if (!authToken || saving) return;
    setSaving(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authToken },
        body: JSON.stringify({ courseId, rating: star }),
      });
      onRated(courseId, star);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = display ? display >= star : avg >= star - 0.5;
          return (
            <button
              key={star}
              disabled={!authToken || saving}
              onClick={() => handleClick(star)}
              onMouseEnter={() => authToken && setHovered(star)}
              className={`transition-transform ${authToken ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
            >
              <Star size={13} className={filled ? "text-yellow-300 fill-yellow-300" : "text-white/20"} />
            </button>
          );
        })}
      </div>
      <span className="text-[11px] text-white/35">
        {count > 0 ? `${avg.toFixed(1)} (${count})` : authToken ? "Be first to rate" : "Sign in to rate"}
      </span>
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────
function CourseCard({
  resource, isGap, ratingKey, ratingInfo, authToken, onRated,
}: {
  resource: Resource;
  isGap: boolean;
  ratingKey: string;
  ratingInfo: RatingInfo | undefined;
  authToken: string | null;
  onRated: (id: string, rating: number) => void;
}) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/card rounded-[22px] border p-4 transition hover:-translate-y-1 block ${
        isGap ? "border-yellow-300/28 bg-yellow-300/8" : "border-white/10 bg-black/22 hover:border-white/20"
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
        <span>{resource.provider} / {langLabel(resource.language)}</span>
        <span className={`inline-flex items-center gap-1 ${resource.free ? "text-green-300" : "text-orange-300/70"}`}>
          {resource.free && <CheckCircle2 size={13} />}
          {resource.free ? "Free" : "Paid"}
        </span>
      </div>
      <StarRating courseId={ratingKey} info={ratingInfo} authToken={authToken} onRated={onRated} />
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-yellow-100 opacity-0 group-hover/card:opacity-100 transition">
        Open resource <ExternalLink size={13} />
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [search, setSearch] = useState("");
  const [onlineCourses, setOnlineCourses] = useState<Resource[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Map<string, RatingInfo>>(new Map());

  useEffect(() => {
    setCv(loadCv());
    createSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setAuthToken(`Bearer ${session.access_token}`);
    });
  }, []);

  const field: Field = cv ? detectField(cv) : "Tech";
  const cvSkills = (cv?.skills ?? []).map((s) => s.toLowerCase());

  let gapSkills: string[] = [];
  let noDataMode = false;

  if (!cv) {
    const counts: Record<string, number> = {};
    jobs.forEach((j) => (j.skills ?? []).forEach((s: string) => { const k = s.toLowerCase(); counts[k] = (counts[k] ?? 0) + 1; }));
    gapSkills = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s]) => s);
  } else if (hasJobData(field)) {
    gapSkills = getTopSkillsFromJobs(field).filter((s) => !cvSkills.includes(s));
  } else {
    noDataMode = true;
    gapSkills = (FIELD_SKILLS[field as NoDataField] ?? []).filter((s) => !cvSkills.includes(s.toLowerCase())).map((s) => s.toLowerCase());
  }

  const gapRes = resources.filter((r) => gapSkills.includes(r.skill.toLowerCase()));
  const otherRes = resources.filter((r) => !gapSkills.includes(r.skill.toLowerCase()));
  const allDisplay = cv ? [...gapRes, ...otherRes] : resources;

  // Query translation
  const rawQ = search.toLowerCase().trim();
  const q = isArabic(rawQ) ? translateArabic(rawQ).toLowerCase().trim() : rawQ;
  const apiQ = isArabic(search.trim()) ? translateArabic(search.trim()) : search.trim();

  const localResources = q
    ? allDisplay.filter((r) => r.title.toLowerCase().includes(q) || r.skill.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q))
    : allDisplay;

  const displayCerts = q
    ? certs.filter((c) => c.name.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.fields.some((f) => f.toLowerCase().includes(q)) || c.description.toLowerCase().includes(q))
    : certs;

  const merged: Resource[] = q
    ? [...localResources, ...onlineCourses.filter((o) => !localResources.some((l) => l.title.toLowerCase() === o.title.toLowerCase()))]
    : allDisplay;

  const freeCourses = merged.filter((r) => r.free);
  const paidCourses = merged.filter((r) => !r.free);

  // Fetch online courses
  useEffect(() => {
    if (!rawQ) { setOnlineCourses([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const need = Math.max(0, 10 - localResources.length);
      if (need === 0) { setOnlineCourses([]); return; }
      setOnlineLoading(true);
      setOnlineCourses([]);
      try {
        const res = await fetch(`/api/search-courses?q=${encodeURIComponent(apiQ)}&need=${need}`);
        const data = await res.json();
        if (Array.isArray(data)) setOnlineCourses(data);
      } catch { /* silent */ }
      finally { setOnlineLoading(false); }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawQ]);

  // Fetch ratings
  useEffect(() => {
    const all = [...freeCourses, ...paidCourses];
    if (all.length === 0) return;
    const ids = all.map(courseKey).join(",");
    const headers: HeadersInit = {};
    if (authToken) headers["Authorization"] = authToken;
    fetch(`/api/ratings?ids=${encodeURIComponent(ids)}`, { headers })
      .then((r) => r.json())
      .then((data: Record<string, RatingInfo>) => {
        setRatings((prev) => {
          const next = new Map(prev);
          for (const [id, info] of Object.entries(data)) next.set(id, info);
          return next;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeCourses.length + paidCourses.length, authToken]);

  const handleRated = useCallback((courseId: string, rating: number) => {
    setRatings((prev) => {
      const next = new Map(prev);
      const existing = next.get(courseId) ?? { avg: 0, count: 0, userRating: null };
      const wasRated = existing.userRating !== null;
      const oldTotal = existing.avg * existing.count;
      const newCount = wasRated ? existing.count : existing.count + 1;
      const newTotal = wasRated ? oldTotal - (existing.userRating ?? 0) + rating : oldTotal + rating;
      next.set(courseId, { avg: Math.round((newTotal / newCount) * 10) / 10, count: newCount, userRating: rating });
      return next;
    });
  }, []);

  const totalHours = allDisplay.reduce((s, r) => s + r.hours, 0);
  const roadmapStats = [
    { label: "Skill targets", value: gapSkills.length || resources.length, icon: Target },
    { label: "Free courses", value: resources.filter((r) => r.free).length, icon: BookOpen },
    { label: "Programs", value: certs.length, icon: GraduationCap },
    { label: "Study hours", value: totalHours, icon: Timer },
  ];

  const fieldMessage = cv
    ? noDataMode
      ? `Detected ${field}. Showing general industry recommendations.`
      : gapSkills.length > 0
      ? `${gapSkills.length} skill gap${gapSkills.length !== 1 ? "s" : ""} vs the current ${field} job sample.`
      : `Your CV already covers the top ${field} skill signals.`
    : "Build or upload a CV to turn this into a personalized learning plan.";

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden px-5 md:px-8 py-8">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="paper-bg paper-bg-one hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-7">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-6 md:p-8 lg:p-10">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,46,.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(91,63,200,.40),transparent_42%)]" />
            <div className="relative grid lg:grid-cols-[1fr_370px] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-yellow-200 mb-5">
                  <Route size={14} /> Learning roadmap
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-grad leading-tight max-w-4xl">
                  Close the gap between your CV and the next role.
                </h1>
                <p className="mt-5 text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
                  Hired.jo turns CV signals into a focused study plan: missing skills, free & paid courses, and Jordan-accessible programs.
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
                      <Lightbulb size={16} className="text-yellow-200" /> Learning signal
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

          {/* Stats */}
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

          {/* Main grid */}
          <section className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            {/* Sidebar */}
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
                      <span key={skill} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${noDataMode ? "bg-purple-500/10 text-purple-200 border-purple-400/20" : "bg-yellow-300/10 text-yellow-100 border-yellow-300/20"}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  {noDataMode && (
                    <p className="text-xs text-white/35 leading-relaxed mt-4">
                      General industry recommendations, not verified local job counts.
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* Course list */}
            <div className="space-y-5">
              {/* Search bar */}
              <label className="relative flex items-center">
                <Search size={17} className="absolute left-4 text-white/35 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses… اكتب بالعربي أو الإنجليزي"
                  dir="auto"
                  className="w-full pl-11 pr-16 py-3.5 rounded-2xl bg-white/[0.045] border border-white/10 outline-none text-sm text-white placeholder:text-white/30 transition hover:border-white/20 focus:border-yellow-300/45"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-4 text-white/30 hover:text-white transition text-xs">
                    Clear
                  </button>
                )}
              </label>
              {isArabic(search) && q !== rawQ && (
                <p className="text-xs text-white/35 -mt-2 pl-1">
                  Searching for: <span className="text-yellow-200/70">{q}</span>
                </p>
              )}

              <section className="glass rounded-[28px] p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-yellow-200/80">Courses</p>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-grad mt-1">
                        Study the highest-impact gaps first.
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/45 shrink-0">
                      {freeCourses.length + paidCourses.length} courses
                    </span>
                  </div>

                  {onlineLoading && (
                    <div className="flex items-center gap-2 text-sm text-white/40 py-3 animate-pulse">
                      <Sparkles size={15} className="text-yellow-300" />
                      Searching YouTube, Udemy &amp; Coursera for "{apiQ}"…
                    </div>
                  )}

                  {!onlineLoading && freeCourses.length === 0 && paidCourses.length === 0 && rawQ && (
                    <p className="text-white/35 text-sm py-4 text-center">No courses found for "{search}".</p>
                  )}

                  {/* Free courses */}
                  {freeCourses.length > 0 && (
                    <>
                      <p className="text-[11px] uppercase tracking-widest text-green-400/60 mb-3">
                        Free · {freeCourses.length}
                      </p>
                      <div className="grid md:grid-cols-2 gap-3 mb-6">
                        {freeCourses.map((r) => (
                          <CourseCard
                            key={courseKey(r)}
                            resource={r}
                            isGap={gapSkills.includes(r.skill.toLowerCase())}
                            ratingKey={courseKey(r)}
                            ratingInfo={ratings.get(courseKey(r))}
                            authToken={authToken}
                            onRated={handleRated}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Paid courses */}
                  {paidCourses.length > 0 && (
                    <>
                      <p className="text-[11px] uppercase tracking-widest text-orange-300/50 mb-3">
                        Paid · {paidCourses.length}
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {paidCourses.map((r) => (
                          <CourseCard
                            key={courseKey(r)}
                            resource={r}
                            isGap={gapSkills.includes(r.skill.toLowerCase())}
                            ratingKey={courseKey(r)}
                            ratingInfo={ratings.get(courseKey(r))}
                            authToken={authToken}
                            onRated={handleRated}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Certifications */}
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
                  {displayCerts.length === 0 && rawQ && (
                    <p className="text-white/35 text-sm py-4 text-center">No programs match "{search}".</p>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {displayCerts.map((cert) => (
                      <a key={cert.id} href={cert.url} target="_blank" rel="noopener noreferrer"
                        className="group/card rounded-[22px] border border-white/10 bg-black/22 p-4 transition hover:-translate-y-1 hover:border-yellow-300/25">
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-200">{cert.provider}</span>
                          <span className={`text-xs shrink-0 ${cert.free ? "text-green-300" : "text-orange-300/70"}`}>{cert.free ? "Free" : "Paid"}</span>
                        </div>
                        <p className="mt-4 font-display text-lg font-bold leading-snug text-white/90 group-hover/card:text-yellow-100">
                          {normalizeText(cert.name)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/48 line-clamp-2">{normalizeText(cert.description)}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {cert.fields.slice(0, 3).map((f) => (
                            <span key={f} className="rounded-lg bg-white/6 px-2 py-1 text-[11px] text-white/38">{f}</span>
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
