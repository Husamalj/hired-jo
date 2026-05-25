"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { MapPin, GraduationCap, Mail, Globe, ExternalLink, Link2, GitFork, ArrowLeft, Camera, FileDown, X } from "lucide-react";
import Link from "next/link";

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
  stars?: number;
  is_hired_subscriber?: boolean;
  posts?: Post[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TalentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCv, setShowCv] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasStarred, setHasStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const sb = createSupabaseBrowserClient();

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setCurrentUser(uid);
      try {
        const res = await fetch(`/api/talent?userId=${id}`);
        const profile = await res.json();
        setProfile(profile);
        setStars(profile?.stars ?? 0);
        setLoading(false);
        if (uid && profile?.user_id) {
          const { data: starRow } = await sb
            .from("talent_stars")
            .select("id")
            .eq("user_id", uid)
            .eq("starred_user_id", profile.user_id)
            .maybeSingle();
          setHasStarred(!!starRow);
        }
      } catch { setLoading(false); }
    });
  }, [id]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${profile.user_id}.${ext}`;
    const { error: upErr } = await sb.storage.from("talent-media").upload(path, file, { upsert: true });
    if (upErr) { alert("Upload failed: " + upErr.message); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = sb.storage.from("talent-media").getPublicUrl(path);
    await fetch("/api/talent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", profile: { ...profile, avatar_url: publicUrl } }),
    });
    setProfile(p => p ? { ...p, avatar_url: publicUrl } : p);
    setUploadingAvatar(false);
  }

  async function handleStar() {
    if (!currentUser) { location.href = `/auth/login?next=/talent/${id}`; return; }
    setStarLoading(true);
    const res = await fetch("/api/talent/star", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: profile?.user_id }),
    });
    if (res.ok) {
      const { starred, stars: newCount } = await res.json();
      setHasStarred(starred);
      setStars(newCount);
    }
    setStarLoading(false);
  }

  if (loading) return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/30">Loading profile…</p>
      </main>
    </>
  );

  if (!profile) return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/30">Profile not found.</p>
      </main>
    </>
  );

  const isOwn = currentUser === profile.user_id;
  const posts = profile.posts ?? [];
  const initials = profile.alias?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const avatarColors = ["#3F2B96","#7C3AED","#0369A1","#065F46","#9A3412","#1D4ED8"];
  const avatarColor = avatarColors[(profile.alias?.charCodeAt(0) ?? 0) % avatarColors.length];

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-20">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />

        <div className="relative max-w-3xl mx-auto px-4 pt-20">
          {/* Back */}
          <Link href="/talent" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition">
            <ArrowLeft size={15} /> Back to Talent
          </Link>

          {/* Cover + Avatar */}
          <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03]">
            {/* Cover strip */}
            <div className="h-32 bg-gradient-to-r from-[#3F2B96] via-[#5B3FD8] to-[#0369A1]" />

            {/* Avatar row */}
            <div className="px-6 pb-5">
              <div className="flex items-end justify-between -mt-12 mb-4">
                <div className="relative group">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.alias}
                      className="w-24 h-24 rounded-full border-4 border-[#0A0716] object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-[#0A0716] flex items-center justify-center text-3xl font-bold text-white"
                      style={{ background: avatarColor }}>
                      {initials}
                    </div>
                  )}
                  {isOwn && (
                    <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      {uploadingAvatar
                        ? <span className="text-xs text-white">Uploading…</span>
                        : <Camera size={20} className="text-white" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {profile.cv_url && (
                    <button onClick={() => setShowCv(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition">
                      <FileDown size={14} /> View CV
                    </button>
                  )}
                  <button
                    onClick={handleStar}
                    disabled={starLoading}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                      hasStarred
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                        : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {hasStarred ? "★" : "☆"} {stars.toLocaleString()}
                  </button>
                  <a href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2 rounded-xl gold-grad px-4 py-2 text-sm font-bold text-black">
                    <Mail size={14} /> Contact
                  </a>
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white">{profile.alias}</h1>
                {profile.is_hired_subscriber && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-1 text-xs font-bold text-yellow-300">
                    ⚡ Hired Pro
                  </span>
                )}
              </div>
              <p className="text-white/55 text-sm mt-1">{profile.field}{profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ""}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/35">
                {(profile.city || profile.country) && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                )}
                {profile.years_experience > 0 && (
                  <span className="flex items-center gap-1"><GraduationCap size={12} />{profile.years_experience} yr{profile.years_experience !== 1 ? "s" : ""} experience</span>
                )}
              </div>

              {/* Links */}
              {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
                <div className="flex items-center gap-4 mt-3">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                      <Link2 size={13} /> LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url.startsWith("http") ? profile.github_url : `https://${profile.github_url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white hover:underline">
                      <GitFork size={13} /> GitHub
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url.startsWith("http") ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-yellow-200/70 hover:text-yellow-200 hover:underline">
                      <Globe size={13} /> Portfolio
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About */}
          {profile.bio && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">About</h2>
              <p className="text-white/70 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(s => (
                  <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-white/65">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <div className="mt-4 space-y-3">
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-wider px-1">Posts & Updates</h2>
              {posts.map(post => (
                <div key={post.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: avatarColor }}>{initials}</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{profile.alias}</p>
                      <p className="text-xs text-white/30">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  {post.text && <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap mb-3">{post.text}</p>}
                  {post.media_url && (
                    post.media_type === "video" ? (
                      <video src={post.media_url} controls className="w-full rounded-xl max-h-80 object-cover bg-black" />
                    ) : (
                      <img src={post.media_url} alt="" className="w-full rounded-xl object-contain bg-black/20" />
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {posts.length === 0 && !profile.bio && !profile.skills?.length && (
            <div className="mt-8 text-center py-12 text-white/25 text-sm">No content yet.</div>
          )}
        </div>
      </main>

      {/* CV Modal */}
      {showCv && profile.cv_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCv(false); }}>
          <div className="relative w-full max-w-4xl bg-[#0A0716] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
            style={{ height: "90vh" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
              <p className="text-sm font-semibold text-white">{profile.alias}'s CV</p>
              <div className="flex items-center gap-3">
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" download
                  className="inline-flex items-center gap-1.5 text-xs text-yellow-200 hover:underline">
                  <FileDown size={13} /> Download
                </a>
                <button onClick={() => setShowCv(false)}
                  className="rounded-full p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* PDF or fallback */}
            {profile.cv_url.toLowerCase().endsWith(".pdf") ? (
              <iframe src={profile.cv_url} className="flex-1 w-full" title="CV" />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/40 text-sm">
                <FileDown size={32} className="text-yellow-200/60" />
                <p>Preview not available for this file type.</p>
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" download
                  className="inline-flex items-center gap-2 rounded-xl gold-grad px-5 py-2.5 text-sm font-bold text-black">
                  <FileDown size={14} /> Download CV
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
