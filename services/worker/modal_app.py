"""BeatXray GPU processing worker.

Pipeline: secure download -> musical analysis -> Demucs stems -> Basic Pitch MIDI
-> DAW import package -> secure Supabase result upload.
"""
from __future__ import annotations

import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

import modal
from fastapi import Header, HTTPException

app = modal.App("beatxray-worker")

image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04", add_python="3.11")
    .entrypoint([])
    .apt_install("ffmpeg", "libsndfile1", "git")
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir("beatxray", remote_path="/root/beatxray")
)

secret = modal.Secret.from_name("beatxray-secrets")


def _update(sb: Any, job_id: str, **values: Any) -> None:
    sb.table("analysis_jobs").update(values).eq("id", job_id).execute()


@app.function(image=image, secrets=[secret], timeout=900)
@modal.fastapi_endpoint(method="POST")
def enqueue(payload: dict[str, Any], x_beatxray_secret: str = Header(default="")) -> dict[str, Any]:
    if not x_beatxray_secret or x_beatxray_secret != os.environ["WORKER_WEBHOOK_SECRET"]:
        raise HTTPException(status_code=401, detail="unauthorized")
    job_id = payload.get("jobId")
    if not isinstance(job_id, str) or not job_id:
        return {"error": "invalid jobId"}
    process.spawn(job_id)
    return {"accepted": True, "jobId": job_id}


@app.function(
    image=image,
    secrets=[secret],
    timeout=3600,
    gpu="L4",
    cpu=8,
    memory=32768,
)
def process(job_id: str) -> dict[str, Any]:
    from supabase import create_client

    from beatxray.analysis import analyze_audio
    from beatxray.exporters import export_ableton, export_fl_studio
    from beatxray.stems import separate_stems
    from beatxray.transcription import transcribe_audio

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
    job = sb.table("analysis_jobs").select("*").eq("id", job_id).single().execute().data
    if not job:
        raise RuntimeError(f"Unknown analysis job: {job_id}")

    try:
        _update(sb, job_id, status="preprocessing", stage="preprocessing", progress=5, error_message=None, error_code=None)
        audio = sb.storage.from_("song-uploads").download(job["source_path"])
        suffix = Path(job["original_filename"]).suffix.lower() or ".audio"

        with tempfile.TemporaryDirectory(prefix="beatxray-") as td:
            work = Path(td)
            source = work / f"source{suffix}"
            source.write_bytes(audio)
            package = work / "BeatXray"
            stems_folder = package / "Audio" / "Stems"
            midi_folder = package / "MIDI"
            analysis_folder = package / "Analysis"
            reference_folder = package / "Reference"
            stems_folder.mkdir(parents=True)
            midi_folder.mkdir(parents=True)
            analysis_folder.mkdir(parents=True)
            reference_folder.mkdir(parents=True)
            shutil.copy2(source, reference_folder / job["original_filename"])

            analysis = analyze_audio(source)
            _update(sb, job_id, status="separating", stage="separating", progress=25, analysis=analysis)

            demucs_root = work / "demucs-output"
            generated_stems = separate_stems(source, demucs_root)
            tracks: list[dict[str, Any]] = []
            copied_stems: dict[str, Path] = {}
            for stem_name, stem_path in generated_stems.items():
                destination = stems_folder / f"{stem_name}.wav"
                shutil.copy2(stem_path, destination)
                copied_stems[stem_name] = destination
                tracks.append({
                    "name": stem_name.title(),
                    "type": "audio",
                    "role": stem_name,
                    "file": f"Audio/Stems/{destination.name}",
                    "timeline_start_seconds": 0.0,
                })
            _update(sb, job_id, status="transcribing", stage="transcribing", progress=60)

            midi_sources = {
                "bass": copied_stems.get("bass"),
                "vocals": copied_stems.get("vocals"),
                "instrumental": copied_stems.get("other"),
            }
            for name, stem_path in midi_sources.items():
                if stem_path is None:
                    continue
                target = midi_folder / name
                try:
                    midi_path = transcribe_audio(stem_path, target)
                    if midi_path:
                        final_midi = midi_folder / f"{name}.mid"
                        shutil.move(str(midi_path), final_midi)
                        shutil.rmtree(target, ignore_errors=True)
                        tracks.append({
                            "name": f"{name.title()} MIDI",
                            "type": "midi",
                            "role": name,
                            "file": f"MIDI/{final_midi.name}",
                            "timeline_start_seconds": 0.0,
                        })
                except Exception as exc:
                    (midi_folder / f"{name}-transcription-error.txt").write_text(str(exc), encoding="utf-8")
            _update(sb, job_id, status="packaging", stage="packaging", progress=80)

            (analysis_folder / "full-analysis.json").write_text(json.dumps(analysis, indent=2), encoding="utf-8")
            (analysis_folder / "sections.json").write_text(json.dumps(analysis["sections"], indent=2), encoding="utf-8")
            (analysis_folder / "chords.json").write_text(json.dumps(analysis["chords"], indent=2), encoding="utf-8")
            (analysis_folder / "beat-grid.json").write_text(json.dumps(analysis["beat_grid_seconds"], indent=2), encoding="utf-8")

            exporter = export_fl_studio if job["daw"] == "flstudio" else export_ableton
            exporter(package, analysis, tracks)

            manifest = {
                "schema": "org.zerohype.beatxray.reconstruction/v1",
                "brand": "Beat >X< RAY",
                "tagline": "See Inside the Beat",
                "organization": "ZeroHype Organization",
                "target_daw": job["daw"],
                "analysis": analysis,
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

            archive = work / f"BeatXray-{job_id}.zip"
            with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
                for file in package.rglob("*"):
                    if file.is_file():
                        zf.write(file, file.relative_to(work))

            result_path = f"{job['user_id']}/{job_id}/{archive.name}"
            sb.storage.from_("analysis-results").upload(
                result_path,
                archive.read_bytes(),
                {"content-type": "application/zip", "upsert": "true"},
            )
            _update(sb, job_id, status="complete", stage="complete", progress=100, result_path=result_path, analysis=analysis, completed_at=datetime.now(timezone.utc).isoformat())
            return {"complete": True, "jobId": job_id, "resultPath": result_path}
    except Exception as exc:
        _update(sb, job_id, status="failed", stage="failed", progress=100, error_code=exc.__class__.__name__, error_message=str(exc)[:2000])
        raise
