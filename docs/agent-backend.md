# App Backend Agent Brief

Read `docs/contracts.md` first. That file is the source of truth.

## Mission

Build the service layer that connects the frontend editor to the arrangement
agent and DeepSeek.

The backend must make integration boring: stable endpoints, validated responses,
and deterministic fallback whenever the model fails.

The backend serves a lightweight MIDI editor model. It must validate and apply
structured clip/note edits. It is not enough to trigger audio or return a text
description of a change.

MVP scope is complete, increase, and soften. Local MIDI edits are optional
polish and must remain small; do not turn the backend into a full MIDI editor.

## Scope

Own:

- `/api/arrange/complete`
- `/api/arrange/energy`
- Local MIDI edit service for minimal piano-roll note edits, if needed.
- DeepSeek client wrapper.
- Request validation.
- Agent response validation.
- Fallback routing.
- Shared fixtures for integration.

Do not own:

- UI components.
- Tone.js playback.
- Music generation policy beyond calling the arrangement agent.
- Prompt writing beyond passing the arrangement agent prompt.

## Runtime Direction

Use Node/TypeScript local routes first. If the project later wraps in Tauri,
keep the same backend functions callable from Tauri commands or local HTTP.

Required env:

```bash
DEEPSEEK_API_KEY=...
```

If `DEEPSEEK_API_KEY` is missing, endpoints must still return fallback results.

## Endpoint Behavior

### POST /api/arrange/complete

Input:

- `seed: SeedPattern`
- optional `currentProject: ArrangementProject`

Output:

- `project: ArrangementProject`
- `explanation: AgentExplanation`
- `source: "deepseek" | "fallback"`

Required behavior:

- Validate request.
- Call arrangement service.
- Validate returned project.
- Preserve clip metadata (`kind`, `name`, `loop`, `quantize`) so the frontend
  piano-roll can keep rendering editable clips.
- Fall back if model call, JSON parsing, or schema validation fails.

### POST /api/arrange/energy

Input:

- `project: ArrangementProject`
- `direction: "increase" | "soften"`

Output:

- `project: ArrangementProject`
- `explanation: AgentExplanation`
- `source: "deepseek" | "fallback"`

Required behavior:

- Validate request.
- Apply requested transformation through arrangement service.
- Validate returned project.
- Ensure the transformation changes MIDI events, such as velocity, density,
  note duration, or clip content.
- Fall back if needed.

### Local MIDI edit service

Input:

- `project: ArrangementProject`
- `edits: MidiEdit[]`

Output:

- `project: ArrangementProject`
- `explanation: AgentExplanation`
- `source: "local"`

Required behavior:

- Apply edits immutably.
- Clamp step, duration, and velocity.
- Preserve track and clip identity.
- Reject unsafe edit results by returning the original project with an
  explanation.

## DeepSeek Wrapper

Expose one internal function:

```ts
async function callDeepSeekJson<T>(messages: Message[]): Promise<T>
```

Rules:

- Use `deepseek-chat` by default.
- Request JSON-only output.
- Time out quickly enough for demo safety.
- Return typed parsed JSON or throw.
- Never return partial model text to the frontend.

## Deliverables

- API routes implemented.
- Local fallback works with no API key.
- DeepSeek call path hidden behind one wrapper.
- Validation utility shared by both endpoints.
- Minimal MIDI edit service for local piano-roll edits, only if the current UI
  needs it for the demo.
- At least one fixture project and one fixture seed.

## Integration Tests To Perform

- Call complete endpoint with fixture seed and no API key.
- Call energy endpoint with fixture project and no API key.
- Force malformed model output and verify fallback.
- Verify returned project always has four tracks.
- Apply add/move/resize/velocity MIDI edits to a fixture clip and verify the
  project still passes validation.
