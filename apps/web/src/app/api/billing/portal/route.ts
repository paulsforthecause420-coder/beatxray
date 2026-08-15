import { NextResponse } from "next/server";

import { getStripe, siteOrigin, subscriptionForUser } from "@/lib/billing/service";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await subscriptionForUser(user.id);
    if (!subscription.stripeCustomerId) {
      return NextResponse.json({ error: "No billing profile is available for this account." }, { status: 404 });
    }
    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${siteOrigin()}/dashboard`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not open the billing portal.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
