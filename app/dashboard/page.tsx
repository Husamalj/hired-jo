import { DashboardCharts } from "@/components/DashboardCharts";

export default function DashboardPage() {
  return (
    <main className="px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Jordan Job Market — Live</h1>
      <p className="text-white/60 mb-6">
        Real jobs scraped from Akhtaboot, Bayt, and Wuzzuf. Updated May 2026.
      </p>
      <DashboardCharts />
    </main>
  );
}
