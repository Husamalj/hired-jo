import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyPurchasedPack } from "@/lib/usage";
import type { PackType } from "@/lib/tiers";
import crypto from "crypto";

export const runtime = "nodejs";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VARIANT_TO_TIER: Record<string, string> = {
  [process.env.LMS_VARIANT_PRO ?? ""]: "pro",
  [process.env.LMS_VARIANT_HIRED ?? ""]: "hired",
};

const VARIANT_TO_PACK: Record<string, PackType> = {
  [process.env.LMS_VARIANT_CV_PACK ?? ""]: "cv_pack",
  [process.env.LMS_VARIANT_EDIT_PACK ?? ""]: "edit_pack",
  [process.env.LMS_VARIANT_COVER_PACK ?? ""]: "cover_pack",
};

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return digest === signature;
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.meta?.event_name ?? "";
  const data = event.data ?? {};
  const attrs = data.attributes ?? {};
  const userId: string = event.meta?.custom_data?.user_id ?? "";
  const variantId: string = String(attrs.variant_id ?? attrs.first_subscription_item?.variant_id ?? "");

  const supabase = getServiceClient();

  // Subscription activated or updated
  if (
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_resumed"
  ) {
    const tier = VARIANT_TO_TIER[variantId] ?? "free";
    if (userId) {
      await supabase.from("user_subscriptions").upsert(
        {
          user_id: userId,
          paddle_subscription_id: String(data.id), // reusing column for LMS sub id
          paddle_customer_id: String(attrs.customer_id),
          tier,
          status: "active",
          current_period_end: attrs.renews_at ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }

  // Subscription cancelled or expired
  if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
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

  // One-time purchase (credit packs)
  if (eventName === "order_created") {
    const orderVariantId = String(attrs.first_order_item?.variant_id ?? variantId);
    const packType = VARIANT_TO_PACK[orderVariantId];
    if (userId && packType) {
      await applyPurchasedPack(userId, packType);
      await supabase.from("user_purchases").insert({
        user_id: userId,
        paddle_transaction_id: String(data.id),
        pack_type: packType,
        quantity: 1,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
