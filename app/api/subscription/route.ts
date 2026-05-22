import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserTier, getUsage } from "@/lib/usage";
import { LIMITS } from "@/lib/tiers";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tier: "free", usage: null, limits: LIMITS.free });

  const [tier, usage] = await Promise.all([getUserTier(user.id), getUsage(user.id)]);
  return NextResponse.json({ tier, usage, limits: LIMITS[tier] });
}
