import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const LMS_API = "https://api.lemonsqueezy.com/v1";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { variantId } = await req.json();
  if (!variantId)
    return NextResponse.json({ error: "Missing variantId" }, { status: 400 });

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: { user_id: user.id },
          email: user.email,
        },
        product_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiredjo.com"}/pricing?success=1`,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: String(process.env.LEMONSQUEEZY_STORE_ID) },
        },
        variant: {
          data: { type: "variants", id: String(variantId) },
        },
      },
    },
  };

  const res = await fetch(`${LMS_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const json = await res.json();
  const checkoutUrl = json.data?.attributes?.url ?? null;
  return NextResponse.json({ checkoutUrl });
}
