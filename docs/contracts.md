# PlayBand AI Shared Contracts

This document is the source of truth for all three implementation agents.

Every agent must read this file before starting work. If an API shape, data
model, or ownership boundary needs to change, update this file first.

## 1. Architecture

The MVP is split into three workstreams:

- Frontend agent: desktop-style music editor UI and playback experience.
- App backend agent: local app/service orchestration, API routes, validation,
  persistence-light project state, and DeepSeek client wrapper.
- Arrangement agent: single music arrangement agent powered by DeepSeek,
  plus deterministic fallback tools.

The product is frontend-led. The core object is a lightweight MIDI-like
arrangement, not one-shot button audio. Buttons and pads are input methods for
creating clips; the demo value is seeing editable MIDI clips become a fuller
arrangement.

## 2. Technology Decisions

- Frontend shell: React + TypeScript first, then Tauri wrapper.
- Audio engine: Tone.js.
- Editing model: lightweight MIDI clips rendered in a piano-roll / clip-lane
  interface. Do not build a full DAW, but every generated result must be real
  structured note data that can be displayed, transformed, and played.
- Piano-roll UI is a trust-building view for the selected track or clip, not
  the product core. It may support small local edits when already implemented,
  but the MVP must not grow into a full MIDI editor.
- Piano-roll pitch display should feel broader than the old three-octave toy,
  but demo-safe validation keeps playable agent output inside `C2..C6`.
  Sharps/flats are allowed when Tone.js can play them.
- Backend runtime: Node/TypeScript service layer exposed through local HTTP
  routes or Tauri commands. Prefer local HTTP during early development because
  it is easier for all workstreams to test.
- Base model: DeepSeek.
- Agent framework: custom single-agent orchestrator for MVP.
- LangGraph: do not use in MVP unless the custom orchestrator becomes a
  blocker. It is valid as a post-MVP migration path.

## 3. Open Source References

Use these projects as reference material only. Do not fork or copy large
subsystems into the MVP.

- two-moons / MoaRoll: primary reference for the piano-roll look and interaction
  feel. Borrow visual ideas, keyboard/grid layout, and playhead/scrub behavior.
  Do not import its MobX store, seconds-based timing model, instrument registry,
  or MIDI export pipeline.
- openDAW: useful reference for a modern web DAW layout and ambition, but too
  large for this MVP and risky to integrate under hackathon time pressure.
- GridSound DAW: useful reference for browser DAW concepts, but too large and
  license-sensitive for direct reuse.
- drumhaus: useful reference for React + Tone.js drum machine interactions.
- step-sequencer / tonejs-sequencer examples: useful reference for simple
  grid/step sequencing and Tone.js scheduling.

MVP rule: borrow interaction ideas and data-shape inspiration, but implement a
small custom editor.

## 4. Arrangement Model

All layers pass arrangement data in this shape.

```ts
export type TrackKind = "drums" | "bass" | "guitar" | "keys";
export type StyleId = "pop" | "lofi" | "rock";
export type MoodId = "bright" | "soft" | "energetic";
export type ClipKind = "midi" | "drum";
export type AgentAction = "complete" | "increase" | "soften" | "fill_clip" | "variation";
export type QuantizeGrid = 1 | 2 | 4 | 8 | 16;
export type ScaleType = "major" | "minor";

export interface ScaleConfig {
  root: string; // pitch letter, e.g. "C", "F#", "Bb"
  type: ScaleType;
}

export interface ArrangementProject {
  id: string;
  title: string;
  tempo: number;
  bars: 8;
  beatsPerBar: 4;
  subdivision: 4;
  style: StyleId;
  mood: MoodId;
  scale?: ScaleConfig;
  tracks: Track[];
  selectedClipId?: string;
  lastExplanation?: AgentExplanation;
}

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
  color: string;
  muted: boolean;
  clips: Clip[];
}

export interface Clip {
  id: string;
  kind: ClipKind;
  name: string;
  barStart: number;
  barLength: number;
  loop: boolean;
  quantize: QuantizeGrid;
  notes: NoteEvent[];
  drumHits: DrumHit[];
}

export interface NoteEvent {
  id: string;
  pitch: string;
  step: number;
  durationSteps: number;
  velocity: number;
  lane?: number;
}

export interface DrumHit {
  id: string;
  drum: "kick" | "snare" | "hihat" | "clap";
  step: number;
  velocity: number;
  durationSteps?: number;
}

export interface SeedPattern {
  sourceTrackKind: TrackKind;
  sourceClipId?: string;
  capturedAt: string;
  notes: NoteEvent[];
  drumHits: DrumHit[];
  style: StyleId;
  mood: MoodId;
  tempo: number;
}

export interface AgentExplanation {
  summary: string;
  changes: string[];
}

export interface MidiEdit {
  type: "add_note" | "remove_note" | "move_note" | "resize_note" | "set_velocity";
  trackId: string;
  clipId: string;
  noteId?: string;
  note?: NoteEvent;
  step?: number;
  durationSteps?: number;
  velocity?: number;
}
```

Timing rules:

- 8 bars only.
- 4 beats per bar.
- 4 subdivisions per beat.
- Total steps: `8 * 4 * 4 = 128`.
- `step` is zero-based and must be between `0` and `127`.
- `velocity` is a float from `0` to `1`.
- Clips are the user-visible editing units. A track can contain one or more
  clips, and the MVP may start with one 8-bar clip per track.
