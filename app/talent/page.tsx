"use client";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Search, MapPin, GraduationCap, Mail, Globe,
  Upload, Trash2, ChevronDown, ChevronUp, Briefcase, Star,
  FileText, Send, ExternalLink, User, Link2, GitFork, Camera, Image, X
} from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import Link from "next/link";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Belize","Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria",
  "Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala",
  "Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan",
  "Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Malaysia","Mexico","Moldova","Morocco","Myanmar",
  "Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda",
  "Saudi Arabia","Serbia","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey","Turkmenistan",
  "UAE","Uganda","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const YEARS = ["2026","2025","2024","2023","2022","2021","2020","2019","2018","2017"];

interface Post {
  id: string;
  text: string;
  created_at: string;
  media_url?: string;
  media_type?: "image" | "video";
}

interface TalentProfile {
  id?: number;
  user_id: string;
  alias: string;
  email: string;
  field: string;
  graduation_year: number | null;
  years_experience: number;
  city: string;
  country: string;
  skills: string[];
  bio: string;
  is_visible: boolean;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
  cv_url?: string;
  posts?: Post[];
}

const EMPTY_FORM = {
  alias: "", email: "", field: "", graduation_year: "", years_experience: "0",
  city: "", country: "", skills: "", bio: "",
  linkedin_url: "", github_url: "", portfolio_url: "",
};

function Avatar({ name, avatarUrl, size = 48 }: { name: string; avatarUrl?: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#3F2B96","#7C3AED","#0369A1","#065F46","#9A3412","#1D4ED8"];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff" }}>
      {initials || <User size={size * 0.5} />}
    </div>
  );
}

