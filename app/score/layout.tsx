import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hired Score — How Job-Ready Are You?",
  description:
    "Get your Hired Score (0–1000) based on CV strength, skill demand in Jordan, market fit, and profile completeness. Personalized tips to climb the ranking.",
  alternates: { canonical: "/score" },
  openGraph: {
    title: "Get your Hired Score — Hired.jo",
    description: "Score your CV out of 1000 against the Jordan job market.",
    url: "/score",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
