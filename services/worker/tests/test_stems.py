from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from beatxray import stems  # noqa: E402


def test_separation_uses_validated_segment_and_validates_outputs(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    source = tmp_path / "song.wav"
    source.write_bytes(b"audio")
    output_root = tmp_path / "output"
    captured: dict[str, list[str]] = {}

    def fake_run(command: list[str], **_: object) -> SimpleNamespace:
        captured["command"] = command
        stem_dir = output_root / "htdemucs" / source.stem
        stem_dir.mkdir(parents=True)
        for name in stems.STEM_NAMES:
            (stem_dir / f"{name}.wav").write_bytes(b"stem")
        return SimpleNamespace(returncode=0, stdout="", stderr="")

    monkeypatch.setattr(stems.subprocess, "run", fake_run)

    result = stems.separate_stems(source, output_root)

    assert captured["command"][0] == sys.executable
    assert captured["command"][captured["command"].index("--segment") + 1] == "7"
    assert tuple(result) == stems.STEM_NAMES


def test_separation_exposes_bounded_failure_diagnostic(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    source = tmp_path / "song.wav"
    source.write_bytes(b"audio")

    monkeypatch.setattr(
        stems.subprocess,
        "run",
        lambda *_args, **_kwargs: SimpleNamespace(returncode=1, stdout="", stderr="bad separation"),
    )

    with pytest.raises(RuntimeError, match="Demucs stem separation failed: bad separation"):
        stems.separate_stems(source, tmp_path / "output")
