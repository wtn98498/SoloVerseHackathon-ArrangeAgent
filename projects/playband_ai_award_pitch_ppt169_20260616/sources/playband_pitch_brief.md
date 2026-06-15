# PlayBand AI Award Pitch Brief

## Project

PlayBand AI is a hackathon prototype for people who have musical taste but do not know music theory or professional DAW tools.

Core promise: Play first. Arrange later.

Elevator line: Play a tiny idea. Watch an AI music director turn it into a band.

Memorable judge moment: I tapped a beat, and the agent turned it into a band.

Team: 欧比克莱歌剧院

Author: 温添宁

Hackathon alias: scala

Live demo: https://wenwen.zone/playband/

Repository: https://github.com/wtn98498/SoloVerseHackathon-ArrangeAgent

## Problem

AI music generation often feels like a black box: type a prompt, wait, receive a finished audio file. Traditional DAWs are the opposite: powerful but intimidating for people who do not understand tracks, clips, piano rolls, harmony, or plugins.

The underserved user is the person with musical taste but no theory vocabulary. They can tap, feel, and describe a vibe, but they cannot translate that intuition into drums, bass, guitar, and keys.

## Solution

PlayBand AI turns small human input into structured musical material. The user taps a few seconds of rhythm, the app captures it as lightweight MIDI-like events, and a music director agent expands it into an 8-bar four-track band loop.

The product is not "AI makes a song for you." It is "you start the music, AI arranges with you."

## Demo Path

1. Open the live demo.
2. Choose a playful start.
3. Capture a short drum seed with pads.
4. Convert it into MIDI-like events.
5. Ask the music director to complete the arrangement.
6. Audition the candidate before applying it.
7. Ask a follow-up such as "faster, like a pitch intro" or "softer, leave room for melody."

## Technical Shape

- React 18 and TypeScript.
- Vite web app with deployable browser fallback.
- Tone.js for playback.
- Custom lightweight MIDI-like JSON model.
- Four tracks: drums, bass, guitar, keys.
- 8 bars, 128 sixteenth-note steps.
- Agent action boundary: complete arrangement, increase energy, soften arrangement, explain changes.
- Deterministic local music director fallback keeps the live demo reliable without an API key.
- DeepSeek-ready service boundary for post-demo model integration.

## Why It Can Win

Most AI music demos impress once, then leave the user outside the creative process. PlayBand AI creates a story judges can retell: a few taps become a band, and the user stays in control.

The product balances hackathon reliability with a genuinely interactive creative loop: playful input, visible music data, preview-first agent output, and multi-turn taste direction.

## Future

- Real model-powered arrangement behind the same candidate preview contract.
- Style packs such as lo-fi, rock, pop, and Chinese instrument packs.
- More expressive clip editing without becoming a full DAW.
- Export to MIDI or stems after the core loop is proven.
- Community seed sharing: tiny riffs become remixable starting points.
