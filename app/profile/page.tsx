"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Crown, Zap, FileText, MessageSquare, Sparkles, ExternalLink } from "lucide-react";

type Tier = "free" | "pro" | "hired";

interface UsageData {
  tier: Tier;
  usage: {
    cv_builds: number;
    ai_edits: number;
    cover_letters: number;
    cv_builds_bonus: number;
    ai_edits_bonus: number;
    cover_letters_bonus: number;
    cv_builds_lifetime: number;
    cover_letters_lifetime: number;
  };
  limits: {
    cv_builds: number;
    ai_edits: number;
    cover_letters: number;
  };
}

const TIER_LABELS: Record<Tier, string> = { free: "Free", pro: "Pro", hired: "Hired" };
const TIER_COLORS: Record<Tier, string> = {
  free: "rgba(255,255,255,0.15)",
  pro: "#F5B82E",
  hired: "#3F2B96",
};
const TIER_TEXT: Record<Tier, string> = { free: "white", pro: "#0A0716", hired: "white" };
const TIER_ICON: Record<Tier, React.ReactNode> = {
  free: <Zap size={12} />,
  pro: <Crown size={12} />,
  hired: <Sparkles size={12} />,
};

function UsageBar({ used, limit, label, icon }: { used: number; limit: number; label: string; icon: React.ReactNode }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isWarning = pct >= 80;
  const isDanger = pct >= 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-white/60">
          {icon}
          {label}
        </span>
        <span className={isDanger ? "text-red-400" : isWarning ? "text-yellow-400" : "text-white/50"}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isDanger ? "#ef4444" : isWarning ? "#F5B82E" : "#3F2B96",
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      fetch("/api/subscription")
        .then((r) => r.json())
        .then((d) => setData(d))
        .finally(() => setLoading(false));
    });
  }, []);

  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "User";
  const avatar = user?.user_metadata?.avatar_url ?? null;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const tier = data?.tier ?? "free";

  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-5 py-14 flex flex-col gap-8">

        {/* Profile header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 flex items-center gap-5">
          {avatar ? (
            <img src={avatar} alt={name} className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10" />
          ) : (
            <div className="h-16 w-16 rounded-full gold-grad flex items-center justify-center text-xl font-bold text-black shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{name}</h1>
            <p className="text-white/40 text-sm truncate">{user?.email}</p>
            <div className="mt-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: TIER_COLORS[tier], color: TIER_TEXT[tier] }}
              >
                {TIER_ICON[tier]}
                {TIER_LABELS[tier]} Plan
              </span>
            </div>
          </div>
          {tier === "free" && (
            <Link
              href="/pricing"
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition"
              style={{ background: "#F5B82E", color: "#0A0716" }}
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* Usage this month */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Usage This Month</h2>
            <span className="text-xs text-white/30">Resets monthly</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : data ? (
            <div className="flex flex-col gap-5">
              <UsageBar
                icon={<FileText size={13} />}
                label="CV Builds"
                used={tier === "free" ? (data.usage.cv_builds_lifetime ?? 0) : (data.usage.cv_builds ?? 0)}
                limit={data.limits.cv_builds}
              />
              <UsageBar
                icon={<Zap size={13} />}
                label="AI Section Edits"
                used={data.usage.ai_edits ?? 0}
                limit={data.limits.ai_edits}
              />
              <UsageBar
                icon={<MessageSquare size={13} />}
                label="Cover Letters"
                used={tier === "free" ? (data.usage.cover_letters_lifetime ?? 0) : (data.usage.cover_letters ?? 0)}
                limit={data.limits.cover_letters}
              />

              {/* Bonus packs */}
              {((data.usage.cv_builds_bonus ?? 0) > 0 || (data.usage.ai_edits_bonus ?? 0) > 0 || (data.usage.cover_letters_bonus ?? 0) > 0) && (
                <div className="rounded-xl border border-[#F5B82E]/20 bg-[#F5B82E]/5 p-4 text-sm text-white/60 flex flex-col gap-1">
                  <p className="text-[#F5B82E] font-semibold text-xs uppercase tracking-wide mb-1">Bonus from packs</p>
                  {(data.usage.cv_builds_bonus ?? 0) > 0 && <p>+{data.usage.cv_builds_bonus} CV builds</p>}
                  {(data.usage.ai_edits_bonus ?? 0) > 0 && <p>+{data.usage.ai_edits_bonus} AI edits</p>}
                  {(data.usage.cover_letters_bonus ?? 0) > 0 && <p>+{data.usage.cover_letters_bonus} cover letters</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/40 text-sm">Could not load usage data.</p>
          )}

          {tier === "free" && (
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-white/50 hover:border-[#F5B82E]/40 hover:text-[#F5B82E] transition"
            >
              <ExternalLink size={13} /> Get more with Pro or Hired
            </Link>
          )}
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 flex flex-col gap-3">
          <h2 className="font-bold text-base mb-1">My Content</h2>
          {[
            { href: "/build", label: "My CV", desc: "View or rebuild your CV" },
            { href: "/score", label: "My Hired Score", desc: "See your career readiness score" },
            { href: "/talent", label: "My Talent Profile", desc: "Your public profile for companies" },
            { href: "/jobs?saved=1", label: "Saved Jobs", desc: "Jobs you bookmarked" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-white/5 transition group"
            >
              <div>
                <p className="text-sm font-medium text-white/80 group-hover:text-white transition">{link.label}</p>
                <p className="text-xs text-white/30">{link.desc}</p>
              </div>
              <ExternalLink size={13} className="text-white/20 group-hover:text-white/50 transition" />
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
