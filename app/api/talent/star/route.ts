import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  const sb = getServiceClient();

  const { data: existing } = await sb
    .from("talent_stars")
    .select("id")
    .eq("user_id", user.id)
    .eq("starred_user_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await sb.from("talent_stars").delete().eq("id", existing.id);
    await sb.rpc("decrement_stars", { target_user_id: targetUserId as string });
  } else {
    await sb.from("talent_stars").insert({ user_id: user.id, starred_user_id: targetUserId });
    await sb.rpc("increment_stars", { target_user_id: targetUserId as string });
  }

  const { data: profile } = await sb
    .from("talent_profiles")
    .select("stars")
    .eq("user_id", targetUserId)
    .maybeSingle();

  return NextResponse.json({ starred: !existing, stars: profile?.stars ?? 0 });
}
