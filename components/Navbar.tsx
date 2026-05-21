"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/build", label: "Build CV" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/score", label: "My Score" },
  { href: "/roast", label: "Roast CV" },
  { href: "/dashboard", label: "Market" },
  { href: "/learn", label: "Learn" },
  { href: "/cofounder", label: "Co-founders" },
  { href: "/leaderboard", label: "Leaderboard" },
];

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
        {user ? (
          <button
            onClick={signOut}
            className="text-sm text-white/50 hover:text-white transition px-2 py-1"
          >
            Sign out
          </button>
        ) : (
          <a
            href="/auth/login"
            className="rounded-xl gold-grad px-3 py-1.5 text-xs font-extrabold text-black"
          >
            Sign in
          </a>
        )}
      </div>
      <div className="flex md:hidden w-full gap-4 overflow-x-auto pb-1 text-sm text-white/60">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="shrink-0 hover:text-white transition-colors">
            {label}
          </Link>
        ))}
        {user ? (
          <button
            onClick={signOut}
            className="shrink-0 text-sm text-white/50 hover:text-white transition"
          >
            Sign out
          </button>
        ) : (
          <a
            href="/auth/login"
            className="shrink-0 rounded-xl gold-grad px-3 py-1.5 text-xs font-extrabold text-black"
          >
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
