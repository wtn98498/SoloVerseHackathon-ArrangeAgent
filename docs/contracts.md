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

The product is frontend-led. The user-facing loop must work even when the model
API fails.

## 2. Technology Decisions

- Frontend shell: React + TypeScript first, then Tauri wrapper.
- Audio engine: Tone.js.
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

- openDAW: useful reference for a modern web DAW layout and ambition, but too
  large for this MVP.
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

export interface ArrangementProject {
  id: string;
  title: string;
  tempo: number;
  bars: 8;
  beatsPerBar: 4;
  subdivision: 4;
  style: StyleId;
  mood: MoodId;
  tracks: Track[];
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
  barStart: number;
  barLength: number;
  notes: NoteEvent[];
  drumHits: DrumHit[];
}

export interface NoteEvent {
  id: string;
  pitch: string;
  step: number;
  durationSteps: number;
  velocity: number;
}

export interface DrumHit {
  id: string;
  drum: "kick" | "snare" | "hihat" | "clap";
  step: number;
  velocity: number;
}

export interface SeedPattern {
  sourceTrackKind: TrackKind;
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
```

Timing rules:

- 8 bars only.
- 4 beats per bar.
- 4 subdivisions per beat.
- Total steps: `8 * 4 * 4 = 128`.
- `step` is zero-based and must be between `0` and `127`.
- `velocity` is a float from `0` to `1`.

## 5. Agent Action API

The frontend talks to the backend. The backend talks to the arrangement agent.

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

## 6. Validation Rules

The backend must validate all agent output before returning it to the frontend.

Reject or repair:

- Unknown track kind.
- Unknown style or mood.
- Notes or hits outside steps `0..127`.
- Velocity outside `0..1`.
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

## 8. Ownership Boundaries

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
- Output explanations.

No agent should duplicate another agent's core logic. If duplication seems
tempting, add a shared helper or update this contract.

## 9. Integration Checkpoints

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
