import Navbar from "@/components/Navbar";

export const metadata = { title: "Refund Policy — Hired.jo" };

export default function RefundPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#F5B82E" }}>Refund Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Subscriptions</h2>
          <p className="text-white/70 leading-relaxed">You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period — you retain access until then. We do not offer pro-rated refunds for unused days in a billing period.</p>
          <p className="text-white/70 leading-relaxed mt-3">If you believe you were charged in error, contact us within 7 days of the charge and we will review your case.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">One-Time Packs</h2>
          <p className="text-white/70 leading-relaxed">One-time credit packs (CV Pack, Edit Pack, Cover Pack) are non-refundable once any credits have been used. If you purchased a pack and have not used any credits, contact us within 48 hours for a full refund.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Exceptional Circumstances</h2>
          <p className="text-white/70 leading-relaxed">We handle refund requests on a case-by-case basis. If our Service experienced a significant outage or technical failure that prevented you from using what you paid for, we will issue a refund or credit.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">How to Request a Refund</h2>
          <p className="text-white/70 leading-relaxed">Email us at <a href="mailto:support@hiredjo.com" className="text-yellow-400 hover:underline">support@hiredjo.com</a> with your account email and the reason for your request. We respond within 2 business days.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Payment Processor</h2>
          <p className="text-white/70 leading-relaxed">Payments are processed by Paddle.com. Refunds are returned to the original payment method and may take 5–10 business days to appear depending on your bank.</p>
        </section>
      </main>
    </div>
  );
}
