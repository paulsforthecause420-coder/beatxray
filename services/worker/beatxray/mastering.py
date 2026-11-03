"""Deterministic audio-intelligence measurements and assisted-mastering plans.

This module recommends reversible settings. Rendering remains a separate, explicitly
authorized step so BeatXray never silently changes a creator's master.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import librosa
import numpy as np


@dataclass(frozen=True)
class MasteringTargets:
    target_lufs: float
    true_peak_ceiling_db: float
    dynamic_range_db: float


PROFILES: dict[str, MasteringTargets] = {
    "balanced": MasteringTargets(-14.0, -1.0, 9.0),
    "streaming": MasteringTargets(-14.0, -1.0, 10.0),
    "loud": MasteringTargets(-10.0, -1.0, 7.0),
    "dynamic": MasteringTargets(-16.0, -1.0, 12.0),
}


def _db(value: float) -> float:
    return float(20.0 * np.log10(max(value, 1e-12)))


def inspect_master(path: Path, profile: str = "balanced", max_duration: int = 1200) -> dict[str, Any]:
    """Measure a rendered mix and produce an explainable, non-destructive plan."""
    if profile not in PROFILES:
        raise ValueError(f"Unknown mastering profile: {profile}")
    audio, sample_rate = librosa.load(path, sr=44100, mono=False, duration=max_duration)
    if audio.ndim == 1:
        audio = np.vstack([audio, audio])
    mono = np.mean(audio, axis=0)
    peak_dbfs = _db(float(np.max(np.abs(audio))))
    rms = librosa.feature.rms(y=mono, frame_length=2048, hop_length=512)[0]
    rms_db = 20.0 * np.log10(np.maximum(rms, 1e-12))
    integrated_rms_db = _db(float(np.sqrt(np.mean(np.square(mono)))))
    crest_factor_db = peak_dbfs - integrated_rms_db
    dynamic_range_db = float(np.percentile(rms_db, 95) - np.percentile(rms_db, 10))
    clipping_samples = int(np.count_nonzero(np.abs(audio) >= 0.999))
    correlation = float(np.corrcoef(audio[0], audio[1])[0, 1]) if audio.shape[1] > 1 else 1.0
    target = PROFILES[profile]

    # RMS is deliberately labelled as a loudness proxy, not an LUFS claim.
    estimated_gain_db = target.target_lufs - integrated_rms_db
    headroom_limited_gain_db = target.true_peak_ceiling_db - peak_dbfs
    safe_gain_db = round(min(estimated_gain_db, headroom_limited_gain_db), 2)
    findings: list[dict[str, Any]] = []
    if clipping_samples:
        findings.append({"severity": "high", "code": "clipping", "message": "Clipped samples were detected; lower the mix before limiting."})
    if correlation < 0.0:
        findings.append({"severity": "high", "code": "phase", "message": "Negative stereo correlation may cause mono cancellation."})
    if dynamic_range_db < target.dynamic_range_db - 2.0:
        findings.append({"severity": "medium", "code": "over_compressed", "message": "The mix may already be too compressed for this profile."})
    if not findings:
        findings.append({"severity": "info", "code": "healthy_start", "message": "No immediate peak, phase, or macro-dynamics warning was detected."})

    return {
        "profile": profile,
        "targets": asdict(target),
        "measurements": {
            "peak_dbfs": round(peak_dbfs, 2),
            "rms_loudness_proxy_db": round(integrated_rms_db, 2),
            "crest_factor_db": round(crest_factor_db, 2),
            "dynamic_range_db": round(dynamic_range_db, 2),
            "stereo_correlation": round(correlation, 3),
            "clipping_samples": clipping_samples,
            "sample_rate": sample_rate,
        },
        "recommended_starting_chain": [
            {"processor": "corrective_eq", "enabled": False, "reason": "Enable only after reviewing spectral findings."},
            {"processor": "bus_compressor", "enabled": dynamic_range_db > target.dynamic_range_db + 2.0, "ratio": 2.0, "max_gain_reduction_db": 2.0},
            {"processor": "limiter", "enabled": True, "ceiling_db": target.true_peak_ceiling_db, "input_gain_db": safe_gain_db},
        ],
        "findings": findings,
        "notice": "Assisted-mastering recommendation only. RMS is a loudness proxy; verify final LUFS and true peak with a standards-compliant meter before release.",
    }
