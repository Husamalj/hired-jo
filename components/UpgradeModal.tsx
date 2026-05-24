"use client";
import { X, Zap, Crown } from "lucide-react";
import type { UsageKey } from "@/lib/tiers";

const LABELS: Record<UsageKey, string> = {
  cv_builds: "CV builds",
  ai_edits: "AI section edits",
  cover_letters: "cover letters",
};

const PRO_FEATURE: Record<UsageKey, string> = {
  cv_builds: "5 CVs/month",
  ai_edits: "15 edits/month",
  cover_letters: "10 cover letters/month",
};

const HIRED_FEATURE: Record<UsageKey, string> = {
  cv_builds: "20 CVs/month",
  ai_edits: "40 edits/month",
  cover_letters: "30 cover letters/month",
};

const PACK_INFO: Record<UsageKey, { name: string; qty: string; envKey: string }> = {
  cv_builds: { name: "CV Pack", qty: "3 extra CV builds", envKey: "NEXT_PUBLIC_PADDLE_PRICE_CV_PACK" },
  ai_edits: { name: "Edit Pack", qty: "10 extra AI edits", envKey: "NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK" },
  cover_letters: { name: "Cover Pack", qty: "5 extra cover letters", envKey: "NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK" },
};

interface Props {
  usageKey: UsageKey;
  onClose: () => void;
  onCheckout: (priceId: string) => void;
}

export function UpgradeModal({ usageKey, onClose, onCheckout }: Props) {
  const label = LABELS[usageKey];
  const pack = PACK_INFO[usageKey];

  const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? "";
  const hiredPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_HIRED ?? "";
  const packPriceId = usageKey === "cv_builds"
    ? process.env.NEXT_PUBLIC_PADDLE_PRICE_CV_PACK ?? ""
    : usageKey === "ai_edits"
    ? process.env.NEXT_PUBLIC_PADDLE_PRICE_EDIT_PACK ?? ""
    : process.env.NEXT_PUBLIC_PADDLE_PRICE_COVER_PACK ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0716] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-yellow-300/70 mb-2">Limit reached</p>
          <h2 className="text-xl font-bold text-white">
            You've used all your {label} this month
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Upgrade to keep going or buy a one-time pack.
          </p>
        </div>

        <div className="space-y-3">
          {/* Pro */}
          <button
            onClick={() => onCheckout(proPriceId)}
            className="w-full flex items-center justify-between rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-3.5 hover:bg-yellow-300/15 transition"
          >
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-yellow-300 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Upgrade to Pro</p>
                <p className="text-xs text-white/50">{PRO_FEATURE[usageKey]}</p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-yellow-300 shrink-0">6 JOD/mo</span>
          </button>

          {/* Hired */}
          <button
            onClick={() => onCheckout(hiredPriceId)}
            className="w-full flex items-center justify-between rounded-xl border border-purple-400/25 bg-purple-400/10 px-4 py-3.5 hover:bg-purple-400/15 transition"
          >
            <div className="flex items-center gap-3">
              <Crown size={16} className="text-purple-300 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Upgrade to Hired</p>
                <p className="text-xs text-white/50">
                  {HIRED_FEATURE[usageKey]} + badge
                </p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-purple-300 shrink-0">15 JOD/mo</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">or one-time</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Pack */}
          <button
            onClick={() => onCheckout(packPriceId)}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 hover:bg-white/8 transition"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-white">{pack.name}</p>
              <p className="text-xs text-white/50">{pack.qty} — no subscription</p>
            </div>
            <span className="text-sm font-extrabold text-white/70 shrink-0">2 JOD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
