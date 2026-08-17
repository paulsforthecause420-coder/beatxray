import { NextResponse } from "next/server";

import { deleteAnalysisJobData, TERMINAL_JOB_STATUSES } from "@/lib/jobs/delete-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_DAYS = 30;
const BATCH_SIZE = 50;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { data: jobs, error } = await admin
    .from("analysis_jobs")
    .select("id,user_id,source_path,result_path")
    .in("status", [...TERMINAL_JOB_STATUSES])
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Retention query failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ error: "Could not load expired analysis data." }, { status: 500 });
  }

  let deleted = 0;
  const failures: string[] = [];
  for (const job of jobs ?? []) {
    try {
      await deleteAnalysisJobData(job, "retention_expired");
      deleted += 1;
    } catch (caught) {
      failures.push(job.id);
      console.error("Retention deletion failed", {
        jobId: job.id,
        message: caught instanceof Error ? caught.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    cutoff,
    inspected: jobs?.length ?? 0,
    deleted,
    failed: failures.length,
  });
}
