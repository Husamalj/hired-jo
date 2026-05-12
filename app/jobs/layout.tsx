import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jordan Jobs — Live from Akhtaboot, Bayt, Wuzzuf & 7 more",
  description:
    "Real-time job board pulling 60+ live Jordan jobs from Akhtaboot, Bayt, Wuzzuf, Fursa, LinkedIn, Indeed, Glassdoor, Naukrigulf, GulfTalent, and Tanqeeb.",
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: "Live Jordan Jobs — 10 boards in one place",
    description: "Find your next role in Jordan. AI-matched against your CV.",
    url: "/jobs",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
