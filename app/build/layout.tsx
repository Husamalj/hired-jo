import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build my CV — AI Interview Builder",
  description:
    "Build an ATS-ready CV in 5 minutes through a friendly AI interview. Free, no sign-up, instant PDF download. Made for Jordanian graduates.",
  alternates: { canonical: "/build" },
  openGraph: {
    title: "Build my CV in 5 minutes — Hired.jo",
    description: "AI interviews you, writes a clean ATS-ready CV, exports to PDF. Free.",
    url: "/build",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
