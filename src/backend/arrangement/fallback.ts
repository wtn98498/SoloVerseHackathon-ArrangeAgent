import { ArrangementProject, SeedPattern, AgentExplanation, DrumHit, NoteEvent, MoodId, StyleId } from '../../contracts';
import { createClip } from '../../contracts/clip';

let idCounter = 0;

function generateId(prefix = 'gen'): string {
  return `${prefix}-${idCounter++}`;
}

const TRACK_COLORS = {
  drums: '#e60012',
  bass: '#16c265',
  guitar: '#ebc300',
  keys: '#37b4ff',
};

const TEMPO_BY_MOOD: Record<MoodId, number> = {
  bright: 112,
  soft: 92,
  energetic: 132,
};

const DRUM_PATTERNS: Record<StyleId, Record<MoodId, Record<DrumHit['drum'], number[]>>> = {
  pop: {
    bright: {
      kick: [0, 8],
      snare: [4, 12],
      hihat: [2, 6, 10, 14],
      clap: [],
    },
    soft: {
      kick: [0, 10],
      snare: [4],
      hihat: [6, 14],
      clap: [],
    },
    energetic: {
      kick: [0, 6, 8, 14],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      clap: [12],
    },
  },
  lofi: {
    bright: {
      kick: [0, 10],
      snare: [5, 13],
      hihat: [3, 7, 11, 15],
      clap: [],
    },
    soft: {
      kick: [0],
      snare: [5],
      hihat: [7, 15],
      clap: [],
    },
    energetic: {
      kick: [0, 7, 10],
      snare: [5, 13],
      hihat: [3, 6, 9, 12, 15],
      clap: [13],
    },
  },
  rock: {
    bright: {
      kick: [0, 8, 11],
      snare: [4, 12],
      hihat: [0, 4, 8, 12],
      clap: [],
    },
    soft: {
      kick: [0, 11],
      snare: [4, 12],
      hihat: [2, 10],
      clap: [],
    },
    energetic: {
      kick: [0, 3, 8, 11, 14],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      clap: [4, 12],
    },
  },
};

const PROGRESSIONS: Record<StyleId, Record<MoodId, string[][]>> = {
  pop: {
    bright: [['C2', 'C3', 'E3', 'G3'], ['G2', 'G3', 'B3', 'D4'], ['A2', 'A3', 'C4', 'E4'], ['F2', 'F3', 'A3', 'C4']],
    soft: [['F2', 'F3', 'A3', 'C4'], ['C2', 'C3', 'E3', 'G3'], ['D2', 'D3', 'F3', 'A3'], ['G2', 'G3', 'B3', 'D4']],
    energetic: [['C2', 'C3', 'E3', 'G3'], ['A2', 'A3', 'C4', 'E4'], ['F2', 'F3', 'A3', 'C4'], ['G2', 'G3', 'B3', 'D4']],
  },
  lofi: {
    bright: [['A2', 'A3', 'C4', 'E4'], ['F2', 'F3', 'A3', 'C4'], ['C2', 'C3', 'E3', 'G3'], ['G2', 'G3', 'B3', 'D4']],
    soft: [['D2', 'D3', 'F3', 'A3'], ['G2', 'G3', 'B3', 'D4'], ['C2', 'C3', 'E3', 'G3'], ['A2', 'A3', 'C4', 'E4']],
    energetic: [['A2', 'A3', 'C4', 'E4'], ['C2', 'C3', 'E3', 'G3'], ['F2', 'F3', 'A3', 'C4'], ['E2', 'E3', 'G3', 'B3']],
  },
  rock: {
    bright: [['C2', 'C3', 'G3', 'C4'], ['F2', 'F3', 'C4', 'F4'], ['G2', 'G3', 'D4', 'G4'], ['F2', 'F3', 'C4', 'F4']],
    soft: [['A2', 'A3', 'E4', 'A4'], ['F2', 'F3', 'C4', 'F4'], ['C2', 'C3', 'G3', 'C4'], ['G2', 'G3', 'D4', 'G4']],
    energetic: [['E2', 'E3', 'B3', 'E4'], ['G2', 'G3', 'D4', 'G4'], ['A2', 'A3', 'E4', 'A4'], ['C2', 'C3', 'G3', 'C4']],
  },
};

