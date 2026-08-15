import "server-only";

import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanName, monthlyJobLimit, type PlanName } from "./plans";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type SubscriptionSnapshot = {
  plan: PlanName;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Stripe is not configured.");
  }
  return new Stripe(apiKey);
}

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }
  return new URL(raw).origin;
}

export async function subscriptionForUser(userId: string): Promise<SubscriptionSnapshot> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("plan,status,stripe_customer_id,stripe_subscription_id,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error("Could not load subscription status.");
  }
  const plan = data && isPlanName(data.plan) ? data.plan : "free";
  return {
    plan: ACTIVE_SUBSCRIPTION_STATUSES.has(data?.status ?? "") ? plan : "free",
    status: data?.status ?? "inactive",
    stripeCustomerId: data?.stripe_customer_id ?? null,
    stripeSubscriptionId: data?.stripe_subscription_id ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
  };
}

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function entitlementForUser(userId: string): Promise<{
  plan: PlanName;
  status: string;
  used: number;
  limit: number;
  remaining: number;
}> {
  const [subscription, ledger] = await Promise.all([
    subscriptionForUser(userId),
    createAdminClient()
      .from("usage_ledger")
      .select("quantity")
      .eq("user_id", userId)
      .eq("unit", "analysis_job")
      .gte("created_at", monthStartIso()),
  ]);
  if (ledger.error) {
    throw new Error("Could not load current usage.");
  }
  const used = (ledger.data ?? []).reduce((total, entry) => total + Number(entry.quantity ?? 0), 0);
  const limit = monthlyJobLimit(subscription.plan);
  return { plan: subscription.plan, status: subscription.status, used, limit, remaining: Math.max(0, limit - used) };
}

export async function assertJobEntitlement(userId: string): Promise<ReturnType<typeof entitlementForUser>> {
  const entitlement = await entitlementForUser(userId);
  if (entitlement.remaining < 1) {
    throw new Error("Your monthly analysis limit has been reached. Manage billing to continue.");
  }
  return entitlement;
}

export async function recordJobUsage(userId: string, jobId: string, plan: PlanName): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("usage_ledger").insert({
    user_id: userId,
    job_id: jobId,
    quantity: 1,
    unit: "analysis_job",
    reason: `analysis_job:${plan}`,
    idempotency_key: `analysis-job:${jobId}`,
  });
  if (error && error.code !== "23505") {
    throw new Error("Could not record analysis usage.");
  }
}
