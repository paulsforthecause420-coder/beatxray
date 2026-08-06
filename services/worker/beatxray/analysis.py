from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import librosa
import numpy as np

PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


@dataclass
class Section:
    label: str
    start_seconds: float
    end_seconds: float


@dataclass
class ChordEvent:
    chord: str
    start_seconds: float
    end_seconds: float
    confidence: float


def _key_from_chroma(chroma_mean: np.ndarray) -> tuple[str, float]:
    chroma_mean = chroma_mean / (np.linalg.norm(chroma_mean) + 1e-9)
    candidates: list[tuple[float, str]] = []
    for root in range(12):
        major = np.roll(MAJOR_PROFILE, root)
        minor = np.roll(MINOR_PROFILE, root)
        candidates.append((float(np.corrcoef(chroma_mean, major)[0, 1]), f"{PITCHES[root]} major"))
        candidates.append((float(np.corrcoef(chroma_mean, minor)[0, 1]), f"{PITCHES[root]} minor"))
    score, name = max(candidates)
    return name, round(max(0.0, min(1.0, (score + 1.0) / 2.0)), 3)


def _estimate_time_signature(beat_times: np.ndarray, onset_env: np.ndarray, sr: int, hop_length: int) -> tuple[int, int, float]:
    if len(beat_times) < 8:
        return 4, 4, 0.25
    beat_frames = librosa.time_to_frames(beat_times, sr=sr, hop_length=hop_length)
    strengths = onset_env[np.clip(beat_frames, 0, len(onset_env) - 1)]
    scores: dict[int, float] = {}
    for meter in (3, 4, 6):
        grouped = [strengths[offset::meter].mean() if len(strengths[offset::meter]) else 0.0 for offset in range(meter)]
        scores[meter] = float(max(grouped) - np.mean(grouped))
    meter = max(scores, key=scores.get)
    total = sum(max(v, 0.0) for v in scores.values()) + 1e-9
    confidence = max(0.2, min(0.9, max(scores[meter], 0.0) / total))
    return meter, 4, round(float(confidence), 3)


def _detect_sections(y: np.ndarray, sr: int, duration: float) -> list[Section]:
    hop = 512
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=hop)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    features = np.vstack([librosa.util.normalize(mfcc, axis=1), librosa.util.normalize(chroma, axis=1)])
    target = max(2, min(10, int(round(duration / 30.0))))
    try:
        boundaries = librosa.segment.agglomerative(features, k=target)
        times = librosa.frames_to_time(boundaries, sr=sr, hop_length=hop).tolist()
    except Exception:
        times = np.linspace(0.0, duration, target + 1)[:-1].tolist()
    times = sorted(set([0.0] + [float(t) for t in times if 0.0 < t < duration] + [duration]))
    labels = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"]
    return [Section(labels[min(i, len(labels) - 1)], round(times[i], 3), round(times[i + 1], 3)) for i in range(len(times) - 1)]


def _detect_chords(chroma: np.ndarray, sr: int, hop_length: int, duration: float) -> list[ChordEvent]:
    templates: list[tuple[str, np.ndarray]] = []
    for root, pitch in enumerate(PITCHES):
        for quality, intervals in (("maj", (0, 4, 7)), ("min", (0, 3, 7))):
            template = np.zeros(12)
            template[[(root + i) % 12 for i in intervals]] = 1.0
            templates.append((f"{pitch}:{quality}", template / np.linalg.norm(template)))
    window_seconds = 2.0
    frames_per_window = max(1, int(window_seconds * sr / hop_length))
    events: list[ChordEvent] = []
    for start in range(0, chroma.shape[1], frames_per_window):
        end = min(chroma.shape[1], start + frames_per_window)
        vec = chroma[:, start:end].mean(axis=1)
        norm = np.linalg.norm(vec)
        if norm < 1e-8:
            chord, confidence = "N", 0.0
        else:
            vec = vec / norm
            scored = [(float(np.dot(vec, template)), name) for name, template in templates]
            confidence, chord = max(scored)
        start_sec = librosa.frames_to_time(start, sr=sr, hop_length=hop_length)
        end_sec = min(duration, librosa.frames_to_time(end, sr=sr, hop_length=hop_length))
        if events and events[-1].chord == chord:
            events[-1].end_seconds = round(float(end_sec), 3)
            events[-1].confidence = round((events[-1].confidence + confidence) / 2.0, 3)
        else:
            events.append(ChordEvent(chord, round(float(start_sec), 3), round(float(end_sec), 3), round(float(confidence), 3)))
    return events


def analyze_audio(path: Path, max_duration: int = 1200) -> dict[str, Any]:
    y, sr = librosa.load(path, sr=44100, mono=True, duration=max_duration)
    duration = float(librosa.get_duration(y=y, sr=sr))
    hop = 512
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop, units="frames")
    tempo_value = float(np.asarray(tempo).reshape(-1)[0])
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    key, key_confidence = _key_from_chroma(chroma.mean(axis=1))
    numerator, denominator, meter_confidence = _estimate_time_signature(beat_times, onset_env, sr, hop)
    sections = _detect_sections(y, sr, duration)
    chords = _detect_chords(chroma, sr, hop, duration)
    return {
        "duration_seconds": round(duration, 3),
        "sample_rate": sr,
        "tempo_bpm": round(tempo_value, 3),
        "tempo_confidence": round(min(0.99, len(beat_times) / max(16.0, duration / 2.0)), 3),
        "time_signature": {"numerator": numerator, "denominator": denominator, "confidence": meter_confidence},
        "key": {"name": key, "confidence": key_confidence},
        "beat_grid_seconds": [round(float(t), 4) for t in beat_times[:5000]],
        "sections": [asdict(section) for section in sections],
        "chords": [asdict(chord) for chord in chords],
        "reconstruction_notice": "AI-assisted estimates; not the original production session.",
    }