export function generateFallbackArrangement(seed: SeedPattern): { project: ArrangementProject; explanation: AgentExplanation } {
  const style = seed.style;
  const mood = seed.mood;
  const tempo = tempoFor(seed);
  const progression = PROGRESSIONS[style][mood];
  const seedDrums = seed.drumHits.length > 0 ? seed.drumHits : undefined;

  const project: ArrangementProject = {
    id: generateId('project'),
    title: `${style} ${mood} arrangement`,
    tempo,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style,
    mood,
    scale: { root: rootFromProgression(progression), type: mood === 'soft' || style === 'lofi' ? 'minor' : 'major' },
    selectedClipId: 'clip-drums',
    tracks: [
      {
        id: 'track-drums',
        kind: 'drums',
        name: 'Drums',
        color: TRACK_COLORS.drums,
        muted: false,
        clips: [createClip({
          id: 'clip-drums',
          kind: 'drum',
          name: 'Drums MIDI Clip',
          notes: [],
          drumHits: generateDrums(style, mood, seedDrums),
        })],
      },
      {
        id: 'track-bass',
        kind: 'bass',
        name: 'Bass',
        color: TRACK_COLORS.bass,
        muted: false,
        clips: [createClip({
          id: 'clip-bass',
          kind: 'midi',
          name: 'Bass MIDI Clip',
          notes: generateBassLine(style, mood, progression),
          drumHits: [],
        })],
      },
      {
        id: 'track-guitar',
        kind: 'guitar',
        name: 'Guitar',
        color: TRACK_COLORS.guitar,
        muted: false,
        clips: [createClip({
          id: 'clip-guitar',
          kind: 'midi',
          name: 'Guitar MIDI Clip',
          notes: generateGuitarLine(style, mood, progression),
          drumHits: [],
        })],
      },
      {
        id: 'track-keys',
        kind: 'keys',
        name: 'Keys',
        color: TRACK_COLORS.keys,
        muted: false,
        clips: [createClip({
          id: 'clip-keys',
          kind: 'midi',
          name: 'Keys MIDI Clip',
          notes: generateKeysLine(style, mood, progression),
          drumHits: [],
        })],
      },
    ],
    lastExplanation: undefined,
  };

  const explanation: AgentExplanation = {
    summary: `生成了 ${styleLabel(style)} · ${moodLabel(mood)} 的 8 小节编曲`,
    changes: [
      `${styleLabel(style)} 鼓型：${drumDescription(style, mood)}`,
      `和声走向：${progression.map((chord) => chord[0].replace(/[0-9]/g, '')).join(' - ')}`,
      mood === 'energetic' ? '加入更密的鼓和短音型' : mood === 'soft' ? '减少击打密度，留出旋律空间' : '保持明亮、清晰的主循环',
      seedDrums ? '保留了你敲出的 seed 重音作为开头动机' : '从空 seed 生成了稳定起点',
    ],
  };

  return { project, explanation };
}

export function generateEnergyTransformation(
  project: ArrangementProject,
  direction: 'increase' | 'soften'
): { project: ArrangementProject; explanation: AgentExplanation } {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;
  newProject.id = generateId('project');
  newProject.mood = direction === 'increase' ? 'energetic' : 'soft';
  newProject.tempo = Math.max(72, Math.min(156, project.tempo + (direction === 'increase' ? 12 : -10)));

  if (direction === 'increase') {
    intensify(newProject);
  } else {
    openSpace(newProject);
  }

  const explanation: AgentExplanation = {
    summary: direction === 'increase' ? '这版明显往前推了' : '这版把空间让出来了',
    changes: direction === 'increase'
      ? ['鼓组加了推进镲和额外 kick', '贝斯增加经过音', '吉他/键盘改成更短更抓耳的节奏']
      : ['减少镲片和拍手', '贝斯拉长成支撑线', '键盘改成长音铺底，给主旋律留呼吸'],
  };

  return { project: newProject, explanation };
}

function tempoFor(seed: SeedPattern): number {
  if (seed.tempo >= 60 && seed.tempo <= 200 && seed.tempo !== 120) return seed.tempo;
  return TEMPO_BY_MOOD[seed.mood];
}

