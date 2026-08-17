import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteAnalysisJobData } from "@/lib/jobs/delete-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const paramsSchema = z.object({ id: z.string().uuid() });
const ACTIVE_STATUSES = new Set([
  "created",
  "uploading",
  "queued",
  "preprocessing",
  "separating",
  "analyzing_rhythm",
  "analyzing_harmony",
  "analyzing_effects",
  "transcribing",
  "educational_analysis",
  "packaging",
]);

async function ownedJob(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, job: null };
  }
  const { data: job } = await supabase
    .from("analysis_jobs")
    .select("id,user_id,status,source_path,result_path")
    .eq("id", id)
    .maybeSingle();
  return { user, job };
}

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job identifier" }, { status: 400 });
  }
  const { user, job } = await ownedJob(parsed.data.id);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!job) {
    return NextResponse.json({ error: "Analysis job not found" }, { status: 404 });
  }
  if (!ACTIVE_STATUSES.has(job.status)) {
    return NextResponse.json({ error: "This analysis job is not currently cancellable." }, { status: 409 });
  }

  const admin = createAdminClient();
  await admin.from("analysis_jobs").update({ status: "cancelled", stage: "cancelled" }).eq("id", job.id).eq("user_id", user.id);
  await admin.from("analysis_events").insert({
    job_id: job.id,
    stage: "cancelled",
    event_type: "cancel_requested",
    payload: {},
  });
  return NextResponse.json({ id: job.id, status: "cancelled" });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job identifier" }, { status: 400 });
  }
  const { user, job } = await ownedJob(parsed.data.id);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!job) {
    return NextResponse.json({ error: "Analysis job not found" }, { status: 404 });
  }
  if (ACTIVE_STATUSES.has(job.status)) {
    return NextResponse.json({ error: "Cancel the active job first, then delete its data after processing stops." }, { status: 409 });
  }

  try {
    await deleteAnalysisJobData(job, "user_request");
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not delete analysis data.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return new NextResponse(null, { status: 204 });
}
