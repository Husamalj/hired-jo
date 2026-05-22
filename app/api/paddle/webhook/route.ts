import { NextResponse } from "next/server";
import { Paddle, Environment, EventName } from "@paddle/paddle-node-sdk";
import { createClient } from "@supabase/supabase-js";
import { applyPurchasedPack } from "@/lib/usage";
import type { PackType } from "@/lib/tiers";

export const runtime = "nodejs";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox,
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PRICE_TO_TIER: Record<string, string> = {
  [process.env.PADDLE_PRICE_PRO ?? ""]: "pro",
  [process.env.PADDLE_PRICE_HIRED ?? ""]: "hired",
};

const PRICE_TO_PACK: Record<string, PackType> = {
  [process.env.PADDLE_PRICE_CV_PACK ?? ""]: "cv_pack",
  [process.env.PADDLE_PRICE_EDIT_PACK ?? ""]: "edit_pack",
  [process.env.PADDLE_PRICE_COVER_PACK ?? ""]: "cover_pack",
};

export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature") ?? "";
  const rawBody = await req.text();

  let event: any;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  if (
    event.eventType === EventName.SubscriptionActivated ||
    event.eventType === EventName.SubscriptionUpdated
  ) {
    const sub = event.data as any;
    const userId = sub.customData?.user_id;
    const priceId = sub.items?.[0]?.price?.id ?? "";
    const tier = PRICE_TO_TIER[priceId] ?? "free";

    if (userId) {
      await supabase.from("user_subscriptions").upsert(
        {
          user_id: userId,
          paddle_subscription_id: sub.id,
          paddle_customer_id: sub.customerId,
          tier,
          status: "active",
          current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }

  if (event.eventType === EventName.SubscriptionCanceled) {
    const sub = event.data as any;
    const userId = sub.customData?.user_id;
    if (userId) {
      await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          tier: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  if (event.eventType === EventName.TransactionCompleted) {
    const tx = event.data as any;
    const userId = tx.customData?.user_id;
    const priceId = tx.items?.[0]?.price?.id ?? "";
    const packType = PRICE_TO_PACK[priceId];

    if (userId && packType) {
      await applyPurchasedPack(userId, packType);
      await supabase.from("user_purchases").insert({
        user_id: userId,
        paddle_transaction_id: tx.id,
        pack_type: packType,
        quantity: 1,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
