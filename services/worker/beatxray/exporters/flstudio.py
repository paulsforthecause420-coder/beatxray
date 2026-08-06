from __future__ import annotations

from pathlib import Path
from typing import Any

from .common import daw_import_manifest, write_json


def export_fl_studio(root: Path, analysis: dict[str, Any], tracks: list[dict[str, Any]]) -> list[Path]:
    folder = root / "FL Studio"
    folder.mkdir(parents=True, exist_ok=True)
    manifest = folder / "beatxray-flstudio-import.json"
    write_json(manifest, daw_import_manifest("flstudio", analysis, tracks))
    guide = folder / "IMPORT INTO FL STUDIO.txt"
    guide.write_text(
        "BEAT >X< RAY — FL Studio Import\n\n"
        "1. Set the project tempo and time signature from the JSON manifest.\n"
        "2. Drag all WAV stems from Audio/Stems into the Playlist at bar 1.\n"
        "3. Disable automatic time stretching unless intentionally matching tempo.\n"
        "4. Import MIDI files from MIDI into separate instrument channels.\n"
        "5. Add section markers using Analysis/sections.json.\n\n"
        "Native .flp generation is disabled until a version-tested writer is available.\n",
        encoding="utf-8",
    )
    return [manifest, guide]
