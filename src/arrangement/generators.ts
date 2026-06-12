import { ArrangementProject, NoteEvent, DrumHit, SeedPattern, StyleId, MoodId } from '../contracts';
import { getChordProgression, getDrumPattern, getRootPitch, BASS_OCTAVE, GUITAR_OCTAVE, KEYS_OCTAVE, BASE_VELOCITIES } from './music-rules';

// Helper function to generate unique IDs
let idCounter = 0;
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// Generate drum hits for 8 bars (128 steps)
export function generateDrumHits(style: StyleId, mood: MoodId, energyMultiplier: number = 1): DrumHit[] {
  const hits: DrumHit[] = [];
  const pattern = getDrumPattern(style, mood);
  const baseVelocity = BASE_VELOCITIES[mood] * energyMultiplier;

  // Pattern repeats every 16 steps (1 bar of 16th notes)
  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;

    pattern.kick.forEach(step => {
      hits.push({
        id: generateId('kick'),
        drum: 'kick',
        step: barOffset + step,
        velocity: Math.min(1, baseVelocity * 1.0)
      });
    });

    pattern.snare.forEach(step => {
      hits.push({
        id: generateId('snare'),
        drum: 'snare',
        step: barOffset + step,
        velocity: Math.min(1, baseVelocity * 0.9)
      });
    });

    pattern.hihat.forEach(step => {
      hits.push({
        id: generateId('hihat'),
        drum: 'hihat',
        step: barOffset + step,
        velocity: Math.min(1, baseVelocity * 0.6)
      });
    });

    pattern.clap.forEach(step => {
      hits.push({
        id: generateId('clap'),
        drum: 'clap',
        step: barOffset + step,
        velocity: Math.min(1, baseVelocity * 0.8)
      });
    });
  }

  return hits;
}

// Generate bassline following chord progression
export function generateBassline(chords: string[], style: StyleId, mood: MoodId, energyMultiplier: number = 1): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const baseVelocity = BASE_VELOCITIES[mood] * energyMultiplier;

  chords.forEach((chord, chordIndex) => {
    const root = getRootPitch(chord);
    const barStart = chordIndex * 16;

    // Root notes on beat 1 of each bar
    notes.push({
      id: generateId('bass'),
      pitch: `${root}${BASS_OCTAVE}`,
      step: barStart,
      durationSteps: 8,
      velocity: Math.min(1, baseVelocity * 0.8)
    });

    // Add variety based on style
    if (style === 'rock') {
      // More frequent root notes
      notes.push({
        id: generateId('bass'),
        pitch: `${root}${BASS_OCTAVE}`,
        step: barStart + 8,
        durationSteps: 8,
        velocity: Math.min(1, baseVelocity * 0.7)
      });
    } else if (style === 'lofi') {
      // Longer, sustained notes
      notes[notes.length - 1].durationSteps = 14;
    }
  });

  return notes;
}

// Generate guitar part
export function generateGuitarPart(chords: string[], style: StyleId, mood: MoodId, energyMultiplier: number = 1): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const baseVelocity = BASE_VELOCITIES[mood] * energyMultiplier;

  chords.forEach((chord, chordIndex) => {
    const root = getRootPitch(chord);
    const barStart = chordIndex * 16;

    // Strumming pattern varies by style
    if (style === 'pop' || style === 'rock') {
      // Regular strumming
      [0, 4, 8, 12].forEach(offset => {
        notes.push({
          id: generateId('guitar'),
          pitch: `${root}${GUITAR_OCTAVE}`,
          step: barStart + offset,
          durationSteps: 2,
          velocity: Math.min(1, baseVelocity * 0.6)
        });
      });
    } else if (style === 'lofi') {
      // Softer, less frequent chords
      [0, 10].forEach(offset => {
        notes.push({
          id: generateId('guitar'),
          pitch: `${root}${GUITAR_OCTAVE}`,
          step: barStart + offset,
          durationSteps: 4,
          velocity: Math.min(1, baseVelocity * 0.5)
        });
      });
    }
  });

  return notes;
}

// Generate keys part
export function generateKeysPart(chords: string[], style: StyleId, mood: MoodId, energyMultiplier: number = 1): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const baseVelocity = BASE_VELOCITIES[mood] * energyMultiplier;

  chords.forEach((chord, chordIndex) => {
    const root = getRootPitch(chord);
    const barStart = chordIndex * 16;

    // Simple chord voicings
    const chordNotes = [`${root}${KEYS_OCTAVE}`, `${root}${KEYS_OCTAVE + 2}`, `${root}${KEYS_OCTAVE + 4}`];

    if (style === 'lofi') {
      // Softer, pads
      chordNotes.forEach((note) => {
        notes.push({
          id: generateId('keys'),
          pitch: note,
          step: barStart,
          durationSteps: 16,
          velocity: Math.min(1, baseVelocity * 0.4)
        });
      });
    } else if (style === 'pop') {
      // rhythmic chords
      [0, 8].forEach(offset => {
        chordNotes.forEach((note) => {
          notes.push({
            id: generateId('keys'),
            pitch: note,
            step: barStart + offset,
            durationSteps: 4,
            velocity: Math.min(1, baseVelocity * 0.5)
          });
        });
      });
    } else if (style === 'rock') {
      // More aggressive
      [0, 4, 8].forEach(offset => {
        notes.push({
          id: generateId('keys'),
          pitch: `${root}${KEYS_OCTAVE}`,
          step: barStart + offset,
          durationSteps: 2,
          velocity: Math.min(1, baseVelocity * 0.6)
        });
      });
    }
  });

  return notes;
}

// Main arrangement generator
export function generateArrangement(
  seed: Partial<SeedPattern>,
  style: StyleId = 'pop',
  mood: MoodId = 'bright'
): ArrangementProject {
  const chords = getChordProgression(style, mood);

  return {
    id: generateId('project'),
    title: `${style} ${mood} arrangement`,
    tempo: seed.tempo || 120,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style,
    mood,
    tracks: [
      {
        id: generateId('track'),
        kind: 'drums',
        name: 'Drums',
        color: '#ff6b6b',
        muted: false,
        clips: [{
          id: generateId('clip'),
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: generateDrumHits(style, mood)
        }]
      },
      {
        id: generateId('track'),
        kind: 'bass',
        name: 'Bass',
        color: '#4ecdc4',
        muted: false,
        clips: [{
          id: generateId('clip'),
          barStart: 0,
          barLength: 8,
          notes: generateBassline(chords, style, mood),
          drumHits: []
        }]
      },
      {
        id: generateId('track'),
        kind: 'guitar',
        name: 'Guitar',
        color: '#ffe66d',
        muted: false,
        clips: [{
          id: generateId('clip'),
          barStart: 0,
          barLength: 8,
          notes: generateGuitarPart(chords, style, mood),
          drumHits: []
        }]
      },
      {
        id: generateId('track'),
        kind: 'keys',
        name: 'Keys',
        color: '#a8dadc',
        muted: false,
        clips: [{
          id: generateId('clip'),
          barStart: 0,
          barLength: 8,
          notes: generateKeysPart(chords, style, mood),
          drumHits: []
        }]
      }
    ]
  };
}