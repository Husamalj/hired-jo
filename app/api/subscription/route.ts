import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserTier, getUsage } from "@/lib/usage";
import { getMonthlyLimit } from "@/lib/tiers";
import type { Tier } from "@/lib/tiers";

export const runtime = "nodejs";

function normalizeLimits(tier: Tier, usage: any) {
  const base = {
    cv_builds: getMonthlyLimit(tier, "cv_builds") || (tier === "free" ? 1 : 0),
    ai_edits: getMonthlyLimit(tier, "ai_edits"),
    cover_letters: getMonthlyLimit(tier, "cover_letters") || (tier === "free" ? 1 : 0),
  };
  return {
    cv_builds: base.cv_builds + (usage?.cv_builds_bonus ?? 0),
    ai_edits: base.ai_edits + (usage?.ai_edits_bonus ?? 0),
    cover_letters: base.cover_letters + (usage?.cover_letters_bonus ?? 0),
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tier: "free", usage: null, limits: normalizeLimits("free", null) });

  const [tier, usage] = await Promise.all([getUserTier(user.id), getUsage(user.id)]);
  return NextResponse.json({ tier, usage, limits: normalizeLimits(tier, usage) });
}
