"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, FileText, Bookmark, BarChart2 } from "lucide-react";

const links = [
  { href: "/build", label: "Build CV" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/score", label: "My Score" },
  { href: "/roast", label: "Roast CV" },
  { href: "/dashboard", label: "Market" },
  { href: "/learn", label: "Learn" },
  { href: "/cofounder", label: "Co-founders" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/talent", label: "Talent" },
  { href: "/about", label: "About" },
];

function UserMenu({ user, signOut }: { user: User; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User";
  const avatar = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 hover:border-white/20 transition"
      >
        {avatar ? (
          <img src={avatar} alt={name} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <div className="h-6 w-6 rounded-full gold-grad flex items-center justify-center text-[10px] font-bold text-black">
            {initials}
          </div>
        )}
        <span className="text-xs text-white/70 max-w-[100px] truncate">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#0A0716] shadow-2xl z-50 overflow-hidden">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-white/40 truncate">{email}</p>
          </div>
          {/* Menu items */}
          <div className="p-1">
            <a href="/build" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition">
              <FileText size={14} /> My CV
            </a>
            <a href="/score" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition">
              <BarChart2 size={14} /> My Score
            </a>
            <a href="/jobs?saved=1" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition">
              <Bookmark size={14} /> Saved Jobs
            </a>
            <a href="/talent" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition">
              <UserIcon size={14} /> My Talent Profile
            </a>
          </div>
          {/* Sign out */}
          <div className="p-1 border-t border-white/8">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-300/70 hover:bg-red-400/8 hover:text-red-300 transition"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    location.href = "/";
  }

  const authSection = user ? (
    <UserMenu user={user} signOut={signOut} />
  ) : (
    <a href="/auth/login" className="rounded-xl gold-grad px-3 py-1.5 text-xs font-extrabold text-black shrink-0">
      Sign in
    </a>
  );

  return (
    <nav className="flex flex-wrap items-center justify-between gap-y-4 px-5 md:px-8 py-4 border-b border-white/5">
      <Link href="/" className="font-display font-bold text-xl tracking-tight">
        Hired<span style={{ color: "var(--gold)" }}>.jo</span>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="hover:text-white transition-colors">
            {label}
          </Link>
        ))}
        {authSection}
      </div>
      <div className="flex md:hidden w-full gap-4 overflow-x-auto pb-1 text-sm text-white/60">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="shrink-0 hover:text-white transition-colors">
            {label}
          </Link>
        ))}
        {authSection}
      </div>
    </nav>
  );
}

export default Navbar;
