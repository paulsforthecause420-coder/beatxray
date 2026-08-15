"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/mp4",
  "audio/aiff",
  "audio/x-aiff",
]);

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [daw, setDaw] = useState("flstudio");
  const [authorizedUse, setAuthorizedUse] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  function chooseFile(nextFile: File | null) {
    setError("");
    setNotice("");
    if (!nextFile) {
      setFile(null);
      setIdempotencyKey(null);
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setIdempotencyKey(null);
      setError("Audio files must be 250 MB or smaller.");
      return;
    }
    if (!ACCEPTED_MIME_TYPES.has(nextFile.type)) {
      setFile(null);
      setIdempotencyKey(null);
      setError("Use a WAV, MP3, FLAC, M4A, or AIFF audio file.");
      return;
    }
    setFile(nextFile);
    setIdempotencyKey(crypto.randomUUID());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !idempotencyKey || !authorizedUse) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please sign in again.");
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${crypto.randomUUID()}/${safeName}`;
      const upload = await supabase.storage.from("song-uploads").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upload.error) {
        throw upload.error;
      }
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storagePath: path,
          originalFilename: file.name,
          daw,
          fileSize: file.size,
          mimeType: file.type,
          idempotencyKey,
        }),
      });
      const body = await response.json();
      if (!response.ok && response.status !== 202) {
        throw new Error(body.error || "Could not create an analysis job.");
      }
      if (body.retryable) {
        setNotice("Your upload is saved, but processing is temporarily unavailable. You can retry the job from your session list.");
      } else {
        setNotice(body.reused ? "Your existing analysis job is already available." : "Your X-Ray session is queued for analysis.");
        setFile(null);
        setAuthorizedUse(false);
        setIdempotencyKey(null);
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="upload form" onSubmit={submit}>
      <div>
        <strong>Upload a song for analysis</strong>
        <div className="notice">MVP limit: 250 MB. Your upload remains private to your account.</div>
      </div>
      <label className="label">
        Audio file
        <input
          className="input"
          type="file"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/mp4,audio/aiff,audio/x-aiff,.wav,.mp3,.flac,.m4a,.aiff,.aif"
          required
          onChange={(event) => chooseFile(event.target.files?.[0] || null)}
        />
      </label>
      <label className="label">
        Target DAW
        <select className="select" value={daw} onChange={(event) => setDaw(event.target.value)}>
          <option value="flstudio">FL Studio</option>
          <option value="ableton">Ableton Live</option>
        </select>
      </label>
      <label className="notice" style={{ display: "flex", alignItems: "start", gap: 8 }}>
        <input type="checkbox" checked={authorizedUse} onChange={(event) => setAuthorizedUse(event.target.checked)} required />
        <span>I own this audio or have authorization to analyze it for educational use.</span>
      </label>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}
      <button className="btn primary" disabled={busy || !file || !authorizedUse}>
        {busy ? "Uploading…" : "Start X-Ray"}
      </button>
    </form>
  );
}
