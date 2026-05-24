import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

function checkIsAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tier: "free", usage: null, limits: normalizeLimits("free", null), isAdmin: false });

  const isAdmin = checkIsAdmin(user.email ?? "");
  const [realTier, usage] = await Promise.all([getUserTier(user.id), getUsage(user.id)]);

  // Admin view-as override
  let tier: Tier = realTier;
  if (isAdmin) {
    const cookieStore = await cookies();
    const viewAs = cookieStore.get("admin_view_as")?.value;
    if (viewAs === "free" || viewAs === "pro" || viewAs === "hired") {
      tier = viewAs;
    }
  }

  return NextResponse.json({
    tier,
    realTier,
    usage,
    limits: normalizeLimits(tier, usage),
    isAdmin,
  });
}
