"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JobActionsProps = {
  jobId: string;
  status: string;
  hasResult: boolean;
};

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

export default function JobActions({ jobId, status, hasResult }: JobActionsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const retryable = status === "created" || status === "failed";
  const active = ACTIVE_STATUSES.has(status);

  async function request(path: string, method: "POST" | "PATCH" | "DELETE", action: string) {
    setBusy(action);
    setMessage("");
    try {
      const response = await fetch(path, { method });
      if (response.status === 204) {
        router.refresh();
        return;
      }
      const body = await response.json();
      if (!response.ok && response.status !== 202) {
        throw new Error(body.error || `Could not ${action.toLowerCase()} this analysis job.`);
      }
      setMessage(body.retryable ? "Processing is still unavailable. Please try again shortly." : `${action} requested.`);
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : `Could not ${action.toLowerCase()} this analysis job.`);
    } finally {
      setBusy(null);
    }
  }

  async function retry() {
    await request(`/api/jobs/${jobId}/retry`, "POST", "Retry");
  }

  async function cancel() {
    await request(`/api/jobs/${jobId}`, "PATCH", "Cancellation");
  }

  async function deleteData() {
    if (!window.confirm("Permanently delete this upload, generated artifacts, and analysis record? This cannot be undone.")) {
      return;
    }
    await request(`/api/jobs/${jobId}`, "DELETE", "Deletion");
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
      {hasResult && (
        <a className="btn primary" href={`/api/jobs/${jobId}/download`}>
          Download
        </a>
      )}
      {retryable && (
        <button className="btn" type="button" disabled={busy !== null} onClick={retry}>
          {busy === "Retry" ? "Retrying…" : "Retry analysis"}
        </button>
      )}
      {active && (
        <button className="btn" type="button" disabled={busy !== null} onClick={cancel}>
          {busy === "Cancellation" ? "Cancelling…" : "Cancel"}
        </button>
      )}
      {!active && (
        <button className="btn" type="button" disabled={busy !== null} onClick={deleteData}>
          {busy === "Deletion" ? "Deleting…" : "Delete data"}
        </button>
      )}
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