function generateDrums(style: StyleId, mood: MoodId, seedDrums?: DrumHit[]): DrumHit[] {
  const hits: DrumHit[] = [];
  const pattern = DRUM_PATTERNS[style][mood];

  for (let bar = 0; bar < 8; bar += 1) {
    const offset = bar * 16;
    for (const drum of Object.keys(pattern) as DrumHit['drum'][]) {
      pattern[drum].forEach((step) => {
        hits.push({
          id: generateId(drum),
          drum,
          step: offset + step,
          velocity: velocityFor(drum, mood, bar),
        });
      });
    }
  }

  seedDrums?.slice(0, 8).forEach((hit, index) => {
    const step = Math.min(127, hit.step + (index < 4 ? 0 : 64));
    hits.push({
      ...hit,
      id: generateId(`seed-${hit.drum}`),
      step,
      velocity: Math.min(1, Math.max(0.35, hit.velocity + 0.08)),
    });
  });

  return sortHits(dedupeHits(hits));
}

function generateBassLine(style: StyleId, mood: MoodId, progression: string[][]): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const bars = expandedProgression(progression);

  bars.forEach((chord, bar) => {
    const root = chord[0];
    const step = bar * 16;
    if (mood === 'soft') {
      notes.push(note('bass', root, step, 14, 0.5));
      return;
    }
    if (style === 'rock') {
      [0, 4, 8, 12].forEach((offset) => notes.push(note('bass', root, step + offset, 3, mood === 'energetic' ? 0.82 : 0.68)));
      return;
    }
    if (style === 'lofi') {
      notes.push(note('bass', root, step, 7, 0.58));
      notes.push(note('bass', chord[1], step + 10, 4, 0.45));
      return;
    }
    notes.push(note('bass', root, step, 7, 0.66));
    notes.push(note('bass', chord[0], step + 8, 4, 0.54));
  });

  return notes;
}

function generateGuitarLine(style: StyleId, mood: MoodId, progression: string[][]): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const bars = expandedProgression(progression);

  bars.forEach((chord, bar) => {
    const step = bar * 16;
    if (mood === 'soft') {
      notes.push(note('guitar', chord[1], step + 6, 5, 0.38));
      notes.push(note('guitar', chord[2], step + 12, 4, 0.34));
      return;
    }
    if (style === 'rock') {
      [0, 4, 8, 12].forEach((offset) => {
        notes.push(note('guitar', chord[1], step + offset, 2, 0.72));
        notes.push(note('guitar', chord[2], step + offset, 2, 0.68));
      });
      return;
    }
    if (style === 'lofi') {
      [2, 9].forEach((offset, index) => notes.push(note('guitar', chord[index + 1], step + offset, 3, 0.42)));
      return;
    }
    [0, 6, 10].forEach((offset, index) => notes.push(note('guitar', chord[(index % 3) + 1], step + offset, 3, 0.56)));
  });

  return notes;
}

function generateKeysLine(style: StyleId, mood: MoodId, progression: string[][]): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const bars = expandedProgression(progression);

  bars.forEach((chord, bar) => {
    const step = bar * 16;
    if (mood === 'soft' || style === 'lofi') {
      chord.slice(1, 4).forEach((pitch) => notes.push(note('keys', raiseOctave(pitch), step, 14, mood === 'soft' ? 0.32 : 0.4)));
      return;
    }
    if (mood === 'energetic') {
      [0, 4, 8, 12].forEach((offset) => {
        notes.push(note('keys', raiseOctave(chord[1]), step + offset, 2, 0.52));
        notes.push(note('keys', raiseOctave(chord[2]), step + offset, 2, 0.46));
      });
      return;
    }
    [0, 8].forEach((offset) => {
      chord.slice(1, 4).forEach((pitch) => notes.push(note('keys', raiseOctave(pitch), step + offset, 4, 0.44)));
    });
  });

  return notes;
}

function intensify(project: ArrangementProject) {
  project.tracks.forEach((track) => {
    const clip = track.clips[0];
    if (track.kind === 'drums') {
      const existing = new Set(clip.drumHits.map((hit) => `${hit.drum}:${hit.step}`));
      for (let step = 2; step < 128; step += 4) {
        if (!existing.has(`hihat:${step}`)) {
          clip.drumHits.push({ id: generateId('hat-push'), drum: 'hihat', step, velocity: 0.48 });
        }
      }
      for (let step = 14; step < 128; step += 16) {
        if (!existing.has(`kick:${step}`)) {
          clip.drumHits.push({ id: generateId('kick-push'), drum: 'kick', step, velocity: 0.78 });
        }
      }
      clip.drumHits = sortHits(dedupeHits(clip.drumHits));
      return;
    }

    const additions = clip.notes
      .filter((noteEvent) => noteEvent.durationSteps >= 4)
      .slice(0, 18)
      .map((noteEvent, index) => note(track.kind, noteEvent.pitch, Math.min(127, noteEvent.step + (track.kind === 'bass' ? 8 : 2)), Math.max(2, Math.floor(noteEvent.durationSteps / 2)), Math.min(1, noteEvent.velocity + 0.12 + (index % 2) * 0.04)));
    clip.notes = sortNotes([...clip.notes.map((noteEvent) => ({ ...noteEvent, velocity: Math.min(1, noteEvent.velocity * 1.12) })), ...additions]);
  });
}

