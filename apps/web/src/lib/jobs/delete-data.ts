import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const TERMINAL_JOB_STATUSES = ["complete", "failed", "cancelled"] as const;

type DeletableJob = {
  id: string;
  user_id: string;
  source_path: string;
  result_path: string | null;
};

export async function deleteAnalysisJobData(
  job: DeletableJob,
  reason: "user_request" | "retention_expired",
): Promise<void> {
  const admin = createAdminClient();
  const { data: artifacts, error: artifactsError } = await admin
    .from("artifacts")
    .select("storage_path")
    .eq("job_id", job.id);
  if (artifactsError) {
    throw new Error("Could not load generated analysis data.");
  }

  const resultPaths = new Set(
    [...(artifacts ?? []).map((artifact) => artifact.storage_path), job.result_path].filter(
      (path): path is string => Boolean(path),
    ),
  );
  if (resultPaths.size) {
    const { error } = await admin.storage.from("analysis-results").remove([...resultPaths]);
    if (error) {
      throw new Error("Could not remove generated analysis data.");
    }
  }

  const { error: sourceError } = await admin.storage.from("song-uploads").remove([job.source_path]);
  if (sourceError) {
    throw new Error("Could not remove the original upload.");
  }

  const { error: deleteError } = await admin
    .from("analysis_jobs")
    .delete()
    .eq("id", job.id)
    .eq("user_id", job.user_id);
  if (deleteError) {
    throw new Error("Could not delete analysis records.");
  }

  await admin.from("audit_log").insert({
    actor_id: reason === "user_request" ? job.user_id : null,
    action: reason === "user_request" ? "analysis_data_deleted" : "analysis_data_retention_deleted",
    target_type: "analysis_job",
    target_id: job.id,
    metadata: { reason },
  });
}
