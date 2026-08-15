export const PLAN_NAMES = ["free", "starter", "pro"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

function positiveIntegerFromEnvironment(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number.parseInt(raw, 10) : fallback;
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

/**
 * Limits are intentionally configuration-driven. These defaults are implementation
 * safeguards, not public price or feature promises; production values require owner approval.
 */
export const MONTHLY_JOB_LIMITS: Record<PlanName, number> = {
  free: positiveIntegerFromEnvironment("BEATXRAY_FREE_MONTHLY_JOB_LIMIT", 1),
  starter: positiveIntegerFromEnvironment("BEATXRAY_STARTER_MONTHLY_JOB_LIMIT", 10),
  pro: positiveIntegerFromEnvironment("BEATXRAY_PRO_MONTHLY_JOB_LIMIT", 30),
};

export const PRICE_IDS: Partial<Record<Exclude<PlanName, "free">, string>> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
};

export function isPlanName(value: string): value is PlanName {
  return (PLAN_NAMES as readonly string[]).includes(value);
}

export function monthlyJobLimit(plan: PlanName): number {
  return MONTHLY_JOB_LIMITS[plan];
}
