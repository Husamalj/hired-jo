import Navbar from "@/components/Navbar";

export const metadata = { title: "Terms of Service — Hired.jo" };

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-16 prose prose-invert">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#F5B82E" }}>Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-white/70 leading-relaxed">By accessing or using Hired.jo ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
          <p className="text-white/70 leading-relaxed">Hired.jo is an AI-powered career platform that helps users build CVs, find jobs, generate cover letters, and connect with employers. The Service is offered on a freemium basis with paid subscription plans and one-time credit packs.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">3. Accounts</h2>
          <p className="text-white/70 leading-relaxed">You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. One account per person — creating multiple accounts to circumvent usage limits is prohibited.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">4. Payments & Billing</h2>
          <p className="text-white/70 leading-relaxed">Payments are processed by Paddle.com as our Merchant of Record. Subscription fees are charged monthly. One-time packs are non-recurring. All prices are displayed in Jordanian Dinar (JOD). By purchasing, you authorise Paddle to charge your payment method.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">5. Acceptable Use</h2>
          <p className="text-white/70 leading-relaxed">You agree not to use the Service to generate false or misleading CV content, spam employers, violate any applicable laws, or attempt to reverse-engineer our AI systems. We reserve the right to suspend accounts that violate these rules.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">6. Intellectual Property</h2>
          <p className="text-white/70 leading-relaxed">You retain ownership of content you upload. By using the Service, you grant Hired.jo a limited licence to process your content solely to provide the Service. The Hired.jo platform, brand, and AI models are our intellectual property.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">7. Disclaimer</h2>
          <p className="text-white/70 leading-relaxed">The Service is provided "as is". We do not guarantee job placement or interview success. AI-generated content should be reviewed before use. We are not liable for decisions made by employers or third parties.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
          <p className="text-white/70 leading-relaxed">We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
          <p className="text-white/70 leading-relaxed">For questions about these Terms, contact us at <a href="mailto:support@hiredjo.com" className="text-yellow-400 hover:underline">support@hiredjo.com</a>.</p>
        </section>
      </main>
    </div>
  );
}
