# Frontend Agent Brief

Read `docs/contracts.md` first. That file is the source of truth.

## Mission

Build the desktop-style music editor experience for PlayBand AI.

Your job is to make the app feel playable, clear, and demo-safe. The frontend
should work with backend fallback responses before DeepSeek integration is
ready.

The piano-roll view is for visual trust and light interaction. Make it concise
and beautiful, inspired by two-moons / MoaRoll where useful, but do not import
that codebase or build a full MIDI editor.

## Scope

Own:

- React + TypeScript app shell.
- Main layout: top transport, four-track timeline, bottom instrument
  controller, right-side agent panel.
- Tone.js playback scheduling.
- User input capture into `SeedPattern`.
- Rendering `ArrangementProject`.
- Calling `/api/arrange/complete` and `/api/arrange/energy`.
- Loading, success, and fallback UI states.
- Lightweight piano-roll display for the selected track or clip.

Do not own:

- DeepSeek client code.
- Agent prompt design.
- Arrangement generation logic.
- Backend validation rules.

## UI Requirements

Layout:

- Top bar: play/stop, tempo, style, mood.
- Main area: four lanes for drums, bass, guitar, keys.
- Bottom area: selected instrument controller.
- Right panel: Agent actions and explanation history.

Instrument controls:

- Drums: kick, snare, hi-hat, clap pads.
- Keys: 8 large scale-note buttons.
- Bass and guitar can start as simple buttons if time is tight.

Visual style:

- Nintendo-inspired music toy, not a dense DAW.
- Big controls, strong feedback, low text density.
- Use instrument colors from `docs/contracts.md` data when available.
- MIDI-flavored visuals are welcome, but the central promise is still "play a
  seed, let the agent arrange it."
- Do not add dense velocity lanes, multi-select editing, full-keyboard scrolling,
  or MIDI file workflows in the MVP.

## API Use

Complete arrangement:

```ts
await fetch("/api/arrange/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seed, currentProject }),
});
```

Energy change:

```ts
await fetch("/api/arrange/energy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ project, direction: "increase" }),
});
```

Soft change:

```ts
await fetch("/api/arrange/energy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ project, direction: "soften" }),
});
```

## Deliverables

- App shell runs in browser.
- Main editor renders a valid `ArrangementProject`.
- Playback works for drums and pitched notes.
- User can create a `SeedPattern`.
- Agent panel can trigger complete/increase/soften actions.
- Frontend handles `source: "fallback"` without making it look like failure.

## Integration Tests To Perform

- Render a static project from local fixture.
- Play and stop an 8-bar loop.
- Trigger complete with a hand-built seed.
- Trigger increase and verify UI changes.
- Disconnect API or force fallback and confirm the UI still works.
- Verify the selected-track piano roll respects the `C2..B4` pitch boundary.
