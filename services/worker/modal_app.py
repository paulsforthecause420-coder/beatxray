"""BeatXray checkpointed audio-processing worker.

The CPU coordinator persists every durable result to private Supabase Storage and the
``artifacts`` table. GPU capacity is reserved for Demucs stem separation; analysis,
transcription, educational guidance, database work, and packaging run on CPU.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import modal
from fastapi import Header, HTTPException

app = modal.App("beatxray-worker")

image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04", add_python="3.11")
    .entrypoint([])
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir("beatxray", remote_path="/root/beatxray")
)

secret = modal.Secret.from_name("beatxray-secrets")
ARTIFACT_BUCKET = "analysis-results"
SCHEMA_VERSION = "org.zerohype.beatxray.reconstruction/v1"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _client() -> Any:
    from supabase import create_client

    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])


def _job(sb: Any, job_id: str) -> dict[str, Any]:
    result = sb.table("analysis_jobs").select("*").eq("id", job_id).single().execute().data
    if not result:
        raise RuntimeError(f"Unknown analysis job: {job_id}")
    return result


def _event(sb: Any, job_id: str, stage: str, event_type: str, payload: dict[str, Any] | None = None) -> None:
    sb.table("analysis_events").insert(
        {
            "job_id": job_id,
            "stage": stage,
            "event_type": event_type,
            "payload": payload or {},
        }
    ).execute()


def _update_job(sb: Any, job_id: str, **values: Any) -> None:
    sb.table("analysis_jobs").update(values).eq("id", job_id).execute()


def _set_stage(
    sb: Any,
    job_id: str,
    stage: str,
    progress: int,
    *,
    event_type: str = "stage_started",
    payload: dict[str, Any] | None = None,
    **extra: Any,
) -> None:
    values = {"status": stage, "stage": stage, "progress": progress, **extra}
    _update_job(sb, job_id, **values)
    _event(sb, job_id, stage, event_type, {"progress": progress, **(payload or {})})


def _artifact_path(job: dict[str, Any], relative_path: str) -> str:
    return f"{job['user_id']}/{job['id']}/{relative_path.lstrip('/')}"


def _artifacts(sb: Any, job_id: str) -> dict[str, dict[str, Any]]:
    records = sb.table("artifacts").select("*").eq("job_id", job_id).order("created_at", desc=True).execute().data or []
    by_type: dict[str, dict[str, Any]] = {}
    for record in records:
        by_type.setdefault(record["type"], record)
    return by_type


def _store_artifact(
    sb: Any,
    job: dict[str, Any],
    artifact_type: str,
    relative_path: str,
    content: bytes,
    content_type: str,
) -> str:
    destination = _artifact_path(job, relative_path)
    sb.storage.from_(ARTIFACT_BUCKET).upload(
        destination,
        content,
        {"content-type": content_type, "upsert": "true"},
    )
    checksum = hashlib.sha256(content).hexdigest()
    existing = (
        sb.table("artifacts")
        .select("id")
        .eq("job_id", job["id"])
        .eq("type", artifact_type)
        .limit(1)
        .execute()
        .data
        or []
    )
    values = {
        "storage_path": destination,
        "size_bytes": len(content),
        "checksum": checksum,
    }
    if existing:
        sb.table("artifacts").update(values).eq("id", existing[0]["id"]).execute()
    else:
        sb.table("artifacts").insert({"job_id": job["id"], "type": artifact_type, **values}).execute()
    return destination


def _load_json_artifact(sb: Any, artifact: dict[str, Any]) -> dict[str, Any]:
    return json.loads(sb.storage.from_(ARTIFACT_BUCKET).download(artifact["storage_path"]))


def _assert_not_cancelled(sb: Any, job_id: str) -> None:
    status = sb.table("analysis_jobs").select("status").eq("id", job_id).single().execute().data
    if status and status["status"] == "cancelled":
        _event(sb, job_id, "cancelled", "processing_stopped", {})
        raise RuntimeError("Job was cancelled")


def _educational_explanation(analysis: dict[str, Any]) -> dict[str, Any]:
    key = analysis.get("key", {})
    meter = analysis.get("time_signature", {})
    tempo = analysis.get("tempo_bpm")
    sections = analysis.get("sections", [])
    chords = analysis.get("chords", [])
    return {
        "summary": (
            f"This rendered mix is estimated at {tempo} BPM in {key.get('name', 'an undetermined key')} "
            f"with an estimated {meter.get('numerator', 4)}/{meter.get('denominator', 4)} meter."
        ),
        "arrangement_guidance": (
            f"The analysis detected {len(sections)} arrangement sections. Import the stems into your DAW, "
            "place section markers first, and compare energy changes between drums, bass, vocals, and the other stem."
        ),
        "harmony_guidance": (
            f"The chord pass contains {len(chords)} estimated windows. Treat it as a learning reference, "
            "then audition and correct notes by ear rather than assuming it reproduces the original session."
        ),
        "limitations": (
            "All findings are estimates from rendered audio. BeatXray does not recover an original plugin chain, "
            "mix session, or proprietary production decisions."
        ),
    }


def _package_export(
    sb: Any,
    job: dict[str, Any],
    analysis: dict[str, Any],
    education: dict[str, Any],
    artifacts: dict[str, dict[str, Any]],
) -> bytes:
    from beatxray.exporters import export_ableton, export_fl_studio

    with tempfile.TemporaryDirectory(prefix="beatxray-package-") as temporary_directory:
        work = Path(temporary_directory)
        package = work / "BeatXray"
        stems_folder = package / "Audio" / "Stems"
        midi_folder = package / "MIDI"
        analysis_folder = package / "Analysis"
        reference_folder = package / "Reference"
        for folder in (stems_folder, midi_folder, analysis_folder, reference_folder):
            folder.mkdir(parents=True, exist_ok=True)

        source_suffix = Path(job["original_filename"]).suffix.lower() or ".audio"
        (reference_folder / f"source{source_suffix}").write_bytes(
            sb.storage.from_("song-uploads").download(job["source_path"])
        )
        tracks: list[dict[str, Any]] = []
        for stem_name in ("drums", "bass", "vocals", "other"):
            artifact = artifacts.get(f"stem-{stem_name}")
            if not artifact:
                continue
            destination = stems_folder / f"{stem_name}.wav"
            destination.write_bytes(sb.storage.from_(ARTIFACT_BUCKET).download(artifact["storage_path"]))
            tracks.append(
                {
                    "name": stem_name.title(),
                    "type": "audio",
                    "role": stem_name,
                    "file": f"Audio/Stems/{destination.name}",
                    "timeline_start_seconds": 0.0,
                }
            )
        for midi_name in ("bass", "vocals", "instrumental"):
            artifact = artifacts.get(f"midi-{midi_name}")
            if not artifact:
                continue
            destination = midi_folder / f"{midi_name}.mid"
            destination.write_bytes(sb.storage.from_(ARTIFACT_BUCKET).download(artifact["storage_path"]))
            tracks.append(
                {
                    "name": f"{midi_name.title()} MIDI",
                    "type": "midi",
                    "role": midi_name,
                    "file": f"MIDI/{destination.name}",
                    "timeline_start_seconds": 0.0,
                }
            )

        (analysis_folder / "full-analysis.json").write_text(json.dumps(analysis, indent=2), encoding="utf-8")
        (analysis_folder / "education.json").write_text(json.dumps(education, indent=2), encoding="utf-8")
        (analysis_folder / "sections.json").write_text(json.dumps(analysis.get("sections", []), indent=2), encoding="utf-8")
        (analysis_folder / "chords.json").write_text(json.dumps(analysis.get("chords", []), indent=2), encoding="utf-8")
        (analysis_folder / "beat-grid.json").write_text(
            json.dumps(analysis.get("beat_grid_seconds", []), indent=2), encoding="utf-8"
        )

        exporter = export_fl_studio if job["daw"] == "flstudio" else export_ableton
        exporter(package, analysis, tracks)
        manifest = {
            "schema": SCHEMA_VERSION,
            "brand": "Beat >X< RAY",
            "tagline": "See Inside the Beat",
            "organization": "ZeroHype Organization",
            "target_daw": job["daw"],
            "analysis": analysis,
            "education": education,
            "tracks": tracks,
            "disclaimer": "This is an AI-assisted reconstruction, not the original production session.",
        }
        (package / "project-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        (package / "README.txt").write_text(
            "BEAT >X< RAY — SEE INSIDE THE BEAT\n"
            "A product of the ZeroHype Organization\n\n"
            "This package contains separated stems, musical analysis, available MIDI transcriptions, "
            "and DAW import instructions. It is an AI-assisted reconstruction and not the original session.\n",
            encoding="utf-8",
        )

        archive = work / f"BeatXray-{job['id']}.zip"
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zipped:
            for file in package.rglob("*"):
                if file.is_file():
                    zipped.write(file, file.relative_to(work))
        return archive.read_bytes()


@app.function(image=image, secrets=[secret], timeout=900)
@modal.fastapi_endpoint(method="POST")
def enqueue(payload: dict[str, Any], x_beatxray_secret: str = Header(default="")) -> dict[str, Any]:
    expected_secret = os.environ.get("WORKER_WEBHOOK_SECRET", "")
    if not expected_secret or not hmac.compare_digest(x_beatxray_secret, expected_secret):
        raise HTTPException(status_code=401, detail="unauthorized")
    job_id = payload.get("jobId")
    if not isinstance(job_id, str) or not job_id:
        raise HTTPException(status_code=400, detail="invalid jobId")
    process.spawn(job_id)
    return {"accepted": True, "jobId": job_id}


@app.function(image=image, timeout=300)
def runtime_sanity_check() -> dict[str, Any]:
    """Verify the deployed worker image uses the approved runtime versions."""
    from beatxray.runtime import assert_runtime_compatibility

    return assert_runtime_compatibility()


@app.function(image=image, secrets=[secret], timeout=1800, gpu="L4", cpu=8, memory=32768)
def separate_stems_on_gpu(job_id: str) -> dict[str, Any]:
    """Run only the Demucs stage on GPU and persist individual stem artifacts."""
    from beatxray.runtime import assert_runtime_compatibility
    from beatxray.stems import separate_stems

    assert_runtime_compatibility()
    sb = _client()
    job = _job(sb, job_id)
    existing = _artifacts(sb, job_id)
    if all(f"stem-{name}" in existing for name in ("drums", "bass", "vocals", "other")):
        _event(sb, job_id, "separating", "stage_reused", {"reason": "validated stem artifacts exist"})
        return {"reused": True}

    _assert_not_cancelled(sb, job_id)
    with tempfile.TemporaryDirectory(prefix="beatxray-stems-") as temporary_directory:
        work = Path(temporary_directory)
        suffix = Path(job["original_filename"]).suffix.lower() or ".audio"
        source = work / f"source{suffix}"
        source.write_bytes(sb.storage.from_("song-uploads").download(job["source_path"]))
        generated = separate_stems(source, work / "demucs-output")
        for name, path in generated.items():
            _store_artifact(sb, job, f"stem-{name}", f"stems/{name}.wav", path.read_bytes(), "audio/wav")
    _event(sb, job_id, "separating", "stage_completed", {"artifact_count": 4})
    return {"reused": False, "stems": ["drums", "bass", "vocals", "other"]}


@app.function(image=image, secrets=[secret], timeout=3600, cpu=8, memory=16384)
def process(job_id: str) -> dict[str, Any]:
    """Resume a job from its first missing durable stage; CPU is the default runtime."""
    from beatxray.analysis import analyze_audio
    from beatxray.runtime import assert_runtime_compatibility, runtime_versions
    from beatxray.transcription import transcribe_audio

    assert_runtime_compatibility()
    sb = _client()
    job = _job(sb, job_id)
    if job["status"] == "complete":
        return {"complete": True, "jobId": job_id, "reused": True}
    if job["status"] == "cancelled":
        return {"cancelled": True, "jobId": job_id}

    try:
        _set_stage(
            sb,
            job_id,
            "preprocessing",
            max(int(job.get("progress") or 0), 5),
            started_at=job.get("started_at") or _now(),
            error_message=None,
            error_code=None,
        )
        artifacts = _artifacts(sb, job_id)
        analysis_artifact = artifacts.get("analysis-json")
        if analysis_artifact:
            analysis = _load_json_artifact(sb, analysis_artifact)
            _event(sb, job_id, "analyzing_rhythm", "stage_reused", {"artifact": "analysis-json"})
        else:
            _assert_not_cancelled(sb, job_id)
            _set_stage(sb, job_id, "analyzing_rhythm", 15)
            with tempfile.TemporaryDirectory(prefix="beatxray-analysis-") as temporary_directory:
                suffix = Path(job["original_filename"]).suffix.lower() or ".audio"
                source = Path(temporary_directory) / f"source{suffix}"
                source.write_bytes(sb.storage.from_("song-uploads").download(job["source_path"]))
                analysis = analyze_audio(source)
            _store_artifact(
                sb,
                job,
                "analysis-json",
                "analysis/full-analysis.json",
                json.dumps(analysis, indent=2).encode("utf-8"),
                "application/json",
            )
            _update_job(sb, job_id, analysis=analysis)
            _event(sb, job_id, "analyzing_rhythm", "stage_completed", {"artifact": "analysis-json"})
        _set_stage(sb, job_id, "analyzing_harmony", 30, event_type="stage_completed")
        _set_stage(sb, job_id, "analyzing_effects", 35, event_type="stage_completed", payload={"notice": "effects require future model support"})

        artifacts = _artifacts(sb, job_id)
        if not all(f"stem-{name}" in artifacts for name in ("drums", "bass", "vocals", "other")):
            _assert_not_cancelled(sb, job_id)
            _set_stage(sb, job_id, "separating", 40)
            separate_stems_on_gpu.remote(job_id)
        else:
            _event(sb, job_id, "separating", "stage_reused", {"reason": "validated stem artifacts exist"})

        artifacts = _artifacts(sb, job_id)
        _assert_not_cancelled(sb, job_id)
        _set_stage(sb, job_id, "transcribing", 70)
        midi_sources = {"bass": "stem-bass", "vocals": "stem-vocals", "instrumental": "stem-other"}
        for midi_name, stem_type in midi_sources.items():
            if f"midi-{midi_name}" in artifacts:
                continue
            stem_artifact = artifacts.get(stem_type)
            if not stem_artifact:
                continue
            with tempfile.TemporaryDirectory(prefix=f"beatxray-midi-{midi_name}-") as temporary_directory:
                work = Path(temporary_directory)
                stem = work / f"{midi_name}.wav"
                stem.write_bytes(sb.storage.from_(ARTIFACT_BUCKET).download(stem_artifact["storage_path"]))
                target = work / "prediction"
                try:
                    generated_midi = transcribe_audio(stem, target)
                except Exception as exc:
                    _event(sb, job_id, "transcribing", "transcription_unavailable", {"source": midi_name, "error": str(exc)[:500]})
                    continue
                if generated_midi:
                    _store_artifact(
                        sb,
                        job,
                        f"midi-{midi_name}",
                        f"midi/{midi_name}.mid",
                        generated_midi.read_bytes(),
                        "audio/midi",
                    )
        _event(sb, job_id, "transcribing", "stage_completed", {})

        artifacts = _artifacts(sb, job_id)
        education_artifact = artifacts.get("education-json")
        if education_artifact:
            education = _load_json_artifact(sb, education_artifact)
            _event(sb, job_id, "educational_analysis", "stage_reused", {"artifact": "education-json"})
        else:
            _set_stage(sb, job_id, "educational_analysis", 82)
            education = _educational_explanation(analysis)
            _store_artifact(
                sb,
                job,
                "education-json",
                "analysis/education.json",
                json.dumps(education, indent=2).encode("utf-8"),
                "application/json",
            )
            _event(sb, job_id, "educational_analysis", "stage_completed", {})

        artifacts = _artifacts(sb, job_id)
        package_artifact = artifacts.get("export-package")
        if package_artifact:
            result_path = package_artifact["storage_path"]
            _event(sb, job_id, "packaging", "stage_reused", {"artifact": "export-package"})
        else:
            _assert_not_cancelled(sb, job_id)
            _set_stage(sb, job_id, "packaging", 90)
            archive = _package_export(sb, job, analysis, education, artifacts)
            result_path = _store_artifact(
                sb,
                job,
                "export-package",
                f"exports/BeatXray-{job_id}.zip",
                archive,
                "application/zip",
            )
            _event(sb, job_id, "packaging", "stage_completed", {"result_path": result_path})

        result_json = {"analysis": analysis, "education": education, "result_path": result_path}
        sb.table("analysis_results").upsert(
            {
                "job_id": job_id,
                "schema_version": SCHEMA_VERSION,
                "model_versions": runtime_versions(),
                "result_json": result_json,
            },
            on_conflict="job_id,schema_version",
        ).execute()
        _set_stage(
            sb,
            job_id,
            "complete",
            100,
            event_type="completed",
            result_path=result_path,
            analysis=analysis,
            completed_at=_now(),
        )
        return {"complete": True, "jobId": job_id, "resultPath": result_path}
    except Exception as exc:
        current = _job(sb, job_id)
        if current["status"] == "cancelled":
            return {"cancelled": True, "jobId": job_id}
        _update_job(
            sb,
            job_id,
            status="failed",
            stage="failed",
            error_code=exc.__class__.__name__,
            error_message=str(exc)[:2000],
        )
        _event(sb, job_id, "failed", "failed", {"error_code": exc.__class__.__name__})
        raise
