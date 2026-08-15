import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripe, siteOrigin, subscriptionForUser } from "@/lib/billing/service";
import { PRICE_IDS, type PlanName } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ plan: z.enum(["starter", "pro"]) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid subscription plan." }, { status: 400 });
  }
  const plan: Exclude<PlanName, "free"> = parsed.data.plan;
  const price = PRICE_IDS[plan];
  if (!price) {
    return NextResponse.json({ error: "This plan is not configured for checkout yet." }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const existingSubscription = await subscriptionForUser(user.id);
    let customerId = existingSubscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { beatxray_user_id: user.id },
      });
      customerId = customer.id;
      await createAdminClient().from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: "free",
          status: "inactive",
        },
        { onConflict: "user_id" },
      );
    }

    const origin = siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      metadata: { beatxray_user_id: user.id, plan },
      subscription_data: { metadata: { beatxray_user_id: user.id, plan } },
    });
    if (!session.url) {
      throw new Error("Stripe did not provide a Checkout URL.");
    }
    return NextResponse.json({ url: session.url });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not start secure checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
