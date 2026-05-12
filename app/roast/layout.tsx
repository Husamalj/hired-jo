import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roast my CV — Brutally Honest AI Feedback",
  description:
    "Upload your CV and get unfiltered AI feedback in 30 seconds. Spot the red flags before recruiters do. Free.",
  alternates: { canonical: "/roast" },
  openGraph: {
    title: "🔥 Roast my CV — Hired.jo",
    description: "Brutally honest AI feedback on your CV.",
    url: "/roast",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
