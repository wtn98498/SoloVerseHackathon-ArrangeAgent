# PlayBand AI MVP Decision Record

Status: accepted for hackathon MVP.

This document replaces the earlier broad agent redesign. The previous direction
introduced a plan engine, region-level rewriting, MIDI export, and extra tool
layers. Those ideas may be useful after the hackathon, but they are too large
for the current demo path.

## Current Decision

PlayBand AI keeps a lightweight MIDI-like JSON model as the product core.

The MVP is not a full MIDI editor and not a professional DAW. It is a playful
music sketchpad where a user makes a small musical gesture and an arrangement
agent expands it into a visible, playable 8-bar band loop.

The chosen stack is:

- React + TypeScript for the browser-first editor.
- Tone.js for playback.
- `ArrangementProject` JSON as the shared music state.
- Deterministic fallback arrangement as the always-working demo path.
- DeepSeek as an optional generation layer behind the same contract.
- A compact piano-roll style view for visual trust, not full DAW editing.

## MIDI Boundary

The project should have MIDI flavor, but not full MIDI scope.

Required:

- 8 bars, 128 steps, 4/4 timing.
- Four tracks: drums, bass, guitar, keys.
- Clips containing `NoteEvent[]` and `DrumHit[]`.
- Piano-roll style rendering for the selected clip or track.
- Playback cursor and visible note/drum changes after agent actions.
- Minimal local edits only when they protect the demo path.

Not in MVP:

- Full MIDI file import/export.
- Full-keyboard piano roll.
- Multi-region DAW editing.
- Advanced drag/resize/multi-select editing.
- Velocity lanes, automation, plugin routing, or sample-library management.
- Region-level natural-language edits.
- A new plan-engine architecture.

## Open Source References

Use open source projects as reference material only. Do not fork or import large
subsystems during the hackathon.

### two-moons / MoaRoll

Use as the primary visual and interaction reference for the piano-roll feel.

Adopt:

- Clear note blocks.
- Keyboard + grid relationship.
- Playhead/scrub feel.
- Compact, friendly roll presentation.

Do not adopt:

- MobX store architecture.
- Its seconds-based note timing model.
- Its instrument registration system.
- Its MIDI editor/export pipeline.

Reason: PlayBand already has a step-based contract that is better for agent
validation and fallback generation. Replacing it would create migration work
without improving the demo story.

### openDAW

Use only as a high-level reference for modern web DAW layout and polish.

Do not adopt code or architecture in the MVP. It is a full DAW-scale project,
too broad for the current scope and risky for license and integration time.

### GridSound DAW

Use only as a conceptual browser-DAW reference.

Do not adopt code or architecture in the MVP. The product goal is a toy-like
AI arrangement sketchpad, not a browser DAW clone.

### Tone.js examples

Use as implementation reference for playback scheduling and simple synth/drum
timing. Tone.js remains the practical audio layer for the MVP.

## Agent Boundary

For the hackathon, the "agent" must stay small:

- `completeArrangement(seed, currentProject?)`
- `increaseEnergy(project)`
- `softenArrangement(project)`
- `explainChanges(before, after)`

The agent must return valid `ArrangementProject` JSON or fall back
deterministically. It should not expose a complex multi-tool workflow to the
frontend.

LLM output must be validated before it reaches the UI. If validation fails, the
demo continues through fallback.

## Demo Path

The winning path is:

1. User plays drums or keys for a few seconds.
2. App captures a `SeedPattern`.
3. User clicks complete arrangement.
4. Four tracks fill with visible MIDI-like clips.
5. User clicks more energetic or softer.
6. Notes/drum hits visibly change and the audio loop changes.
7. Agent explains the change in plain language.

Everything else is secondary.

## Next Implementation Focus

The next useful work should improve reliability and presentation of the current
lightweight model:

- Make the existing piano roll look and feel closer to the best parts of
  MoaRoll without importing MoaRoll.
- Keep note pitches valid and playable while showing a broader piano-roll
  keyboard than the old three-octave prototype.
- Keep the four-track timeline readable.
- Make agent actions visibly change clips.
- Preserve browser fallback and deterministic generation.
