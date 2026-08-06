# BeatXray processing milestone

## Delivered pipeline

1. Download the authenticated source audio from private Supabase Storage.
2. Analyze duration, BPM, beat grid, probable meter, key, chords and sections.
3. Run Demucs `htdemucs` on an L4 GPU to create drums, bass, vocals and other stems.
4. Run Basic Pitch on suitable stems and preserve any successful MIDI transcriptions.
5. Build a DAW-neutral reconstruction manifest.
6. Add either FL Studio or Ableton Live import instructions and metadata.
7. Zip the reconstruction and upload it to the user's private result path.
8. Record progress, completion, result location or failure information in Supabase.

## Accuracy expectations

- Stem separation is probabilistic and can contain bleed or artifacts.
- Meter, key, chords and sections are estimates and should expose confidence values.
- Polyphonic audio-to-MIDI is useful as an editable starting point, not an exact score.
- The package reconstructs a useful session; it cannot recover the original producer's plugins, presets, routing or automation.

## Native exporter gate

Do not advertise native `.flp` or `.als` output until each writer passes a compatibility matrix covering supported DAW versions, round-trip opening tests, missing-media tests and malformed-project rejection tests.
