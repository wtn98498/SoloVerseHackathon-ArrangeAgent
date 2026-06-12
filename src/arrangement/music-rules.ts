import { StyleId, MoodId } from '../contracts';

// Chord progressions for different styles and moods
export const CHORD_PROGRESSIONS = {
  'pop-bright': ['C', 'G', 'Am', 'F'],
  'lofi-soft': ['Cmaj7', 'Am7', 'Dm7', 'G7'],
  'rock-energetic': ['C', 'F', 'G', 'F']
};

// Simple mappings from chord names to pitch classes
export const CHORD_TO_ROOT = {
  'C': 'C',
  'G': 'G',
  'Am': 'A',
  'F': 'F',
  'Cmaj7': 'C',
  'Am7': 'A',
  'Dm7': 'D',
  'G7': 'G'
};

// Bass note octaves
export const BASS_OCTAVE = 2;
export const GUITAR_OCTAVE = 3;
export const KEYS_OCTAVE = 4;

// Drum patterns (step indices for 16 steps, then repeat)
export const DRUM_PATTERNS = {
  'pop-bright': {
    kick: [0, 8],
    snare: [4, 12],
    hihat: [2, 6, 10, 14],
    clap: []
  },
  'lofi-soft': {
    kick: [0, 10],
    snare: [4],
    hihat: [2, 6, 8, 12, 14],
    clap: []
  },
  'rock-energetic': {
    kick: [0, 3, 8, 11],
    snare: [4, 12],
    hihat: [2, 6, 10, 14],
    clap: [4, 12]
  }
};

// Velocity adjustments based on mood
export const BASE_VELOCITIES = {
  'bright': 0.7,
  'soft': 0.5,
  'energetic': 0.8
};

// Energy multipliers
export const ENERGY_INCREASE_MULTIPLIER = 1.3;
export const SOFTEN_MULTIPLIER = 0.7;

export function getChordProgression(style: StyleId, mood: MoodId): string[] {
  const key = `${style}-${mood}` as keyof typeof CHORD_PROGRESSIONS;
  return CHORD_PROGRESSIONS[key] || CHORD_PROGRESSIONS['pop-bright'];
}

export function getDrumPattern(style: StyleId, mood: MoodId) {
  const key = `${style}-${mood}` as keyof typeof DRUM_PATTERNS;
  return DRUM_PATTERNS[key] || DRUM_PATTERNS['pop-bright'];
}

export function getRootPitch(chord: string): string {
  return CHORD_TO_ROOT[chord as keyof typeof CHORD_TO_ROOT] || 'C';
}