import { NextResponse } from "next/server";
import { z } from "zod";

import { assertJobEntitlement, recordJobUsage } from "@/lib/billing/service";
import { dispatchJob } from "@/lib/jobs/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/mp4",
  "audio/aiff",
  "audio/x-aiff",
]);

const schema = z.object({
  storagePath: z.string().min(3).max(1024),
  originalFilename: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine((name) => !/[\u0000-\u001f]/.test(name), "Invalid filename"),
  daw: z.enum(["flstudio", "ableton"]),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  mimeType: z.string().min(1).max(120),
  idempotencyKey: z.string().uuid(),
});

type UploadObject = {
  name: string;
  metadata?: { size?: number | string; mimetype?: string | null } | null;
};

function objectAtPath(storagePath: string, userId: string): { folder: string; filename: string } | null {
  const parts = storagePath.split("/");
  if (parts.length !== 3 || parts[0] !== userId || !parts[1] || !parts[2]) {
    return null;
  }
  return { folder: `${parts[0]}/${parts[1]}`, filename: parts[2] };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !ALLOWED_MIME_TYPES.has(parsed.data?.mimeType ?? "")) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }
  const path = objectAtPath(parsed.data.storagePath, user.id);
  if (!path) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: listed, error: storageError } = await admin.storage
    .from("song-uploads")
    .list(path.folder, { limit: 10, search: path.filename });
  const uploadedObject = (listed as UploadObject[] | null)?.find((item) => item.name === path.filename);
  const storedSize = Number(uploadedObject?.metadata?.size ?? NaN);
  const storedMimeType = uploadedObject?.metadata?.mimetype ?? "";
  if (
    storageError ||
    !uploadedObject ||
    !Number.isFinite(storedSize) ||
    storedSize !== parsed.data.fileSize ||
    !ALLOWED_MIME_TYPES.has(storedMimeType)
  ) {
    return NextResponse.json({ error: "The uploaded audio could not be verified." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("analysis_jobs")
    .select("id,status")
    .eq("idempotency_key", parsed.data.idempotencyKey)
    .maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: "Could not check for an existing job." }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status, reused: true }, { status: 200 });
  }

  let entitlement: Awaited<ReturnType<typeof assertJobEntitlement>>;
  try {
    entitlement = await assertJobEntitlement(user.id);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not verify plan access.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const { data: job, error: createError } = await supabase
    .from("analysis_jobs")
    .insert({
      user_id: user.id,
      source_path: parsed.data.storagePath,
      original_filename: parsed.data.originalFilename,
      daw: parsed.data.daw,
      file_size: storedSize,
      mime_type: storedMimeType,
      idempotency_key: parsed.data.idempotencyKey,
      status: "created",
      stage: "created",
      progress: 0,
    })
    .select("id")
    .single();
  if (createError) {
    if (createError.code === "23505") {
      const { data: racedJob } = await supabase
        .from("analysis_jobs")
        .select("id,status")
        .eq("idempotency_key", parsed.data.idempotencyKey)
        .maybeSingle();
      if (racedJob) {
        return NextResponse.json({ id: racedJob.id, status: racedJob.status, reused: true }, { status: 200 });
      }
    }
    return NextResponse.json({ error: "Could not create the analysis job." }, { status: 500 });
  }

  try {
    await recordJobUsage(user.id, job.id, entitlement.plan);
  } catch {
    await admin.from("analysis_jobs").delete().eq("id", job.id);
    return NextResponse.json({ error: "Could not reserve plan usage for this job." }, { status: 500 });
  }

  await admin.from("analysis_events").insert({
    job_id: job.id,
    stage: "created",
    event_type: "job_created",
    payload: { file_size: storedSize, mime_type: storedMimeType },
  });
  const dispatch = await dispatchJob(job.id);
  if (!dispatch.ok) {
    await admin
      .from("analysis_jobs")
      .update({ status: "created", stage: "created", error_code: "DispatchUnavailable", error_message: dispatch.error })
      .eq("id", job.id);
    await admin.from("analysis_events").insert({
      job_id: job.id,
      stage: "created",
      event_type: "dispatch_failed",
      payload: {},
    });
    return NextResponse.json({ id: job.id, status: "created", retryable: true }, { status: 202 });
  }

  await admin.from("analysis_jobs").update({ status: "queued", stage: "queued", progress: 1 }).eq("id", job.id);
  await admin.from("analysis_events").insert({
    job_id: job.id,
    stage: "queued",
    event_type: "dispatch_accepted",
    payload: {},
  });
  return NextResponse.json({ id: job.id, status: "queued" }, { status: 201 });
}
