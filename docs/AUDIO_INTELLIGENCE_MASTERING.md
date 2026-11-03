# Audio Intelligence and Assisted Mastering

BeatXray has two connected product pillars.

## Audio intelligence

The existing worker extracts tempo, key, meter, beat grid, arrangement sections, chord estimates, stems, MIDI-ready transcriptions and DAW-oriented reconstruction packages. Findings must retain confidence and limitation language.

## Assisted mastering

Assisted mastering is a measured, creator-controlled workflow:

1. Inspect peaks, RMS loudness proxy, macro dynamics, crest factor, clipping and stereo correlation.
2. Compare measurements with a user-selected target profile.
3. Explain warnings and recommend a conservative starting chain.
4. Let the creator approve or adjust settings before any future render step.
5. Preserve the original upload and record every selected setting.

The first implementation produces a mastering-intelligence report. It does not claim standards-compliant LUFS/true-peak measurement and does not silently render or overwrite audio.

## Profiles

- **Balanced:** neutral starting point for general release preparation.
- **Streaming:** conservative dynamics and headroom for later platform checks.
- **Loud:** higher perceived-level target with explicit dynamics warnings.
- **Dynamic:** preserves greater macro-dynamic movement.

## Safety contract

- Original audio remains immutable.
- Analysis and recommendations are distinguishable from measured facts.
- Rendering requires explicit authorization.
- Every output identifies the profile, measurements, settings and engine version.
- Final release files should be checked with standards-compliant loudness and true-peak meters.
