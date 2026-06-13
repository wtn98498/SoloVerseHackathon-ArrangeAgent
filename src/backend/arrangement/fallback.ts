import { ArrangementProject, SeedPattern, AgentExplanation, DrumHit, NoteEvent } from '../../contracts';
import { createClip } from '../../contracts/clip';

let idCounter = 0;

function generateId(): string {
  return `gen-${idCounter++}`;
}

export function generateFallbackArrangement(seed: SeedPattern): { project: ArrangementProject; explanation: AgentExplanation } {
  const project: ArrangementProject = {
    id: generateId(),
    title: `${seed.style} Loop (${seed.mood})`,
    tempo: seed.tempo,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style: seed.style,
    mood: seed.mood,
    tracks: [
      // Drums track
      {
        id: generateId(),
        kind: 'drums',
        name: 'Drums',
        color: '#ff6b6b',
        muted: false,
        clips: [createClip({
          id: generateId(),
          kind: 'drum',
          name: 'Drums MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: generateBasicDrums(seed.mood)
        })]
      },
      // Bass track
      {
        id: generateId(),
        kind: 'bass',
        name: 'Bass',
        color: '#4ecdc4',
        muted: false,
        clips: [createClip({
          id: generateId(),
          kind: 'midi',
          name: 'Bass MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: generateBassLine(seed.mood, seed.style),
          drumHits: []
        })]
      },
      // Guitar track
      {
        id: generateId(),
        kind: 'guitar',
        name: 'Guitar',
        color: '#ffe66d',
        muted: false,
        clips: [createClip({
          id: generateId(),
          kind: 'midi',
          name: 'Guitar MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: generateGuitarLine(seed.mood, seed.style),
          drumHits: []
        })]
      },
      // Keys track
      {
        id: generateId(),
        kind: 'keys',
        name: 'Keys',
        color: '#a8dadc',
        muted: false,
        clips: [createClip({
          id: generateId(),
          kind: 'midi',
          name: 'Keys MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: generateKeysLine(seed.mood, seed.style),
          drumHits: []
        })]
      }
    ],
    lastExplanation: undefined
  };

  const explanation: AgentExplanation = {
    summary: `生成了一个基础 ${seed.style} 风格的编曲`,
    changes: [
      '创建了 4 个乐器轨道',
      '根据种子模式生成节奏',
      '应用情绪风格',
      '确保 8 小节结构'
    ]
  };

  return { project, explanation };
}

export function generateEnergyTransformation(
  project: ArrangementProject,
  direction: 'increase' | 'soften'
): { project: ArrangementProject; explanation: AgentExplanation } {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;
  newProject.id = generateId();

  const velocityMultiplier = direction === 'increase' ? 1.2 : 0.8;

  // Apply velocity changes to all tracks
  newProject.tracks.forEach(track => {
    track.clips.forEach(clip => {
      clip.notes.forEach(note => {
        note.velocity = Math.min(1, Math.max(0, note.velocity * velocityMultiplier));
      });
      clip.drumHits.forEach(hit => {
        hit.velocity = Math.min(1, Math.max(0, hit.velocity * velocityMultiplier));
      });
    });
  });

  // Update mood based on direction
  if (direction === 'increase') {
    newProject.mood = 'energetic';
  } else {
    newProject.mood = 'soft';
  }

  const explanation: AgentExplanation = {
    summary: direction === 'increase' ? '增加了编曲能量' : '柔化了编曲',
    changes: [
      direction === 'increase' ? '提高了动态范围' : '降低了动态范围',
      `调整所有音符力度`,
      direction === 'increase' ? '使节奏更有力' : '使节奏更柔和'
    ]
  };

  return { project: newProject, explanation };
}

function generateBasicDrums(mood: string): DrumHit[] {
  const drumHits: DrumHit[] = [];
  const basePattern = mood === 'energetic'
    ? [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124]
    : [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120];

  basePattern.forEach((step) => {
    // Kick on 1 and 3 (or every beat in energetic)
    if (step % 16 === 0 || (mood === 'energetic' && step % 8 === 0)) {
      drumHits.push({
        id: generateId(),
        drum: 'kick' as const,
        step,
        velocity: mood === 'energetic' ? 0.9 : 0.7
      });
    }
    // Snare on 2 and 4
    if (step % 16 === 8) {
      drumHits.push({
        id: generateId(),
        drum: 'snare' as const,
        step,
        velocity: mood === 'energetic' ? 0.8 : 0.6
      });
    }
    // Hi-hat on off-beats
    if (step % 4 === 0) {
      drumHits.push({
        id: generateId(),
        drum: 'hihat' as const,
        step,
        velocity: mood === 'energetic' ? 0.6 : 0.4
      });
    }
  });

  return drumHits;
}

function generateBassLine(mood: string, _style: string): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const roots = ['C2', 'C2', 'G2', 'G2', 'A2', 'A2', 'F2', 'F2'];
  const stepPerBar = 16;

  roots.forEach((root, barIndex) => {
    notes.push({
      id: generateId(),
      pitch: root,
      step: barIndex * stepPerBar,
      durationSteps: stepPerBar / 2,
      velocity: mood === 'energetic' ? 0.8 : 0.6
    });

    notes.push({
      id: generateId(),
      pitch: root,
      step: barIndex * stepPerBar + stepPerBar / 2,
      durationSteps: stepPerBar / 4,
      velocity: mood === 'energetic' ? 0.8 : 0.6
    });
  });

  return notes;
}

function generateGuitarLine(mood: string, _style: string): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const chords = [
    ['C3', 'E3', 'G3'],
    ['C3', 'E3', 'G3'],
    ['G3', 'B3', 'D4'],
    ['G3', 'B3', 'D4'],
    ['A3', 'C4', 'E4'],
    ['A3', 'C4', 'E4'],
    ['F3', 'A3', 'C4'],
    ['F3', 'A3', 'C4']
  ];

  const stepPerBar = 16;

  chords.forEach((chord, barIndex) => {
    const stepStart = barIndex * stepPerBar;

    chord.forEach((pitch, chordIndex) => {
      notes.push({
        id: generateId(),
        pitch,
        step: stepStart + (chordIndex * 4),
        durationSteps: 8,
        velocity: mood === 'energetic' ? 0.7 : 0.5
      });
    });
  });

  return notes;
}

function generateKeysLine(mood: string, _style: string): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const pads = ['C4', 'G4', 'A4', 'F4'];
  const stepPerBar = 16;

  pads.forEach((pad, barIndex) => {
    notes.push({
      id: generateId(),
      pitch: pad,
      step: barIndex * stepPerBar,
      durationSteps: stepPerBar * 2,
      velocity: mood === 'energetic' ? 0.5 : 0.3
    });
  });

  return notes;
}
