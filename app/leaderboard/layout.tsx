import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top Hired Scores in Jordan",
  description:
    "Live ranking of the strongest job-ready graduates in Jordan. Score out of 1000 based on CV strength, skill demand, market fit, and completeness.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Hired.jo Leaderboard — Top Graduates in Jordan",
    description: "Live scores of Jordan's most job-ready graduates.",
    url: "/leaderboard",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
