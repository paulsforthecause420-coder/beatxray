"""Runtime compatibility safeguards for the BeatXray Modal worker."""
from __future__ import annotations

import importlib.metadata
import json
import sys
from typing import Any

REQUIRED_PYTHON = (3, 11)
REQUIRED_NUMPY = "1.26.4"
REQUIRED_TENSORFLOW = "2.14.1"


def _version(distribution: str) -> str:
    try:
        return importlib.metadata.version(distribution)
    except importlib.metadata.PackageNotFoundError:
        return "missing"


def runtime_versions() -> dict[str, Any]:
    """Return the relevant runtime versions without exposing configuration or secrets."""
    return {
        "python": ".".join(str(value) for value in sys.version_info[:3]),
        "numpy": _version("numpy"),
        "tensorflow": _version("tensorflow"),
        "basic_pitch": _version("basic-pitch"),
        "torch": _version("torch"),
        "torchaudio": _version("torchaudio"),
        "demucs": _version("demucs"),
    }


def assert_runtime_compatibility() -> dict[str, Any]:
    """Reject worker images that regress the verified Python/NumPy/TensorFlow baseline."""
    versions = runtime_versions()
    if tuple(sys.version_info[:2]) != REQUIRED_PYTHON:
        raise RuntimeError(
            f"BeatXray worker requires Python {REQUIRED_PYTHON[0]}.{REQUIRED_PYTHON[1]}, "
            f"found {versions['python']}"
        )
    if versions["numpy"] != REQUIRED_NUMPY:
        raise RuntimeError(f"BeatXray worker requires numpy=={REQUIRED_NUMPY}, found {versions['numpy']}")
    if versions["tensorflow"] != REQUIRED_TENSORFLOW:
        raise RuntimeError(
            f"BeatXray worker requires tensorflow=={REQUIRED_TENSORFLOW}, "
            f"found {versions['tensorflow']}"
        )
    return versions


if __name__ == "__main__":
    print(json.dumps(assert_runtime_compatibility(), sort_keys=True))
