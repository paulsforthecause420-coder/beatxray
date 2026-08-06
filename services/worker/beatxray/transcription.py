from __future__ import annotations

from pathlib import Path


def transcribe_audio(source: Path, output_dir: Path) -> Path | None:
    """Create MIDI using Spotify Basic Pitch. Returns None when no notes are detected."""
    from basic_pitch.inference import predict_and_save

    output_dir.mkdir(parents=True, exist_ok=True)
    predict_and_save(
        [str(source)],
        str(output_dir),
        save_midi=True,
        sonify_midi=False,
        save_model_outputs=False,
        save_notes=False,
    )
    candidates = sorted(output_dir.glob("*.mid")) + sorted(output_dir.glob("*.midi"))
    return candidates[0] if candidates else None
