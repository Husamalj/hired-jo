import Navbar from "@/components/Navbar";

export const metadata = { title: "Privacy Policy — Hired.jo" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#F5B82E" }}>Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
          <p className="text-white/70 leading-relaxed">We collect information you provide directly: name, email, CV content, job preferences, and profile information. We also collect usage data such as features used, pages visited, and session information.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
          <p className="text-white/70 leading-relaxed">We use your information to provide and improve the Service, process payments, generate AI-powered CV and cover letter content, match you with relevant jobs, and communicate service updates.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">3. Data Storage</h2>
          <p className="text-white/70 leading-relaxed">Your data is stored securely using Supabase (PostgreSQL). CV content is stored in your browser's local storage and optionally synced to your account. We do not sell your personal data to third parties.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
          <p className="text-white/70 leading-relaxed">We use the following third-party services: Paddle (payment processing), Google Gemini (AI content generation), Supabase (authentication and database), and Vercel (hosting). Each has its own privacy policy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">5. Talent Profile Visibility</h2>
          <p className="text-white/70 leading-relaxed">If you create a talent profile, your name, skills, and contact preferences may be visible to registered employers on the platform. You can delete or hide your talent profile at any time from your profile settings.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
          <p className="text-white/70 leading-relaxed">You have the right to access, correct, or delete your personal data at any time. To request data deletion, contact us at <a href="mailto:support@hiredjo.com" className="text-yellow-400 hover:underline">support@hiredjo.com</a>.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
          <p className="text-white/70 leading-relaxed">We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
          <p className="text-white/70 leading-relaxed">For privacy questions, contact us at <a href="mailto:support@hiredjo.com" className="text-yellow-400 hover:underline">support@hiredjo.com</a>.</p>
        </section>
      </main>
    </div>
  );
}
