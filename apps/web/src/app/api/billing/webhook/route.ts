import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/billing/service";
import { isPlanName, PRICE_IDS, type PlanName } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function planForSubscription(subscription: Stripe.Subscription): PlanName {
  const metadataPlan = subscription.metadata.beatxray_plan;
  if (metadataPlan && isPlanName(metadataPlan)) {
    return metadataPlan;
  }
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId === PRICE_IDS.starter) {
    return "starter";
  }
  if (priceId === PRICE_IDS.pro) {
    return "pro";
  }
  return "free";
}

async function userIdForSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const metadataUserId = subscription.metadata.beatxray_user_id;
  if (metadataUserId) {
    return metadataUserId;
  }
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function synchronizeSubscription(subscription: Stripe.Subscription) {
  const userId = await userIdForSubscription(subscription);
  if (!userId) {
    return;
  }
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const periodEndEpoch = subscription.items.data.reduce(
    (latest, item) => Math.max(latest, item.current_period_end ?? 0),
    0,
  );
  const currentPeriodEnd = periodEndEpoch ? new Date(periodEndEpoch * 1000).toISOString() : null;
  await createAdminClient().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan: planForSubscription(subscription),
      status: subscription.status,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "user_id" },
  );
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook signature configuration is missing." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("webhook_events")
    .select("id,status")
    .eq("provider", "stripe")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const payloadHash = createHash("sha256").update(payload).digest("hex");
  const { error: receivedError } = await admin.from("webhook_events").insert({
    provider: "stripe",
    event_id: event.id,
    type: event.type,
    status: "received",
    payload_hash: payloadHash,
  });
  if (receivedError) {
    return NextResponse.json({ error: "Could not record webhook receipt." }, { status: 500 });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await synchronizeSubscription(event.data.object as Stripe.Subscription);
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await synchronizeSubscription(subscription);
      }
    }
    await admin.from("webhook_events").update({ status: "processed" }).eq("provider", "stripe").eq("event_id", event.id);
    return NextResponse.json({ received: true });
  } catch {
    await admin.from("webhook_events").update({ status: "failed" }).eq("provider", "stripe").eq("event_id", event.id);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
