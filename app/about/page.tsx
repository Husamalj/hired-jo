import Navbar from "@/components/Navbar";
import { Mail, Heart, Users, Target } from "lucide-react";

export const metadata = { title: "About — Hired.jo" };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen px-4 py-20">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative mx-auto max-w-3xl space-y-16">

          {/* Hero */}
          <section className="text-center space-y-4">
            <h1 className="font-display text-5xl font-extrabold gold-text-grad">About Hired.jo</h1>
            <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto">
              An AI career copilot built for Jordanian graduates — helping you land your first job faster.
            </p>
          </section>

          {/* Story */}
          <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              <Target size={22} className="text-yellow-300" /> Our Story
            </h2>
            <p className="text-white/60 leading-relaxed">
              Hired.jo was built in 48 hours at the HU AI Employability Hackathon 2026 — and won. We saw that Jordanian graduates had strong skills but struggled to present them, understand the market, and compete with polished CVs.
            </p>
            <p className="text-white/60 leading-relaxed">
              So we built the tool we wished existed: AI that interviews you, builds your CV, scores your hireability against real live job data, and tells you exactly what to learn next.
            </p>
          </section>

          {/* Team */}
          <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              <Users size={22} className="text-yellow-300" /> Team
            </h2>
            <p className="text-white/60 leading-relaxed">
              We are a team of students from Hashemite University passionate about using AI to solve real problems in Jordan and the Arab world. Hired.jo is our contribution to bridging the gap between graduates and employers.
            </p>
          </section>

          {/* Contact */}
          <section className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-8 space-y-6" id="contact">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              <Mail size={22} className="text-yellow-300" /> Contact Us
            </h2>
            <p className="text-white/55">Got feedback, a bug to report, or a partnership idea? Reach us at:</p>
            <a
              href="mailto:khalidmasoud4321@gmail.com"
              className="inline-flex items-center gap-2 rounded-xl gold-grad px-4 py-2.5 text-sm font-bold text-black"
            >
              <Mail size={15} /> khalidmasoud4321@gmail.com
            </a>
          </section>

          {/* Support / Donate */}
          <section className="feature-card rounded-2xl border border-yellow-300/20 bg-yellow-300/5 p-8 space-y-4" id="support">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              <Heart size={22} className="text-yellow-300" /> Support the Project
            </h2>
            <p className="text-white/60 leading-relaxed">
              Hired.jo is free and will stay free for graduates. If it helped you land a job or prepare better, consider supporting us to keep the servers running and the AI powered up.
            </p>
            <div className="inline-flex items-center gap-3 rounded-xl border border-yellow-300/20 bg-yellow-300/5 px-4 py-2.5">
              <span className="text-sm font-bold text-yellow-200/60">☕ Support / Donate</span>
              <span className="rounded-full bg-yellow-300/15 border border-yellow-300/25 px-2.5 py-0.5 text-xs font-semibold text-yellow-200/70">Coming soon</span>
            </div>
            <p className="text-white/30 text-xs">We are setting up a secure payment method. Check back soon.</p>
          </section>

        </div>
      </main>
    </>
  );
}