- `Clip.kind` is `drum` for drum-grid clips and `midi` for pitched clips.
- `NoteEvent` and `DrumHit` are lightweight MIDI events. Agent output must
  modify these events, not merely trigger audio playback.
- Pitched `NoteEvent.pitch` values must be valid note names such as `C4`,
  `F#3`, or `Bb5` and stay within `C2..C6`. Agent output should keep each
  instrument in a friendly musical range: bass near octave 2, guitar around
  octaves 3-4, and keys around octaves 3-6.
- `quantize` defines the intended editing grid. MVP default is `4`, meaning
  sixteenth-note steps in the current 128-step timeline.
- `scale` is an optional `{ root, type }` hint (`type` is `"major"` | `"minor"`)
  used only for in-scale row highlighting in the piano roll. It does not affect
  playback or validation. The frontend defaults to C major when absent.

## 5. Agent Action API

The frontend talks to the backend. The backend talks to the arrangement agent.

The frontend must treat generated arrangements as candidates first. A generated
candidate can be auditioned, regenerated, discarded, or explicitly applied by
the user. Do not overwrite the current `ArrangementProject` merely because an
agent call succeeded.

### POST /api/arrange/complete

Request:

```ts
{
  seed: SeedPattern;
  currentProject?: ArrangementProject;
}
```

Response:

```ts
{
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "deepseek" | "fallback";
}
```

### POST /api/arrange/energy

Request:

```ts
{
  project: ArrangementProject;
  direction: "increase" | "soften";
}
```

Response:

```ts
{
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "deepseek" | "fallback";
}
```

### Local MIDI edit service

MVP note: local MIDI edits are optional polish. They must stay small and must
not become a full piano-roll editor. The demo path should still work if this
service is limited to add/remove/move basics or is hidden behind existing UI.

The frontend may call local TypeScript service functions directly in the
browser-first MVP:

```ts
{
  project: ArrangementProject;
  edits: MidiEdit[];
}
```

Response:

```ts
{
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "local";
}
```

Required behavior:

- Apply edits immutably.
- Clamp steps to `0..127`.
- Clamp note duration to at least `1`.
- Clamp velocity to `0..1`.
- Preserve clip identity so the piano-roll UI can keep selection.

## 6. Validation Rules

The backend must validate all agent output before returning it to the frontend.

Reject or repair:

- Unknown track kind.
- Unknown style or mood.
- Notes or hits outside steps `0..127`.
- Malformed pitched note names or pitches outside `C2..C6`.
- Velocity outside `0..1`.
- Clip start/length outside the 8-bar project.
- Clip without `kind`, `name`, `loop`, or `quantize`.
- Notes with duration below `1`.
- Drum clips containing pitched notes unless intentionally used as a hybrid
  preview; MVP should keep drum hits in `drumHits`.
- Missing drum, bass, guitar, or keys track after arrangement completion.
- Empty arrangement after `complete`.

If validation fails, backend must return a deterministic fallback arrangement
instead of surfacing a broken response.

## 7. DeepSeek Contract

DeepSeek is the base model. Use an OpenAI-compatible client if available in the
chosen SDK stack.

Environment variable:

```bash
DEEPSEEK_API_KEY=...
```

Model default:

```text
deepseek-chat
```

Prompting rule:

- Ask the model for JSON only.
- Validate the JSON with the shared schema.
- Never let raw model text mutate frontend state.
- Always preserve a local fallback path.
- Model output must be interpreted as MIDI edits or a complete
  `ArrangementProject`. Never accept free-text descriptions as the source of
  truth for musical state.

## 8. Web Reference Contract

The arrangement agent may use web search as a narrow style-reference layer, not
as a general chat capability.

Allowed use:

- Tempo, groove, instrumentation, and arrangement-role hints.
- Contemporary style vocabulary that helps map user language to the four-track
  PlayBand model.

Required behavior:

- Time out quickly and fall back to local style references.
- Never require web search for the demo path.
- Never copy a specific song melody or return scraped text as musical state.
- Always convert references back into validated `ArrangementProject` JSON.
- Project-off-topic chat must be refused briefly instead of searched.

## 9. Ownership Boundaries

Frontend agent owns:

- UI components.
- User input capture.
- Client state rendering.
- Tone.js playback scheduling.
- Calling backend APIs.

App backend agent owns:

- API route implementation.
- DeepSeek client wrapper.
- Request/response validation.
- Fallback routing when model fails.
- Local project serialization if needed.

Arrangement agent owns:

- Music generation rules.
- Agent prompt.
- Tool/action definitions.
- Deterministic fallback generator.
- Complete, increase, and soften transformations.
- Output explanations.

No agent should duplicate another agent's core logic. If duplication seems
tempting, add a shared helper or update this contract.

## 9. Integration Checkpoints

The first demo only requires complete, increase, and soften. `fill_clip`,
`variation`, and richer local MIDI edits are post-demo options unless the user
explicitly asks for them.

Checkpoint 1:

- Backend returns a static valid `ArrangementProject`.
- Frontend can render and play it.

Checkpoint 2:

- Frontend captures `SeedPattern`.
- Backend receives it and returns fallback `complete` result.

Checkpoint 3:

- DeepSeek-backed `complete` result works.
- Invalid DeepSeek result falls back without breaking UI.

Checkpoint 4:

- `increase` and `soften` actions visibly and audibly change the project.
