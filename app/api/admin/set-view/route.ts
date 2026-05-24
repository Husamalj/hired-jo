import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const VALID_TIERS = ["free", "pro", "hired", "real"] as const;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Only admin can use this
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = user.email?.toLowerCase() ?? "";
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { tier } = await req.json() as { tier: string };
  if (!VALID_TIERS.includes(tier as any)) {
    return NextResponse.json({ error: "invalid tier" }, { status: 400 });
  }

  const cookieStore = await cookies();
  if (tier === "real") {
    cookieStore.delete("admin_view_as");
  } else {
    cookieStore.set("admin_view_as", tier, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return NextResponse.json({ ok: true, tier });
}
