"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check, X } from "lucide-react";

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

// All features listed — each tier specifies what it gets
type Feature = { label: string; free: string | false; pro: string | false; hired: string | false };

const features: Feature[] = [
  { label: "CV builds",           free: "1 (lifetime)",  pro: "5 / month",    hired: "20 / month" },
  { label: "AI section edits",    free: "2 / month",     pro: "15 / month",   hired: "40 / month" },
  { label: "Cover letters",       free: "1 (lifetime)",  pro: "10 / month",   hired: "30 / month" },
  { label: "Job matching",        free: "Basic",         pro: "Advanced",     hired: "Advanced" },
  { label: "Priority support",    free: false,           pro: true,           hired: true },
  { label: "Talent profile visibility", free: false,     pro: false,          hired: true },
];

const tiers = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    featured: false,
    envKey: null as PriceId | null,
    cta: "Get Started Free",
    ctaHref: "/build",
    featureKey: "free" as keyof Feature,
  },
  {
    name: "Pro",
    price: "6",
    period: "/month",
    featured: true,
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_PRO" as PriceId,
    cta: "Upgrade to Pro",
    ctaHref: null,
    featureKey: "pro" as keyof Feature,
  },
  {
    name: "Hired",
    price: "15",
    period: "/month",
    featured: false,
    envKey: "NEXT_PUBLIC_PADDLE_PRICE_HIRED" as PriceId,
    cta: "Upgrade to Hired",
    ctaHref: null,
    featureKey: "hired" as keyof Feature,
  },
];

const packs = [
  { name: "CV Pack",    desc: "3 extra CV builds",        price: "2", envKey: "NEXT_PUBLIC_PADDLE_PRICE_CV_PACK" as PriceId },
  { name: "Edit Pack",  desc: "10 extra AI edits",         price: "2", envKey: "NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK" as PriceId },
  { name: "Cover Pack", desc: "5 extra cover letters",     price: "2", envKey: "NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK" as PriceId },
];

function FeatureValue({ value }: { value: string | boolean | false }) {
  if (value === false) {
    return <X size={16} className="mx-auto" style={{ color: "#ff4d4d" }} />;
  }
  if (value === true) {
    return <Check size={16} className="mx-auto" style={{ color: "#F5B82E" }} />;
  }
  return <span className="text-sm text-white/80">{value}</span>;
}

export default function PricingPage() {
  const [loading, setLoading] = useState<PriceId | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Simple, <span style={{ color: "#F5B82E" }}>Transparent</span> Pricing
          </h1>
          <p className="text-white/50 text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden mb-20">
          {/* Tier headers */}
          <div className="grid grid-cols-4 border-b border-white/10">
            <div className="p-6" />
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={[
                  "p-6 text-center border-l border-white/10",
                  tier.featured ? "bg-[#F5B82E]/5" : "",
                ].join(" ")}
              >
                {tier.featured && (
                  <div className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2" style={{ background: "#F5B82E", color: "#0A0716" }}>
                    Most Popular
                  </div>
                )}
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">{tier.name}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-3xl font-extrabold">{tier.price}</span>
                  <span className="text-white/40 text-xs mb-1">JOD{tier.period}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {features.map((feat, i) => (
            <div
              key={feat.label}
              className={["grid grid-cols-4 border-b border-white/10 last:border-b-0", i % 2 === 0 ? "" : "bg-white/[0.02]"].join(" ")}
            >
              <div className="p-4 px-6 text-sm text-white/60 flex items-center">{feat.label}</div>
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={[
                    "p-4 border-l border-white/10 flex items-center justify-center text-center",
                    tier.featured ? "bg-[#F5B82E]/5" : "",
                  ].join(" ")}
                >
                  <FeatureValue value={feat[tier.featureKey] as string | boolean | false} />
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-4 border-t border-white/10 bg-white/[0.02]">
            <div className="p-6" />
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={[
                  "p-5 border-l border-white/10 flex items-center justify-center",
                  tier.featured ? "bg-[#F5B82E]/5" : "",
                ].join(" ")}
              >
                {tier.ctaHref ? (
                  <Link
                    href={tier.ctaHref}
                    className="w-full text-center rounded-xl px-4 py-2.5 text-sm font-bold border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition"
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    disabled={loading === tier.envKey}
                    onClick={() => tier.envKey && startCheckout(tier.envKey, setLoading)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60"
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
        </div>

        {/* One-time packs */}
        <div>
          <h2 className="text-xl font-bold text-center mb-2">One-Time Packs</h2>
          <p className="text-white/40 text-sm text-center mb-8">Need a little more? Buy exactly what you need, no subscription required.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packs.map((pack) => (
              <div key={pack.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
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

        <p className="text-center text-white/30 text-xs mt-14">
          All prices in Jordanian Dinar (JOD). Payments processed securely via Paddle.
        </p>
      </main>
    </div>
  );
}
