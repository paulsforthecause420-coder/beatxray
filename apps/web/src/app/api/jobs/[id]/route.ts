import { NextResponse } from "next/server";
import { z } from "zod";

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

  const admin = createAdminClient();
  const { data: artifacts } = await admin.from("artifacts").select("storage_path").eq("job_id", job.id);
  const resultPaths = new Set([...(artifacts ?? []).map((artifact) => artifact.storage_path), job.result_path].filter(Boolean));
  if (resultPaths.size) {
    const { error } = await admin.storage.from("analysis-results").remove([...resultPaths]);
    if (error) {
      return NextResponse.json({ error: "Could not remove generated analysis data." }, { status: 502 });
    }
  }
  const { error: sourceError } = await admin.storage.from("song-uploads").remove([job.source_path]);
  if (sourceError) {
    return NextResponse.json({ error: "Could not remove the original upload." }, { status: 502 });
  }

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "analysis_data_deleted",
    target_type: "analysis_job",
    target_id: job.id,
    metadata: {},
  });
  const { error: deleteError } = await admin.from("analysis_jobs").delete().eq("id", job.id).eq("user_id", user.id);
  if (deleteError) {
    return NextResponse.json({ error: "Could not delete analysis records." }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
