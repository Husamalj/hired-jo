"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check, Lock } from "lucide-react";

type VariantKey =
  | "pro"
  | "hired"
  | "cv_pack"
  | "edit_pack"
  | "cover_pack";

const VARIANT_MAP: Record<VariantKey, string> = {
  pro: "1694502",
  hired: "1694491",
  cv_pack: "1694505",
  edit_pack: "1694508",
  cover_pack: "1694511",
};

async function startCheckout(variantKey: VariantKey, setLoading: (k: VariantKey | null) => void) {
  const variantId = VARIANT_MAP[variantKey];
  setLoading(variantKey);
  try {
    const res = await fetch("/api/lemonsqueezy/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    const data = await res.json();
    if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    else alert("Could not start checkout. Please try again.");
  } catch {
    alert("Could not start checkout. Please try again.");
  } finally {
    setLoading(null);
  }
}

type Feature = { label: string; included: boolean };

const tiers = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    featured: false,
    variantKey: null as VariantKey | null,
    cta: "Get Started Free",
    ctaHref: "/build",
    features: [
      { label: "1 CV build (lifetime)", included: true },
      { label: "2 AI section edits / month", included: true },
      { label: "1 cover letter (lifetime)", included: true },
      { label: "Basic job matching", included: true },
      { label: "Talent profile · Normal visibility", included: true },
    ] as Feature[],
  },
  {
    name: "Pro",
    price: "6",
    period: "/month",
    featured: true,
    variantKey: "pro" as VariantKey,
    cta: "Upgrade to Pro",
    ctaHref: null,
    features: [
      { label: "5 CV builds / month", included: true },
      { label: "15 AI section edits / month", included: true },
      { label: "10 cover letters / month", included: true },
      { label: "Advanced job matching", included: true },
      { label: "Priority support", included: true },
      { label: "Talent profile · Mid visibility", included: true },
    ] as Feature[],
  },
  {
    name: "Hired",
    price: "15",
    period: "/month",
    featured: false,
    variantKey: "hired" as VariantKey,
    cta: "Upgrade to Hired",
    ctaHref: null,
    features: [
      { label: "20 CV builds / month", included: true },
      { label: "40 AI section edits / month", included: true },
      { label: "30 cover letters / month", included: true },
      { label: "Advanced job matching", included: true },
      { label: "Priority support", included: true },
      { label: "Talent profile · High visibility", included: true },
    ] as Feature[],
  },
];

const packs = [
  { name: "CV Pack",    desc: "3 extra CV builds",      price: "2", variantKey: "cv_pack" as VariantKey },
  { name: "Edit Pack",  desc: "10 extra AI edits",       price: "2", variantKey: "edit_pack" as VariantKey },
  { name: "Cover Pack", desc: "5 extra cover letters",   price: "2", variantKey: "cover_pack" as VariantKey },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<VariantKey | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0A0716", color: "white" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Simple, <span style={{ color: "#F5B82E" }}>Transparent</span> Pricing
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
                {tier.features.map((f) => {
                  const [main, badge] = f.label.includes(" · ") ? f.label.split(" · ") : [f.label, null];
                  return (
                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check size={15} className="shrink-0 mt-0.5" style={{ color: "#F5B82E" }} />
                      ) : (
                        <Lock size={13} className="shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                      )}
                      <span style={{ color: f.included ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)" }}>
                        {main}
                        {badge && (
                          <span className="ml-1.5 text-[11px] font-semibold rounded-full px-2 py-0.5"
                            style={{ background: "rgba(255,255,255,0.08)", color: "#F5B82E" }}>
                            {badge}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
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
                  disabled={loading === tier.variantKey}
                  onClick={() => tier.variantKey && startCheckout(tier.variantKey, setLoading)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60"
                  style={
                    tier.featured
                      ? { background: "#F5B82E", color: "#0A0716" }
                      : { background: "#3F2B96", color: "white" }
                  }
                >
                  {loading === tier.variantKey ? "Redirecting…" : tier.cta}
                </button>
              )}
            </div>
          ))}
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
                  disabled={loading === pack.variantKey}
                  onClick={() => startCheckout(pack.variantKey, setLoading)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-[#F5B82E] hover:text-[#F5B82E] transition disabled:opacity-60"
                >
                  {loading === pack.variantKey ? "Redirecting…" : `Buy ${pack.name}`}
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
