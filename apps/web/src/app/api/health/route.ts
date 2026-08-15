import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const REQUIRED_CONFIGURATION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "WORKER_WEBHOOK_URL",
  "WORKER_WEBHOOK_SECRET",
] as const;

export async function GET() {
  const configured = REQUIRED_CONFIGURATION.every((name) => Boolean(process.env[name]));
  if (!configured) {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const { error } = await createAdminClient().from("analysis_jobs").select("id", { head: true, count: "exact" }).limit(1);
    if (error) {
      throw error;
    }
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
