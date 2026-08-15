from __future__ import annotations

import subprocess
import sys
from pathlib import Path

STEM_NAMES = ("drums", "bass", "vocals", "other")
SAFE_DEMUCS_SEGMENT_SECONDS = 7


def separate_stems(source: Path, output_root: Path, model: str = "htdemucs") -> dict[str, Path]:
    """Run the validated Demucs configuration and validate every expected stem."""
    command = [
        sys.executable,
        "-m",
        "demucs.separate",
        "-n",
        model,
        "--out",
        str(output_root),
        "--float32",
        "--segment",
        str(SAFE_DEMUCS_SEGMENT_SECONDS),
        str(source),
    ]
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    if completed.returncode:
        detail = (completed.stderr or completed.stdout or "Demucs exited without diagnostic output").strip()
        raise RuntimeError(f"Demucs stem separation failed: {detail[-1500:]}")

    stem_dir = output_root / model / source.stem
    stems = {name: stem_dir / f"{name}.wav" for name in STEM_NAMES}
    missing = [name for name, path in stems.items() if not path.exists()]
    if missing:
        raise RuntimeError(f"Demucs did not produce expected stems: {', '.join(missing)}")
    return stems
