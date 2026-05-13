import Link from "next/link";

const links = [
  { href: "/build", label: "Build CV" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/score", label: "My Score" },
  { href: "/dashboard", label: "Market" },
  { href: "/learn", label: "Learn" },
  { href: "/cofounder", label: "Co-founders" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
      <Link href="/" className="font-display font-bold text-xl tracking-tight">
        Hired<span style={{ color: "var(--gold)" }}>.jo</span>
      </Link>
      <div className="hidden md:flex gap-6 text-sm text-white/60">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="hover:text-white transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
