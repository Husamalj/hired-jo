"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Search, UserCheck, MapPin, GraduationCap, Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const FIELDS = ["All", "Computer Science", "Engineering", "Business", "Design", "Marketing", "Finance", "Healthcare", "Education", "Law", "Other"];
const COUNTRIES = ["All", "Jordan", "UAE", "Saudi Arabia", "Egypt"];
const YEARS = ["All", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const EXPERIENCES = ["All", "0", "1", "2", "3", "4", "5"];

interface TalentProfile {
  id: number;
  user_id: string;
  alias: string;
  email: string;
  field: string;
  graduation_year: number;
  years_experience: number;
  city: string;
  country: string;
  skills: string[];
  bio: string;
  is_visible: boolean;
}

export default function TalentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "my-profile">("browse");

  const [field, setField] = useState("All");
  const [country, setCountry] = useState("All");
  const [year, setYear] = useState("All");
  const [experience, setExperience] = useState("All");
  const [skillSearch, setSkillSearch] = useState("");

  const [form, setForm] = useState({ alias: "", email: "", field: "", graduation_year: "", years_experience: "", city: "", country: "Jordan", skills: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const sb = createSupabaseBrowserClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [field, country, year, experience]);

  async function fetchProfiles() {
    setLoading(true);
    const params = new URLSearchParams();
    if (field !== "All") params.set("field", field);
    if (country !== "All") params.set("country", country);
    if (year !== "All") params.set("year", year);
    if (experience !== "All") params.set("experience", experience);
    const res = await fetch(`/api/talent?${params}`);
    const data = await res.json();
    setProfiles(Array.isArray(data) ? data : []);
    setLoading(false);
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
      country: form.country,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: form.bio,
      is_visible: true,
    };
    const res = await fetch("/api/talent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", profile }),
    });
    setSaving(false);
    if (res.ok) setSaveMsg("Profile saved! You are now visible to companies.");
    else setSaveMsg("Save failed — please try again.");
  }

  const filtered = profiles.filter((p) =>
    !skillSearch || p.skills?.some((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen px-4 py-20">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative mx-auto max-w-6xl">

          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl font-extrabold gold-text-grad mb-3">Talent Marketplace</h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Graduates list themselves. Companies find them. Free for everyone.
            </p>
          </div>

          <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
            <button
              onClick={() => setTab("browse")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "browse" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}
            >
              Browse Talent
            </button>
            <button
              onClick={() => setTab("my-profile")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "my-profile" ? "gold-grad text-black" : "text-white/50 hover:text-white"}`}
            >
              {user ? "My Profile" : "List Yourself"}
            </button>
          </div>

          {tab === "browse" && (
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {([["Field", FIELDS, field, setField], ["Country", COUNTRIES, country, setCountry], ["Grad Year", YEARS, year, setYear], ["Experience", EXPERIENCES, experience, setExperience]] as const).map(([label, opts, val, setter]) => (
                  <select
                    key={label}
                    value={val}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-yellow-300/40"
                  >
                    {(opts as readonly string[]).map((o) => <option key={o} value={o} className="bg-[#0A0716]">{o}</option>)}
                  </select>
                ))}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Filter by skill…"
                    className="rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-white/30 text-center py-20">Loading talent pool…</p>
              ) : filtered.length === 0 ? (
                <p className="text-white/30 text-center py-20">No profiles match these filters yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <div key={p.id} className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{p.alias}</p>
                          <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                            <GraduationCap size={12} /> {p.field} · {p.graduation_year}
                          </p>
                        </div>
                        <span className="text-xs rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/40">
                          {p.years_experience} yr{p.years_experience === 1 ? "" : "s"} exp
                        </span>
                      </div>
                      {p.city && (
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <MapPin size={11} /> {p.city}, {p.country}
                        </p>
                      )}
                      {p.bio && <p className="text-xs text-white/55 leading-relaxed line-clamp-3">{p.bio}</p>}
                      <div className="flex flex-wrap gap-1">
                        {p.skills?.slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 border border-white/10 text-white/55">{s}</span>
                        ))}
                      </div>
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-yellow-200 hover:underline"
                      >
                        <Mail size={12} /> Contact
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "my-profile" && (
            <div className="max-w-xl mx-auto">
              {!user ? (
                <div className="text-center py-20 space-y-4">
                  <p className="text-white/50">Sign in to create your talent profile.</p>
                  <a href="/auth/login" className="inline-block rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black">Sign in</a>
                </div>
              ) : (
                <form onSubmit={saveProfile} className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-6 space-y-4">
                  <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-yellow-300" /> Your Talent Profile
                  </h2>
                  <p className="text-white/45 text-sm">This info is public and visible to companies browsing the talent pool.</p>
                  {([
                    ["Display name", "alias", "text", "Your name or pseudonym"],
                    ["Contact email", "email", "email", "Shown to companies"],
                    ["City", "city", "text", "e.g. Amman"],
                    ["Bio", "bio", "text", "One sentence about yourself"],
                    ["Skills (comma-separated)", "skills", "text", "React, Python, SQL…"],
                    ["Graduation year", "graduation_year", "number", "e.g. 2025"],
                    ["Years of experience", "years_experience", "number", "0 if fresh graduate"],
                  ] as const).map(([label, key, type, placeholder]) => (
                    <div key={key}>
                      <label className="block text-xs text-white/40 mb-1">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-300/40"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Field of study</label>
                    <select
                      value={form.field}
                      onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0A0716] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
                    >
                      {FIELDS.filter((f) => f !== "All").map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0A0716] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-300/40"
                    >
                      {COUNTRIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {saveMsg && <p className="text-sm text-yellow-200/80">{saveMsg}</p>}
                  <button type="submit" disabled={saving} className="w-full rounded-xl gold-grad py-3 text-sm font-extrabold text-black disabled:opacity-50">
                    {saving ? "Saving…" : "Save & Go Live"}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
