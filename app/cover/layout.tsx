import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Cover Letter Generator for Jordan Jobs",
  description:
    "Paste a job posting, get a tailored cover letter in 10 seconds. Free, no sign-up.",
  alternates: { canonical: "/cover" },
  openGraph: {
    title: "AI Cover Letter Generator — Hired.jo",
    description: "Tailored cover letters for Jordan job applications, in 10 seconds.",
    url: "/cover",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
