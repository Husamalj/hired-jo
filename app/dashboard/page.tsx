import { DashboardCharts } from "@/components/DashboardCharts";
import { Navbar } from "@/components/Navbar";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="px-8 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-3xl font-bold">Jordan Job Market</h1>
        {/* pulsing live badge */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          LIVE
        </span>
      </div>
      <p className="text-white/60 mb-6">
        Real jobs scraped from Akhtaboot, Bayt, Wuzzuf &amp; Fursa. Updated May 2026.
      </p>
      <DashboardCharts />
    </main>
    </>
  );
}
