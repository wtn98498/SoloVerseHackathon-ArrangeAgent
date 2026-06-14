import { ArrangementProject, DrumHit, NoteEvent } from '../contracts';
import { createClip } from '../contracts/clip';

type DrumName = DrumHit['drum'];

const progression = [
  { root: 'C2', guitar: ['C3', 'E3', 'G3'], keys: ['C4', 'E4', 'G4'] },
  { root: 'G2', guitar: ['G3', 'B3', 'D4'], keys: ['G3', 'B3', 'D4'] },
  { root: 'A2', guitar: ['A3', 'C4', 'E4'], keys: ['A3', 'C4', 'E4'] },
  { root: 'F2', guitar: ['F3', 'A3', 'C4'], keys: ['F3', 'A3', 'C4'] },
];

const hook = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5'];

function drum(id: number, drumName: DrumName, step: number, velocity: number): DrumHit {
  return { id: `dh-${id}`, drum: drumName, step, velocity };
}

function note(id: string, pitch: string, step: number, durationSteps: number, velocity: number): NoteEvent {
  return { id, pitch, step, durationSteps, velocity };
}

function buildDrumHits(): DrumHit[] {
  let id = 1;
  const hits: DrumHit[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 16;
    const isFillBar = bar === 3 || bar === 7;
    const kicks = bar % 2 === 0 ? [0, 6, 10] : [0, 7, 11];
    const snares = isFillBar ? [8, 14] : [8];

    kicks.forEach((offset) => hits.push(drum(id++, 'kick', base + offset, offset === 0 ? 0.9 : 0.76)));
    snares.forEach((offset) => hits.push(drum(id++, 'snare', base + offset, offset === 8 ? 0.84 : 0.68)));

    for (let offset = 0; offset < 16; offset += 2) {
      hits.push(drum(id++, 'hihat', base + offset, offset % 4 === 0 ? 0.58 : 0.42));
    }

    if (bar % 2 === 1) {
      hits.push(drum(id++, 'clap', base + 8, 0.45));
    }

    if (isFillBar) {
      hits.push(drum(id++, 'snare', base + 12, 0.58));
      hits.push(drum(id++, 'kick', base + 15, 0.72));
      hits.push(drum(id++, 'clap', base + 14, 0.5));
    }
  }

  return hits;
}

function buildBassNotes(): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const patterns = [
    ['C2', 'C2', 'E2', 'G2'],
    ['G2', 'G2', 'B2', 'D3'],
    ['A2', 'A2', 'C3', 'E3'],
    ['F2', 'F2', 'A2', 'C3'],
  ];

  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 16;
    const pattern = patterns[bar % patterns.length];
    const steps = [0, 5, 8, 12];
    pattern.forEach((pitch, index) => {
      notes.push(note(`bn-${bar}-${index}`, pitch, base + steps[index], index === 0 ? 5 : 3, index === 0 ? 0.78 : 0.68));
    });
    if (bar === 3 || bar === 7) {
      notes.push(note(`bn-fill-${bar}-1`, 'G2', base + 14, 2, 0.66));
      notes.push(note(`bn-fill-${bar}-2`, bar === 7 ? 'C3' : 'A2', base + 15, 1, 0.62));
    }
  }

  return notes;
}

function buildGuitarNotes(): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const strumSteps = [0, 4, 10];

  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 16;
    const chord = progression[bar % progression.length].guitar;
    strumSteps.forEach((offset, strumIndex) => {
      chord.forEach((pitch, voiceIndex) => {
        notes.push(note(`gn-${bar}-${strumIndex}-${voiceIndex}`, pitch, base + offset, strumIndex === 2 ? 5 : 4, strumIndex === 0 ? 0.7 : 0.58));
      });
    });
    if (bar % 2 === 0) {
      notes.push(note(`gn-riff-${bar}-1`, chord[2], base + 7, 2, 0.5));
      notes.push(note(`gn-riff-${bar}-2`, chord[1], base + 14, 2, 0.48));
    }
  }

  return notes;
}

function buildKeyNotes(): NoteEvent[] {
  const notes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 16;
    const chord = progression[bar % progression.length].keys;
    chord.forEach((pitch, voiceIndex) => {
      notes.push(note(`kn-pad-${bar}-${voiceIndex}`, pitch, base, 14, 0.44));
    });

    const hookStart = bar % 2 === 0 ? 6 : 4;
    [0, 1, 2, 3].forEach((hookIndex) => {
      const pitch = hook[(bar + hookIndex) % hook.length];
      notes.push(note(`kn-hook-${bar}-${hookIndex}`, pitch, base + hookStart + hookIndex * 2, 2, 0.56));
    });
  }

  return notes;
}

export const fixtureProject: ArrangementProject = {
  id: 'fixture-001',
  title: 'Neon Playground Loop',
  tempo: 132,
  bars: 8,
  beatsPerBar: 4,
  subdivision: 4,
  style: 'pop',
  mood: 'energetic',
  scale: { root: 'C', type: 'major' },
  tracks: [
    {
      id: 'track-drums',
      kind: 'drums',
      name: 'Drums',
      color: '#ff6b6b',
      muted: false,
      clips: [createClip({
        id: 'clip-drums',
        kind: 'drum',
        name: 'Drums MIDI Clip',
        notes: [],
        drumHits: buildDrumHits(),
      })],
    },
    {
      id: 'track-bass',
      kind: 'bass',
      name: 'Bass',
      color: '#4ecdc4',
      muted: false,
      clips: [createClip({
        id: 'clip-bass',
        kind: 'midi',
        name: 'Bass MIDI Clip',
        notes: buildBassNotes(),
        drumHits: [],
      })],
    },
    {
      id: 'track-guitar',
      kind: 'guitar',
      name: 'Guitar',
      color: '#ffe66d',
      muted: false,
      clips: [createClip({
        id: 'clip-guitar',
        kind: 'midi',
        name: 'Guitar MIDI Clip',
        notes: buildGuitarNotes(),
        drumHits: [],
      })],
    },
    {
      id: 'track-keys',
      kind: 'keys',
      name: 'Keys',
      color: '#a8dadc',
      muted: false,
      clips: [createClip({
        id: 'clip-keys',
        kind: 'midi',
        name: 'Keys MIDI Clip',
        notes: buildKeyNotes(),
        drumHits: [],
      })],
    },
  ],
  lastExplanation: {
    summary: '演示项目已加载：一段更完整的 8 小节 Pop/Rock 乐队 loop。',
    changes: [
      '鼓组加入切分、反拍 hi-hat 和第 4/8 小节 fill',
      '贝斯跟随 C-G-Am-F 走向并加入经过音',
      '吉他用三音和弦扫弦支撑节奏',
      'Keys 同时提供铺底和高音 hook',
    ],
  },
};
