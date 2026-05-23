"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check } from "lucide-react";

type PriceId =
  | "NEXT_PUBLIC_PADDLE_PRICE_PRO"
  | "NEXT_PUBLIC_PADDLE_PRICE_HIRED"
  | "NEXT_PUBLIC_PADDLE_PRICE_CV_PACK"
  | "NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK"
  | "NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK";

const ENV_MAP: Record<PriceId, string | undefined> = {
  NEXT_PUBLIC_PADDLE_PRICE_PRO: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
  NEXT_PUBLIC_PADDLE_PRICE_HIRED: process.env.NEXT_PUBLIC_PADDLE_PRICE_HIRED,
  NEXT_PUBLIC_PADDLE_PRICE_CV_PACK: process.env.NEXT_PUBLIC_PADDLE_PRICE_CV_PACK,
  NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK: process.env.NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK,
  NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK: process.env.NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK,
};

async function startCheckout(envKey: PriceId, setLoading: (k: PriceId | null) => void) {
  const priceId = ENV_MAP[envKey];
  if (!priceId) {
    alert("Checkout not configured yet. Check back soon!");
    return;
  }
  setLoading(envKey);
  try {
    const res = await fetch("/api/paddle/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data?.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      alert("Could not start checkout. Please try again.");
    }
  } catch {
    alert("Could not start checkout. Please try again.");
  } finally {
    setLoading(null);
  }
}

const tiers = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    featured: false,
    envKey: null as PriceId | null,
    cta: "Get Started Free",
    ctaHref: "/build",
    features: [
      "1 CV build (lifetime)",
      "2 AI section edits/month",
      "1 cover letter (lifetime)",
      "Basic job matching",
    ],
  },
  {
    name: "Pro",
    price: "6",
    period: "/month",
    featured: true,
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_PRO" as PriceId,
    cta: "Upgrade to Pro",
    ctaHref: null,
    features: [
      "5 CV builds/month",
      "15 AI section edits/month",
      "10 cover letters/month",
      "Priority support",
    ],
  },
  {
    name: "Hired",
    price: "15",
    period: "/month",
    featured: false,
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_HIRED" as PriceId,
    cta: "Upgrade to Hired",
    ctaHref: null,
    features: [
      "20 CV builds/month",
      "40 AI section edits/month",
      "30 cover letters/month",
      "Everything in Pro",
      "Talent profile visibility",
    ],
  },
];

const packs = [
  {
    name: "CV Pack",
    desc: "3 extra CV builds",
    price: "2",
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_CV_PACK" as PriceId,
  },
  {
    name: "Edit Pack",
    desc: "10 extra AI edits",
    price: "2",
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK" as PriceId,
  },
  {
    name: "Cover Pack",
    desc: "5 extra cover letters",
    price: "2",
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK" as PriceId,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<PriceId | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Simple,{" "}
            <span style={{ color: "#F5B82E" }}>Transparent</span> Pricing
          </h1>
          <p className="text-white/50 text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={[
                "rounded-2xl border p-8 flex flex-col gap-6 transition-transform duration-200",
                tier.featured
                  ? "border-[#F5B82E] scale-[1.04] shadow-[0_0_40px_rgba(245,184,46,0.12)]"
                  : "border-white/10",
                "bg-white/5",
              ].join(" ")}
            >
              {tier.featured && (
                <div className="self-start rounded-full px-3 py-0.5 text-xs font-bold" style={{ background: "#F5B82E", color: "#0A0716" }}>
                  Most Popular
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-1">{tier.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  <span className="text-white/40 text-sm mb-1.5">JOD{tier.period}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={15} className="shrink-0 mt-0.5" style={{ color: "#F5B82E" }} />
                    {f}
                  </li>
                ))}
              </ul>

              {tier.ctaHref ? (
                <Link
                  href={tier.ctaHref}
                  className="block text-center rounded-xl px-4 py-2.5 text-sm font-bold border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition"
                >
                  {tier.cta}
                </Link>
              ) : (
                <button
                  disabled={loading === tier.envKey}
                  onClick={() => tier.envKey && startCheckout(tier.envKey, setLoading)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60"
                  style={
                    tier.featured
                      ? { background: "#F5B82E", color: "#0A0716" }
                      : { background: "#3F2B96", color: "white" }
                  }
                >
                  {loading === tier.envKey ? "Redirecting…" : tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* One-time packs */}
        <div>
          <h2 className="text-xl font-bold text-center mb-2">One-Time Packs</h2>
          <p className="text-white/40 text-sm text-center mb-8">Need a little more? Buy exactly what you need.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packs.map((pack) => (
              <div
                key={pack.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
              >
                <div>
                  <p className="font-bold text-base">{pack.name}</p>
                  <p className="text-white/50 text-sm mt-0.5">{pack.desc}</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-extrabold">{pack.price}</span>
                  <span className="text-white/40 text-sm mb-0.5">JOD one-time</span>
                </div>
                <button
                  disabled={loading === pack.envKey}
                  onClick={() => startCheckout(pack.envKey, setLoading)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-[#F5B82E] hover:text-[#F5B82E] transition disabled:opacity-60"
                >
                  {loading === pack.envKey ? "Redirecting…" : `Buy ${pack.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/30 text-xs mt-14">
          All prices in Jordanian Dinar (JOD). Payments processed securely via Paddle.
        </p>
      </main>
    </div>
  );
}
