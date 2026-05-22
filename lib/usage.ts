import { createClient } from "@supabase/supabase-js";
import type { Tier, UsageKey, PackType } from "./tiers";
import { LIMITS, PACK_QUANTITIES } from "./tiers";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();
  if (!data || data.status !== "active") return "free";
  return (data.tier as Tier) ?? "free";
}

export async function getUsage(userId: string) {
  const supabase = getServiceClient();
  const period = currentPeriod();
  const { data } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period", period)
    .single();
  return data ?? {
    cv_builds: 0,
    ai_edits: 0,
    cover_letters: 0,
    cv_builds_lifetime: 0,
    cover_letters_lifetime: 0,
    ai_edits_bonus: 0,
    cv_builds_bonus: 0,
    cover_letters_bonus: 0,
  };
}

export async function checkLimit(
  userId: string,
  key: UsageKey
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const [tier, usage] = await Promise.all([getUserTier(userId), getUsage(userId)]);

  if (tier === "free") {
    if (key === "cv_builds") {
      const lifetime = (usage.cv_builds_lifetime ?? 0) + (usage.cv_builds_bonus ?? 0);
      const limit = LIMITS.free.cv_builds_lifetime;
      return { allowed: lifetime < limit, remaining: Math.max(0, limit - lifetime), limit };
    }
    if (key === "ai_edits") {
      const used = usage.ai_edits ?? 0;
      const bonus = usage.ai_edits_bonus ?? 0;
      const limit = LIMITS.free.ai_edits_monthly;
      const total = limit + bonus;
      return { allowed: used < total, remaining: Math.max(0, total - used), limit: total };
    }
    if (key === "cover_letters") {
      const lifetime = (usage.cover_letters_lifetime ?? 0) + (usage.cover_letters_bonus ?? 0);
      const limit = LIMITS.free.cover_letters_lifetime;
      return { allowed: lifetime < limit, remaining: Math.max(0, limit - lifetime), limit };
    }
  }

  if (tier === "pro" || tier === "hired") {
    const limits = tier === "pro" ? LIMITS.pro : LIMITS.hired;
    const monthlyLimit = key === "cv_builds"
      ? limits.cv_builds_monthly
      : key === "ai_edits"
      ? limits.ai_edits_monthly
      : limits.cover_letters_monthly;
    const bonus = key === "cv_builds"
      ? (usage.cv_builds_bonus ?? 0)
      : key === "ai_edits"
      ? (usage.ai_edits_bonus ?? 0)
      : (usage.cover_letters_bonus ?? 0);
    const used = usage[key] ?? 0;
    const total = monthlyLimit + bonus;
    return { allowed: used < total, remaining: Math.max(0, total - used), limit: total };
  }

  return { allowed: false, remaining: 0, limit: 0 };
}

export async function incrementUsage(userId: string, key: UsageKey): Promise<void> {
  const supabase = getServiceClient();
  const period = currentPeriod();
  const existing = await getUsage(userId);

  const updates: Record<string, number> = { [key]: ((existing as any)[key] ?? 0) + 1 };
  if (key === "cv_builds") updates.cv_builds_lifetime = (existing.cv_builds_lifetime ?? 0) + 1;
  if (key === "cover_letters") updates.cover_letters_lifetime = (existing.cover_letters_lifetime ?? 0) + 1;

  await supabase.from("user_usage").upsert({
    user_id: userId,
    period,
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,period" });
}

export async function applyPurchasedPack(userId: string, packType: PackType): Promise<void> {
  const supabase = getServiceClient();
  const period = currentPeriod();
  const qty = PACK_QUANTITIES[packType];
  const existing = await getUsage(userId);

  const bonusKey = packType === "cv_pack"
    ? "cv_builds_bonus"
    : packType === "edit_pack"
    ? "ai_edits_bonus"
    : "cover_letters_bonus";

  await supabase.from("user_usage").upsert({
    user_id: userId,
    period,
    ...existing,
    [bonusKey]: ((existing as any)[bonusKey] ?? 0) + qty,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,period" });
}
