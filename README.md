# PlayBand AI

**Play a tiny idea. Watch an AI music director turn it into a band.**

PlayBand AI is a hackathon prototype for people who have musical taste but do
not know music theory or professional DAW tools. Instead of asking AI for a
black-box song, the user taps a small rhythm, sees it become structured
MIDI-like clips, and then collaborates with a demo-safe music director over
multiple rounds.

- **Live demo:** https://wenwen.zone/playband/
- **Repository:** https://github.com/wtn98498/SoloVerseHackathon-ArrangeAgent
- **Core promise:** Play first. Arrange later.

![PlayBand AI opening screen](public/readme/01-start.png)

## Why It Should Win

Most AI music demos hide the creative process: type a prompt, wait, receive an
audio file. That is impressive once, but it does not feel like making music.

PlayBand AI keeps the human in the loop:

- The user starts with a physical, playful action: a few taps.
- The app records that action as editable musical data, not just sound.
- The agent completes the idea into drums, bass, guitar, and keys.
- Every generation becomes a preview first, so the user can audition, reject,
  apply, or keep talking.

The memorable moment is simple enough for a judge to retell:

> "I tapped a beat, and the agent turned it into a band."

## Demo Story

### 1. Start From A Blank Studio

The app opens like a music toy, not a professional DAW. The user can begin from
nothing or ask for a starter groove.

![Blank PlayBand studio](public/readme/02-blank-studio.png)

### 2. Capture A Human Seed

The user opens the capture pad and taps a few drum hits. The app shows the seed
as timing data immediately, which makes the AI result feel grounded in the
user's own input.

![Capturing a drum seed](public/readme/03-capture-seed.png)

### 3. Let The Music Director Complete The Band

After the seed enters the timeline, the local Music Director creates a candidate
arrangement. It explains what changed, what to listen for, and what the next
creative move should be.

![Agent-generated arrangement candidate](public/readme/05-agent-candidate.png)

### 4. Keep Talking

The user can continue with natural language: "make it more like a pitch intro",
"faster", "softer", or "leave room for the melody". The agent keeps the music
workflow alive across turns.

![Multi-turn music direction](public/readme/06-multiturn-agent.png)

## The 60-Second Judge Demo

1. Open https://wenwen.zone/playband/.
2. Choose **随便玩玩**.
3. Click **捕获律动** and tap Kick, HiHat, Snare, Clap.
4. Click **捕获进 MIDI**.
5. Click **补全编曲**.
6. Audition the candidate.
7. Click **放进编曲**.
8. Ask the agent: `再快一点，像路演开场一样更抓耳`.
9. Apply that version, then ask: `再柔和一点，给主旋律留出呼吸`.

That flow shows the whole product in under a minute: playful input, structured
music data, agent reasoning, preview-first control, and multi-turn taste.

## What Works Now

- Four-track arrangement surface: drums, bass, guitar, and keys.
- Browser audio playback with Tone.js.
- Pad capture flow that turns taps into MIDI-like events.
- Piano-roll-style visualization for trust and lightweight editing.
- Agent preview cards with audition, apply, retry, and discard actions.
- Multi-turn music requests such as faster, softer, more energetic, or more
  like an opening section.
- Demo-safe deterministic music generation, so the live link still works without
  an API key.
- Living-artist style requests are redirected into broader musical traits
  instead of direct imitation.

## Music Director Design

The public demo is deliberately local-first. It does not pretend that a remote
model is always available; instead, it uses a deterministic music director that
routes musical intent into reliable actions:

- **Complete arrangement:** expand a seed into an 8-bar band loop.
- **Increase energy:** raise intensity, velocity, and rhythmic density.
- **Soften arrangement:** create more space and reduce pressure.
- **Respond as a music director:** explain what changed and suggest the next
  listening decision.

This makes the demo dependable. Different style and mood requests change the
actual MIDI event shape: drum placement, harmonic roots, bass movement, guitar
texture, and keyboard density.

## Technical Shape

PlayBand AI uses a lightweight MIDI-like JSON model instead of a full DAW
engine. The central object is an `ArrangementProject` with:

- `tempo`, `style`, `mood`, and 8 bars
- four `Track` objects
- `Clip` objects containing `NoteEvent` or `DrumHit` data
- 128 sixteenth-note steps per arrangement

That structure matters because the AI result is visible, playable, and
transformable. It is not just a generated audio blob.

## Stack

- React 18
- TypeScript
- Vite
- Tone.js
- Custom local arrangement engine
- DeepSeek-ready service boundary for post-demo model integration

## Run Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL, usually:

```text
http://127.0.0.1:5173/
```

Useful checks:

```bash
npm run typecheck
npm run build
VITE_BASE_PATH=/playband/ npm run build
```

## Optional AI Key

The submitted live demo works without a model key. To experiment with the
DeepSeek chat/proxy path locally, create a local environment file from
`.env.example` and set:

```text
DEEPSEEK_API_KEY=your_api_key_here
```

Do not commit real API keys.

## Hackathon Scope

This is not a full DAW. The MVP intentionally avoids plugin hosting, accounts,
cloud sync, collaboration, large sample libraries, and complex export flows.

The goal is one unforgettable product moment:

**A few taps become a band, and the user stays in control.**
