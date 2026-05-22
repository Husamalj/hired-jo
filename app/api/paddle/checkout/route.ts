import { NextResponse } from "next/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox,
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  try {
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: user.id } as any,
      customer: { email: user.email! },
    });
    return NextResponse.json({ checkoutUrl: (transaction as any).checkout?.url ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
