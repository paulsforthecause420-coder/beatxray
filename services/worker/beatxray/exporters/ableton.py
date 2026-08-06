from __future__ import annotations

from pathlib import Path
from typing import Any

from .common import daw_import_manifest, write_json


def export_ableton(root: Path, analysis: dict[str, Any], tracks: list[dict[str, Any]]) -> list[Path]:
    folder = root / "Ableton Live"
    folder.mkdir(parents=True, exist_ok=True)
    manifest = folder / "beatxray-ableton-import.json"
    write_json(manifest, daw_import_manifest("ableton", analysis, tracks))
    guide = folder / "IMPORT INTO ABLETON LIVE.txt"
    guide.write_text(
        "BEAT >X< RAY — Ableton Live Import\n\n"
        "1. Set Live's tempo and time signature from the JSON manifest.\n"
        "2. Drag all WAV stems from Audio/Stems into Arrangement View at 1.1.1.\n"
        "3. Turn Warp off for each full-length stem unless intentional warping is desired.\n"
        "4. Import MIDI files from MIDI onto separate MIDI tracks.\n"
        "5. Add locators using Analysis/sections.json.\n\n"
        "Native .als generation is disabled until a version-tested writer is available.\n",
        encoding="utf-8",
    )
    return [manifest, guide]
