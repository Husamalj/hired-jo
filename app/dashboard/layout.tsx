import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jordan Job Market Dashboard — Live Analytics",
  description:
    "Live analytics on Jordan's job market: top skills in demand, salary ranges, sector hiring trends. Scraped daily from 10 job boards.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "Jordan Job Market — Live Dashboard",
    description: "Top in-demand skills, salaries, and hiring trends across Jordan.",
    url: "/dashboard",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
