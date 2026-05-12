import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Co-founder in Jordan — AI Matching",
  description:
    "Match with complementary co-founders in Jordan based on skills, interests, and startup vibe. AI-powered embedding match. Free to join.",
  alternates: { canonical: "/cofounder" },
  openGraph: {
    title: "Find a Co-founder in Jordan",
    description: "AI-matched co-founder discovery for Jordanian founders.",
    url: "/cofounder",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
