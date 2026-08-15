import "server-only";

export type DispatchResult = { ok: true } | { ok: false; error: string };

/** Dispatch a job to the authenticated worker without exposing the shared secret to browsers. */
export async function dispatchJob(jobId: string): Promise<DispatchResult> {
  const workerUrl = process.env.WORKER_WEBHOOK_URL;
  const workerSecret = process.env.WORKER_WEBHOOK_SECRET;
  if (!workerUrl || !workerSecret) {
    return { ok: false, error: "The processing service is not configured." };
  }

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-beatxray-secret": workerSecret,
      },
      body: JSON.stringify({ jobId }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, error: `The processing service returned HTTP ${response.status}.` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "The processing service could not be reached. You can retry this job." };
  }
}
