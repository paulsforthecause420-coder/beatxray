export const JOB_STATUSES = [
  "created", "uploading", "queued", "preprocessing", "separating",
  "analyzing_rhythm", "analyzing_harmony", "analyzing_effects",
  "transcribing", "packaging", "complete", "failed", "cancelled"
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export type ConfidenceFinding = { label: string; confidence: number; startSeconds?: number; endSeconds?: number; evidence: string[]; disclaimer: string };
