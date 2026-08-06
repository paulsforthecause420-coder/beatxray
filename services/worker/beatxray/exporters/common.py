from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def daw_import_manifest(daw: str, analysis: dict[str, Any], tracks: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema": "org.zerohype.beatxray.project/v1",
        "brand": "Beat >X< RAY",
        "tagline": "See Inside the Beat",
        "organization": "ZeroHype Organization",
        "target_daw": daw,
        "timeline": {
            "tempo_bpm": analysis["tempo_bpm"],
            "time_signature": analysis["time_signature"],
            "key": analysis["key"],
            "sections": analysis["sections"],
            "chords": analysis["chords"],
        },
        "tracks": tracks,
        "native_project_status": "import-ready package; native project writer remains experimental",
    }
