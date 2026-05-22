export const TIERS = ["free", "pro", "hired"] as const;
export type Tier = typeof TIERS[number];

export const LIMITS = {
  free: {
    cv_builds_lifetime: 1,
    ai_edits_monthly: 2,
    cover_letters_lifetime: 1,
  },
  pro: {
    cv_builds_monthly: 5,
    ai_edits_monthly: 15,
    cover_letters_monthly: 10,
  },
  hired: {
    cv_builds_monthly: 20,
    ai_edits_monthly: 40,
    cover_letters_monthly: 30,
  },
} as const;

export const PACK_QUANTITIES = {
  cv_pack: 3,
  edit_pack: 10,
  cover_pack: 5,
} as const;

export type PackType = keyof typeof PACK_QUANTITIES;
export type UsageKey = "cv_builds" | "ai_edits" | "cover_letters";

export const PADDLE_PRICE_IDS = {
  pro: process.env.PADDLE_PRICE_PRO!,
  hired: process.env.PADDLE_PRICE_HIRED!,
  cv_pack: process.env.PADDLE_PRICE_CV_PACK!,
  edit_pack: process.env.PADDLE_PRICE_EDIT_PACK!,
  cover_pack: process.env.PADDLE_PRICE_COVER_PACK!,
} as const;

export function getTierLabel(tier: Tier): string {
  return { free: "Free", pro: "Pro", hired: "Hired" }[tier];
}

export function getMonthlyLimit(tier: Tier, key: UsageKey): number {
  if (tier === "free") {
    if (key === "ai_edits") return LIMITS.free.ai_edits_monthly;
    return 0;
  }
  if (tier === "pro") {
    if (key === "cv_builds") return LIMITS.pro.cv_builds_monthly;
    if (key === "ai_edits") return LIMITS.pro.ai_edits_monthly;
    if (key === "cover_letters") return LIMITS.pro.cover_letters_monthly;
  }
  if (tier === "hired") {
    if (key === "cv_builds") return LIMITS.hired.cv_builds_monthly;
    if (key === "ai_edits") return LIMITS.hired.ai_edits_monthly;
    if (key === "cover_letters") return LIMITS.hired.cover_letters_monthly;
  }
  return 0;
}
