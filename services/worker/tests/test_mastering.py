from pathlib import Path

import numpy as np
import soundfile as sf

from beatxray.mastering import inspect_master


def test_inspect_master_returns_explainable_plan(tmp_path: Path) -> None:
    sample_rate = 44100
    time = np.arange(sample_rate, dtype=np.float32) / sample_rate
    audio = 0.1 * np.sin(2 * np.pi * 220 * time)
    source = tmp_path / "tone.wav"
    sf.write(source, np.column_stack([audio, audio]), sample_rate)

    result = inspect_master(source, "streaming")

    assert result["profile"] == "streaming"
    assert result["recommended_starting_chain"][-1]["processor"] == "limiter"
    assert "loudness proxy" in result["notice"]