function openSpace(project: ArrangementProject) {
  project.tracks.forEach((track) => {
    const clip = track.clips[0];
    if (track.kind === 'drums') {
      clip.drumHits = sortHits(clip.drumHits
        .filter((hit) => hit.drum === 'kick' || hit.drum === 'snare' || hit.step % 16 === 6)
        .map((hit) => ({ ...hit, velocity: Math.max(0.25, hit.velocity * 0.72) })));
      return;
    }
    if (track.kind === 'bass') {
      clip.notes = sortNotes(clip.notes
        .filter((_, index) => index % 2 === 0)
        .map((noteEvent) => ({ ...noteEvent, durationSteps: Math.min(16, Math.max(noteEvent.durationSteps, 12)), velocity: Math.max(0.25, noteEvent.velocity * 0.72) })));
      return;
    }
    clip.notes = sortNotes(clip.notes
      .filter((noteEvent, index) => noteEvent.durationSteps >= 4 || index % 3 === 0)
      .map((noteEvent) => ({ ...noteEvent, durationSteps: Math.min(16, Math.max(noteEvent.durationSteps, 6)), velocity: Math.max(0.22, noteEvent.velocity * 0.68) })));
  });
}

function expandedProgression(progression: string[][]) {
  return Array.from({ length: 8 }, (_, index) => progression[index % progression.length]);
}

function note(prefix: string, pitch: string, step: number, durationSteps: number, velocity: number): NoteEvent {
  return {
    id: generateId(prefix),
    pitch,
    step: Math.max(0, Math.min(127, step)),
    durationSteps: Math.max(1, Math.min(32, durationSteps)),
    velocity: Math.max(0, Math.min(1, velocity)),
  };
}

function velocityFor(drum: DrumHit['drum'], mood: MoodId, bar: number) {
  const base = mood === 'energetic' ? 0.82 : mood === 'soft' ? 0.48 : 0.66;
  const drumLift = drum === 'kick' ? 0.1 : drum === 'snare' ? 0.06 : drum === 'clap' ? 0.02 : -0.1;
  const barLift = bar === 0 || bar === 4 ? 0.05 : 0;
  return Math.max(0.2, Math.min(1, base + drumLift + barLift));
}

function dedupeHits(hits: DrumHit[]) {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.drum}:${hit.step}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortHits(hits: DrumHit[]) {
  return hits.sort((a, b) => a.step - b.step || a.drum.localeCompare(b.drum));
}

function sortNotes(notes: NoteEvent[]) {
  return notes.sort((a, b) => a.step - b.step || a.pitch.localeCompare(b.pitch));
}

function raiseOctave(pitch: string) {
  return pitch.replace(/([A-G]#?)([0-9])/, (_match, name, octave) => `${name}${Math.min(6, Number(octave) + 1)}`);
}

function rootFromProgression(progression: string[][]): string {
  return progression[0][0].replace(/[0-9]/g, '').replace('A', 'A');
}

function styleLabel(style: StyleId) {
  if (style === 'lofi') return 'lo-fi';
  if (style === 'rock') return 'rock';
  return 'pop';
}

function moodLabel(mood: MoodId) {
  if (mood === 'energetic') return '高能';
  if (mood === 'soft') return '柔和';
  return '明亮';
}

function drumDescription(style: StyleId, mood: MoodId) {
  if (style === 'lofi') return mood === 'soft' ? '松弛半拍，少镲片' : '带摇摆感的反拍';
  if (style === 'rock') return mood === 'energetic' ? '直给八分推进' : '稳定 backbeat';
  return mood === 'energetic' ? '更密的 pop 推进' : '清楚的流行 backbeat';
}
