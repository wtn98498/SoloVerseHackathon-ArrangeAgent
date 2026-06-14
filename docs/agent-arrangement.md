# Arrangement Agent Brief

Read `docs/contracts.md` first. That file is the source of truth.

## Mission

Build the single arrangement agent for PlayBand AI.

This is not a multi-agent system. For the MVP, the arrangement agent is one
orchestrator that chooses from a small set of tools and returns structured
arrangement JSON.

The arrangement agent works on lightweight MIDI clips. The output must be
editable note/drum-hit data for the piano-roll UI, not one-shot audio triggers.

## Scope

Own:

- Music arrangement rules.
- DeepSeek prompt for arrangement.
- Tool/action definitions.
- Deterministic fallback generator.
- `completeArrangement`
- `increaseEnergy`
- `softenArrangement`
- Plain-language explanations.

Post-demo only unless explicitly requested:

- `fillClip`
- `createVariation`
- Region-level MIDI edit proposals.

Do not own:

- HTTP route plumbing.
- DeepSeek API key management.
- UI rendering.
- Tone.js playback implementation.

## Framework Decision

Use a custom lightweight orchestrator for MVP.

Do not use LangGraph in the first build. LangGraph is powerful, but the MVP
only needs a single agent with three actions. A custom orchestrator is easier
to debug under hackathon time pressure.

Allowed MVP shape:

```ts
type AgentAction = "complete" | "increase" | "soften";

async function runArrangementAgent(input: {
  action: AgentAction;
  seed?: SeedPattern;
  project?: ArrangementProject;
  direction?: "increase" | "soften";
}): Promise<{
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "deepseek" | "fallback";
}>
```

## Tool Set

The agent may use these internal tools:

- `deriveKeyAndScale(seed)`
- `buildDrumPattern(seed, style, mood)`
- `buildBassline(chords, style, mood)`
- `buildGuitarPart(chords, style, mood)`
- `buildKeysPart(chords, style, mood)`
- `increaseEnergy(project)`
- `softenArrangement(project)`
- `quantizeNotes(project, grid)`
- `explainChanges(before, after)`

These tools can be plain TypeScript functions. They do not need to be model
tools in the MVP.

`fillClip` and `createVariation` are post-demo tools. Do not implement them
until the main 90-second flow is stable.

## Music Rules

Keep the musical system small:

- Styles: `pop`, `lofi`, `rock`.
- Moods: `bright`, `soft`, `energetic`.
- Default key: C major if seed is unclear.
- Length: 8 bars.
- Clip model: one or more editable MIDI clips per track.
- Default MVP clip: one 8-bar clip per track.
- Drum clips use `drumHits`; pitched clips use `notes`.
- Pitched notes must use valid note names inside `C2..C6`. Keep bass around
  octave 2, guitar around octaves 3-4, and keys around octaves 3-6.
  Sharps/flats are allowed when they fit the style.
- Drums: clear downbeat and backbeat.
- Bass: follow root notes and simple passing notes.
- Guitar: strums or short riffs, not complex realism.
- Keys: chords and simple melodic support.

Fallback chord palettes:

- Pop bright: C - G - Am - F.
- Lo-fi soft: Cmaj7 - Am7 - Dm7 - G7.
- Rock energetic: C - F - G - F.

## DeepSeek Prompt Requirements

Prompt must tell DeepSeek:

- Return JSON only.
- Use the shared `ArrangementProject` shape.
- Preserve and emit clip metadata: `kind`, `name`, `loop`, `quantize`.
- Keep all steps in `0..127`.
- Keep note durations at least `1`.
- Keep velocity in `0..1`.
- Always include drums, bass, guitar, and keys.
- Include a short explanation with `summary` and `changes`.

The prompt should be short and strict. Do not ask the model for broad creative
essay output.

## Deliverables

- Deterministic fallback generator.
- DeepSeek prompt builder.
- Agent orchestration function.
- Energy increase transformer.
- Soften transformer.
- Explanation generator.

## Integration Tests To Perform

- Complete arrangement from empty drum seed.
- Complete arrangement from keyboard seed.
- Increase energy modifies drums and note density.
- Soften reduces density and velocity.
- All outputs pass shared validation.
