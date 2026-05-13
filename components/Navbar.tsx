import Link from "next/link";

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
  return (
    <nav className="flex flex-wrap items-center justify-between gap-y-4 px-5 md:px-8 py-4 border-b border-white/5">
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
      <div className="flex md:hidden w-full gap-4 overflow-x-auto pb-1 text-sm text-white/60">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="shrink-0 hover:text-white transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
