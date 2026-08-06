from __future__ import annotations

import subprocess
from pathlib import Path

STEM_NAMES = ("drums", "bass", "vocals", "other")


def separate_stems(source: Path, output_root: Path, model: str = "htdemucs") -> dict[str, Path]:
    command = [
        "python", "-m", "demucs.separate", "-n", model,
        "--out", str(output_root), "--float32", "--segment", "8", str(source),
    ]
    subprocess.run(command, check=True, capture_output=True, text=True)
    stem_dir = output_root / model / source.stem
    stems = {name: stem_dir / f"{name}.wav" for name in STEM_NAMES}
    missing = [name for name, path in stems.items() if not path.exists()]
    if missing:
        raise RuntimeError(f"Demucs did not produce expected stems: {', '.join(missing)}")
    return stems
