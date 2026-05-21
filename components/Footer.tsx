export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/8">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-white/35">
        <div className="flex items-center gap-2 font-display font-bold">
          <span className="gold-text-grad text-lg">Hired</span>
          <span className="text-white/40">.jo</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a href="/" className="hover:text-white/70 transition">Home</a>
          <a href="/jobs" className="hover:text-white/70 transition">Find Jobs</a>
          <a href="/build" className="hover:text-white/70 transition">Build CV</a>
          <a href="/roast" className="hover:text-white/70 transition">Roast CV</a>
          <a href="/leaderboard" className="hover:text-white/70 transition">Leaderboard</a>
          <a href="/about" className="hover:text-white/70 transition">About</a>
        </div>
        <p className="text-white/25 text-xs">© {new Date().getFullYear()} Hired.jo — Built in Jordan 🇯🇴</p>
      </div>
    </footer>
  );
}
