import { NextResponse } from "next/server";
import { z } from "zod";

import { dispatchJob } from "@/lib/jobs/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const paramsSchema = z.object({ id: z.string().uuid() });
const RETRYABLE_STATUSES = new Set(["created", "failed"]);

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid job identifier" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("analysis_jobs")
    .select("id,status,retry_count")
    .eq("id", parsedParams.data.id)
    .maybeSingle();
  if (error || !job) {
    return NextResponse.json({ error: "Analysis job not found" }, { status: 404 });
  }
  if (!RETRYABLE_STATUSES.has(job.status)) {
    return NextResponse.json({ error: "This analysis job cannot be retried in its current state." }, { status: 409 });
  }

  const admin = createAdminClient();
  const nextRetryCount = (job.retry_count ?? 0) + 1;
  await admin
    .from("analysis_jobs")
    .update({
      status: "queued",
      stage: "queued",
      progress: 1,
      retry_count: nextRetryCount,
      error_code: null,
      error_message: null,
    })
    .eq("id", job.id)
    .eq("user_id", user.id);
  await admin.from("analysis_events").insert({
    job_id: job.id,
    stage: "queued",
    event_type: "retry_requested",
    payload: { retry_count: nextRetryCount },
  });

  const dispatch = await dispatchJob(job.id);
  if (!dispatch.ok) {
    await admin
      .from("analysis_jobs")
      .update({ status: "created", stage: "created", error_code: "DispatchUnavailable", error_message: dispatch.error })
      .eq("id", job.id)
      .eq("user_id", user.id);
    await admin.from("analysis_events").insert({
      job_id: job.id,
      stage: "created",
      event_type: "retry_dispatch_failed",
      payload: {},
    });
    return NextResponse.json({ id: job.id, status: "created", retryable: true }, { status: 202 });
  }

  await admin.from("analysis_events").insert({
    job_id: job.id,
    stage: "queued",
    event_type: "retry_dispatched",
    payload: {},
  });
  return NextResponse.json({ id: job.id, status: "queued" }, { status: 202 });
}
