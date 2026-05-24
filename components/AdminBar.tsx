"use client";
import { useEffect, useState } from "react";
import { Eye, Zap, Crown, User } from "lucide-react";

type ViewAs = "real" | "free" | "pro" | "hired";

const VIEWS: { key: ViewAs; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: "real",
    label: "Real",
    icon: <User size={12} />,
    color: "border-white/20 bg-white/10 text-white/70 hover:text-white",
  },
  {
    key: "free",
    label: "Free",
    icon: <User size={12} />,
    color: "border-white/20 bg-white/5 text-white/60 hover:text-white",
  },
  {
    key: "pro",
    label: "Pro",
    icon: <Zap size={12} />,
    color: "border-yellow-300/30 bg-yellow-300/10 text-yellow-200 hover:text-yellow-100",
  },
  {
    key: "hired",
    label: "Hired",
    icon: <Crown size={12} />,
    color: "border-purple-400/30 bg-purple-400/10 text-purple-300 hover:text-purple-100",
  },
];

export function AdminBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [current, setCurrent] = useState<ViewAs>("real");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (d.isAdmin) {
          setIsAdmin(true);
          // If tier !== realTier, we're in view-as mode
          if (d.tier !== d.realTier) {
            setCurrent(d.tier as ViewAs);
          } else {
            setCurrent("real");
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  async function switchView(tier: ViewAs) {
    setLoading(true);
    try {
      await fetch("/api/admin/set-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      setCurrent(tier);
      // Reload so all fetches re-run with the new cookie
      window.location.reload();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0A0716]/90 backdrop-blur-md px-3 py-2 shadow-2xl">
      <div className="flex items-center gap-1.5 mr-1">
        <Eye size={13} className="text-white/40" />
        <span className="text-[11px] text-white/40 font-medium uppercase tracking-widest">View as</span>
      </div>
      {VIEWS.map((v) => {
        const active = current === v.key;
        return (
          <button
            key={v.key}
            onClick={() => switchView(v.key)}
            disabled={loading || active}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition disabled:cursor-default ${
              active
                ? v.key === "pro"
                  ? "border-yellow-300/50 bg-yellow-300/20 text-yellow-200"
                  : v.key === "hired"
                  ? "border-purple-400/50 bg-purple-400/20 text-purple-200"
                  : "border-white/30 bg-white/15 text-white"
                : v.color
            }`}
          >
            {v.icon}
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