function ProfileCard({ p, onExpand, expanded }: { p: TalentProfile; onExpand: () => void; expanded: boolean }) {
  const posts = p.posts ?? [];
  return (
    <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar name={p.alias || "?"} avatarUrl={p.avatar_url} size={46} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{p.alias}</p>
            <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
              <GraduationCap size={11} />
              {p.field || "Graduate"}{p.graduation_year ? ` · ${p.graduation_year}` : ""}
            </p>
            <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {[p.city, p.country].filter(Boolean).join(", ") || "Location not set"}
            </p>
          </div>
          <span className="text-xs rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/40 shrink-0">
            {p.years_experience} yr{p.years_experience === 1 ? "" : "s"}
          </span>
        </div>

        {p.bio && <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{p.bio}</p>}

        <div className="flex flex-wrap gap-1">
          {p.skills?.slice(0, 5).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/55">{s}</span>
          ))}
          {(p.skills?.length ?? 0) > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/35">+{p.skills.length - 5} more</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {p.linkedin_url && (
              <a href={p.linkedin_url.startsWith("http") ? p.linkedin_url : `https://${p.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-blue-400 transition">
                <Link2 size={15} />
              </a>
            )}
            {p.github_url && (
              <a href={p.github_url.startsWith("http") ? p.github_url : `https://${p.github_url}`} target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-white transition">
                <GitFork size={15} />
              </a>
            )}
            {p.portfolio_url && (
              <a href={p.portfolio_url.startsWith("http") ? p.portfolio_url : `https://${p.portfolio_url}`} target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-yellow-300 transition">
                <Globe size={15} />
              </a>
            )}
            <a href={`mailto:${p.email}`} className="text-xs text-yellow-200/70 hover:text-yellow-200 flex items-center gap-1 transition">
              <Mail size={12} /> Contact
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/talent/${p.user_id}`}
              className="text-xs rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-white/60 hover:text-white hover:border-white/30 transition font-medium">
              View Profile
            </Link>
            <button onClick={onExpand} className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {posts.length > 0 ? `${posts.length} post${posts.length !== 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/8 px-5 py-4 space-y-4">
          {p.bio && (
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">About</p>
              <p className="text-sm text-white/65 leading-relaxed">{p.bio}</p>
            </div>
          )}
          {(p.skills?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-black/30 border border-white/10 text-white/60">{s}</span>
                ))}
              </div>
            </div>
          )}
          {posts.length > 0 && (
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Recent Posts</p>
              <div className="space-y-3">
                {posts.slice(0, 2).map(post => (
                  <div key={post.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    {post.text && <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{post.text}</p>}
                    {post.media_url && (
                      post.media_type === "video"
                        ? <video src={post.media_url} controls className="w-full rounded-lg mt-2 max-h-48 bg-black" />
                        : <img src={post.media_url} alt="" className="w-full rounded-lg mt-2 max-h-48 object-cover" />
                    )}
                  </div>
                ))}
                {posts.length > 2 && (
                  <Link href={`/talent/${p.user_id}`} className="text-xs text-yellow-200/60 hover:text-yellow-200">
                    See all {posts.length} posts →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TalentPage() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "my-profile">("browse");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [fieldFilter, setFieldFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [skillSearch, setSkillSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [existingProfile, setExistingProfile] = useState<TalentProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postMedia, setPostMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [uploadingPostMedia, setUploadingPostMedia] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const postMediaRef = useRef<HTMLInputElement>(null);
  const sb = createSupabaseBrowserClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/talent?userId=${user.id}`)
      .then(r => r.json())
      .then((profile: TalentProfile | null) => {
        if (profile) {
          setExistingProfile(profile);
          setAvatarUrl(profile.avatar_url ?? null);
          setCvUrl((profile as any).cv_url ?? null);
          setForm({
            alias: profile.alias ?? "",
            email: profile.email ?? "",
            field: profile.field ?? "",
            graduation_year: profile.graduation_year?.toString() ?? "",
            years_experience: profile.years_experience?.toString() ?? "0",
            city: profile.city ?? "",
            country: profile.country ?? "",
            skills: profile.skills?.join(", ") ?? "",
            bio: profile.bio ?? "",
            linkedin_url: profile.linkedin_url ?? "",
            github_url: profile.github_url ?? "",
            portfolio_url: profile.portfolio_url ?? "",
          });
          setCountryInput(profile.country ?? "");
          setPosts(profile.posts ?? []);
        } else {
          setForm(f => ({ ...f, email: user.email ?? "" }));
        }
      }).catch(console.error);
  }, [user]);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    const res = await fetch("/api/talent");
    const data = await res.json();
    setProfiles(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await sb.storage.from("talent-media").upload(path, file, { upsert: true });
    if (error) { alert("Upload failed"); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = sb.storage.from("talent-media").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    if (avatarRef.current) avatarRef.current.value = "";
  }

  async function handlePostMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPostMedia(true);
    const ext = file.name.split(".").pop();
    const isVideo = file.type.startsWith("video/");
    const path = `posts/${user.id}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("talent-media").upload(path, file, { upsert: false });
    if (error) { alert("Upload failed"); setUploadingPostMedia(false); return; }
    const { data: { publicUrl } } = sb.storage.from("talent-media").getPublicUrl(path);
    setPostMedia({ url: publicUrl, type: isVideo ? "video" : "image" });
    setUploadingPostMedia(false);
    if (postMediaRef.current) postMediaRef.current.value = "";
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCv(true);
    try {
      // Upload the raw file to storage so it can be shown on the profile
      const ext = file.name.split(".").pop();
      const cvPath = `cvs/${user.id}.${ext}`;
      const { error: storageErr } = await sb.storage.from("talent-media").upload(cvPath, file, { upsert: true });
      if (!storageErr) {
        const { data: { publicUrl } } = sb.storage.from("talent-media").getPublicUrl(cvPath);
        setCvUrl(publicUrl);
      }

      // Parse fields for auto-fill
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-cv", { method: "POST", body: formData });
      const result = await res.json();
      const cv = result.cv;
      if (!cv) throw new Error("No CV parsed");
      const loc = (cv.location ?? "").split(",").map((s: string) => s.trim());
      const city = loc[0] ?? "";
      const country = loc[1] ?? "";
      const edu = cv.education?.[0];
      const skills = [
        ...(cv.skills ?? []),
        ...(cv.skillCategories?.flatMap((c: any) => c.items) ?? []),
      ].filter((s, i, a) => a.indexOf(s) === i).join(", ");
      const linkedinLink = cv.links?.find((l: any) => l.label?.toLowerCase().includes("linkedin"))?.url ?? "";
      const githubLink = cv.links?.find((l: any) => l.label?.toLowerCase().includes("github"))?.url ?? "";
      const portfolioLink = cv.links?.find((l: any) => !l.label?.toLowerCase().includes("linkedin") && !l.label?.toLowerCase().includes("github"))?.url ?? "";
      setForm(f => ({
        ...f,
        alias: cv.fullName ?? f.alias,
        email: cv.email ?? f.email,
        field: edu?.degree || f.field,
        graduation_year: edu?.endYear?.toString() || f.graduation_year,
        years_experience: (cv.experience?.length > 0 ? cv.experience.length : parseInt(f.years_experience || "0")).toString(),
        city: city || f.city,
        country: country || f.country,
        skills: skills || f.skills,
        bio: cv.summary ?? f.bio,
        linkedin_url: linkedinLink || f.linkedin_url,
        github_url: githubLink || f.github_url,
        portfolio_url: portfolioLink || f.portfolio_url,
      }));
      setCountryInput(country || countryInput);
    } catch (err) {
      alert("Could not parse CV. Try a PDF or Word file.");
    }
    setUploadingCv(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);
    const profile = {
      user_id: user.id,
      alias: form.alias,
      email: form.email,
      field: form.field,
      graduation_year: parseInt(form.graduation_year) || null,
      years_experience: parseInt(form.years_experience) || 0,
      city: form.city,
      country: countryInput || form.country,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      bio: form.bio,
      is_visible: true,
      linkedin_url: form.linkedin_url,
      github_url: form.github_url,
      portfolio_url: form.portfolio_url,
      avatar_url: avatarUrl,
      cv_url: cvUrl,
      posts,
    };
    const res = await fetch("/api/talent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", profile }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Profile saved!");
      setExistingProfile(profile as any);
      fetchProfiles();
    } else {
      setSaveMsg("Save failed — please try again.");
    }
  }

  function addPost() {
    if (!newPost.trim() && !postMedia) return;
    const post: Post = {
      id: Date.now().toString(),
      text: newPost.trim(),
      created_at: new Date().toISOString(),
      media_url: postMedia?.url,
      media_type: postMedia?.type,
    };
    setPosts(prev => [post, ...prev]);
    setNewPost("");
    setPostMedia(null);
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  const countrySuggestions = countryInput
    ? COUNTRIES.filter(c => c.toLowerCase().includes(countryInput.toLowerCase())).slice(0, 6)
    : [];

  const filtered = profiles.filter(p => {
    if (fieldFilter && !p.field?.toLowerCase().includes(fieldFilter.toLowerCase())) return false;
    if (countryFilter && !p.country?.toLowerCase().includes(countryFilter.toLowerCase())) return false;
    if (yearFilter !== "All" && p.graduation_year?.toString() !== yearFilter) return false;
    if (skillSearch && !p.skills?.some(s => s.toLowerCase().includes(skillSearch.toLowerCase()))) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen px-4 py-20">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative mx-auto max-w-6xl">

          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl font-extrabold gold-text-grad mb-3">Talent Marketplace</h1>
            <p className="text-white/50 max-w-xl mx-auto">Graduates list themselves. Companies find them. Free for everyone.</p>
          </div>

          <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
            <button onClick={() => setTab("browse")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "browse" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}>
              Browse Talent
            </button>
            <button onClick={() => setTab("my-profile")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "my-profile" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}>
              {existingProfile ? "Edit My Profile" : user ? "Create Profile" : "List Yourself"}
            </button>
          </div>

          {/* ── BROWSE ── */}
          {tab === "browse" && (
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={fieldFilter} onChange={e => setFieldFilter(e.target.value)} placeholder="Field of study…"
                    className="rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-yellow-300/40 w-44" />
                </div>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={countryFilter} onChange={e => setCountryFilter(e.target.value)} placeholder="Country…"
                    className="rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-yellow-300/40 w-36" />
                </div>
                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-yellow-300/40">
                  <option value="All" className="bg-[#0A0716]">All years</option>
                  {YEARS.map(y => <option key={y} value={y} className="bg-[#0A0716]">{y}</option>)}
                </select>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Filter by skill…"
                    className="rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                </div>
              </div>
              <p className="text-white/30 text-xs mb-4">{filtered.length} talent profile{filtered.length !== 1 ? "s" : ""} found</p>
              {loading ? (
                <p className="text-white/30 text-center py-20">Loading talent pool…</p>
              ) : filtered.length === 0 ? (
                <p className="text-white/30 text-center py-20">No profiles match these filters yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(p => (
                    <ProfileCard key={p.id} p={p}
                      expanded={expandedId === p.id}
                      onExpand={() => setExpandedId(expandedId === p.id ? null : p.id!)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY PROFILE ── */}
          {tab === "my-profile" && (
            <div className="max-w-2xl mx-auto">
              {!user ? (
                <div className="text-center py-20 space-y-4">
                  <p className="text-white/50">Sign in to create your talent profile.</p>
                  <a href="/auth/login" className="inline-block rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black">Sign in</a>
                </div>
              ) : (
                <form onSubmit={saveProfile} className="space-y-6">

                  {/* Avatar */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 flex items-center gap-5">
                    <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                          <User size={28} className="text-white/25" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        {uploadingAvatar ? <span className="text-xs text-white">…</span> : <Camera size={18} className="text-white" />}
                      </div>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Profile Photo</p>
                      <p className="text-xs text-white/40 mt-0.5">Click to upload. Shows on your public profile.</p>
                      <button type="button" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}
                        className="mt-2 text-xs text-yellow-200/70 hover:text-yellow-200 transition">
                        {uploadingAvatar ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
                      </button>
                    </div>
                  </div>

                  {/* CV Upload */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><FileText size={15} className="text-yellow-300" /> Auto-fill from CV</p>
                    <p className="text-xs text-white/40 mb-3">Upload your CV (PDF or Word) to fill in your profile automatically.</p>
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" onChange={handleCvUpload} className="hidden" />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingCv}
                      className="inline-flex items-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-300/20 transition disabled:opacity-50">
                      <Upload size={14} /> {uploadingCv ? "Parsing CV…" : "Upload CV to auto-fill"}
                    </button>
                  </div>

                  {/* Basic info */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-4">
                    <h2 className="font-semibold text-white text-sm flex items-center gap-2"><User size={15} className="text-yellow-300" /> Basic Info</h2>
                    {([
                      ["Display name", "alias", "text", "Your full name or alias"],
                      ["Contact email", "email", "email", "Shown to companies when they click Contact"],
                      ["City", "city", "text", "e.g. Amman"],
                    ] as const).map(([label, key, type, placeholder]) => (
                      <div key={key}>
                        <label className="block text-xs text-white/40 mb-1">{label}</label>
                        <input type={type} placeholder={placeholder} value={form[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                      </div>
                    ))}
                    <div className="relative">
                      <label className="block text-xs text-white/40 mb-1">Country</label>
                      <input type="text" placeholder="Type your country…" value={countryInput}
                        onChange={e => { setCountryInput(e.target.value); setShowCountrySuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 150)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                      {showCountrySuggestions && countrySuggestions.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#0A0716] shadow-xl overflow-hidden">
                          {countrySuggestions.map(c => (
                            <button key={c} type="button" onMouseDown={() => { setCountryInput(c); setShowCountrySuggestions(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">{c}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Bio</label>
                      <textarea placeholder="Tell companies about yourself…" value={form.bio} rows={3}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40 resize-none" />
                    </div>
                  </div>

                  {/* Education */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-4">
                    <h2 className="font-semibold text-white text-sm flex items-center gap-2"><GraduationCap size={15} className="text-yellow-300" /> Education</h2>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Field of study</label>
                      <input type="text" placeholder="e.g. Computer Engineering, Business, Medicine…" value={form.field}
                        onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Graduation year</label>
                        <input type="number" placeholder="e.g. 2026" min="2010" max="2030" value={form.graduation_year}
                          onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Years of experience</label>
                        <input type="number" placeholder="0" min="0" max="30" value={form.years_experience}
                          onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                    <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-3"><Star size={15} className="text-yellow-300" /> Skills</h2>
                    <input type="text" placeholder="React, Python, SQL, Figma…" value={form.skills}
                      onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                    {form.skills && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {form.skills.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-black/30 border border-white/10 text-white/60">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-4">
                    <h2 className="font-semibold text-white text-sm flex items-center gap-2"><ExternalLink size={15} className="text-yellow-300" /> Links</h2>
                    {([
                      ["LinkedIn URL", "linkedin_url", "https://linkedin.com/in/yourname"],
                      ["GitHub URL", "github_url", "https://github.com/yourname"],
                      ["Portfolio / Website", "portfolio_url", "https://yourname.com"],
                    ] as const).map(([label, key, placeholder]) => (
                      <div key={key}>
                        <label className="block text-xs text-white/40 mb-1">{label}</label>
                        <input type="url" placeholder={placeholder} value={form[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40" />
                      </div>
                    ))}
                  </div>

                  {/* Posts */}
                  <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-4">
                    <h2 className="font-semibold text-white text-sm flex items-center gap-2"><Briefcase size={15} className="text-yellow-300" /> Posts & Updates</h2>
                    <div className="space-y-2">
                      <textarea placeholder="Share an achievement, project update…" value={newPost} rows={2}
                        onChange={e => setNewPost(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40 resize-none" />
                      {/* Media preview */}
                      {postMedia && (
                        <div className="relative inline-block">
                          {postMedia.type === "video"
                            ? <video src={postMedia.url} className="rounded-xl max-h-40 bg-black" controls />
                            : <img src={postMedia.url} alt="" className="rounded-xl max-h-40 object-cover" />}
                          <button type="button" onClick={() => setPostMedia(null)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input ref={postMediaRef} type="file" accept="image/*,video/*" className="hidden" onChange={handlePostMediaUpload} />
                        <button type="button" onClick={() => postMediaRef.current?.click()} disabled={uploadingPostMedia}
                          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 rounded-xl px-3 py-2 transition disabled:opacity-40">
                          <Image size={13} /> {uploadingPostMedia ? "Uploading…" : "Add photo/video"}
                        </button>
                        <button type="button" onClick={addPost} disabled={!newPost.trim() && !postMedia}
                          className="inline-flex items-center gap-1.5 rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black disabled:opacity-40">
                          <Send size={13} /> Post
                        </button>
                      </div>
                    </div>
                    {posts.length > 0 && (
                      <div className="space-y-2">
                        {posts.map(post => (
                          <div key={post.id} className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 space-y-2">
                            {post.text && <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{post.text}</p>}
                            {post.media_url && (
                              post.media_type === "video"
                                ? <video src={post.media_url} controls className="w-full rounded-lg max-h-48 bg-black" />
                                : <img src={post.media_url} alt="" className="w-full rounded-lg max-h-48 object-cover" />
                            )}
                            <button type="button" onClick={() => deletePost(post.id)} className="text-white/20 hover:text-red-400 transition text-xs flex items-center gap-1">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {saveMsg && (
                    <p className={`text-sm ${saveMsg.includes("failed") ? "text-red-400" : "text-yellow-200/80"}`}>{saveMsg}</p>
                  )}

                  <button type="submit" disabled={saving}
                    className="w-full rounded-xl gold-grad py-3 text-sm font-extrabold text-black disabled:opacity-50">
                    {saving ? "Saving…" : existingProfile ? "Update Profile" : "Save & Go Live"}
                  </button>

                  {existingProfile && (
                    <Link href={`/talent/${user.id}`}
                      className="block text-center text-xs text-yellow-200/60 hover:text-yellow-200 transition">
                      View your public profile →
                    </Link>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
