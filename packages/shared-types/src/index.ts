export const JOB_STATUSES = [
  "created", "uploading", "queued", "preprocessing", "separating",
  "analyzing_rhythm", "analyzing_harmony", "analyzing_effects",
  "transcribing", "mastering_analysis", "packaging", "complete", "failed", "cancelled"
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export type ConfidenceFinding = { label: string; confidence: number; startSeconds?: number; endSeconds?: number; evidence: string[]; disclaimer: string };

export const JOB_WORKFLOWS = ["intelligence", "mastering_assist", "intelligence_and_mastering"] as const;
export type JobWorkflow = (typeof JOB_WORKFLOWS)[number];
export const MASTERING_PROFILES = ["balanced", "streaming", "loud", "dynamic"] as const;
export type MasteringProfile = (typeof MASTERING_PROFILES)[number];
