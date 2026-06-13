// Pitch-name helpers adapted from two-moons Moa Roll (utils/note.ts).
// Pure functions, no dependencies. Note format: "C4", "G#3", "Bb2".

const NOTE_VALUES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const NOTE_RE = /^([A-G])(#|b)?(\d)$/;

/** Split "G#4" → { name: "G#", octave: 4 }. Returns null on unrecognized input. */
export function separateNoteStr(note: string): { name: string; octave: number } | null {
  const m = note.match(NOTE_RE);
  if (!m) return null;
  return { name: `${m[1]}${m[2] ?? ''}`, octave: Number(m[3]) };
}

/**
 * Compare two note names by pitch (semitones relative to C4). Negative if a is
 * lower than b, 0 if equal, positive if higher. Returns 0 on bad input.
 */
export function compareNoteStr(a: string, b: string): number {
  const ma = a.match(NOTE_RE);
  const mb = b.match(NOTE_RE);
  if (!ma || !mb) return 0;
  const valueOf = (m: RegExpMatchArray) =>
    NOTE_VALUES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return valueOf(ma) - valueOf(mb);
}

/** Highest octave among a list of note names. Returns -Infinity if none parse. */
export function maxOctaveOf(pitches: string[]): number {
  let max = -Infinity;
  for (const p of pitches) {
    const o = separateNoteStr(p)?.octave;
    if (typeof o === 'number' && o > max) max = o;
  }
  return max;
}

/** Normalize the legacy alias C² → C5 used in some fixtures / agent output. */
export const aliasPitch = (pitch: string) => (pitch === 'C²' ? 'C5' : pitch);

/** MIDI note number for a pitch name (C4 = 60). Returns null on bad input. */
export function midiOf(pitch: string): number | null {
  const s = separateNoteStr(pitch);
  if (!s) return null;
  const letter = s.name[0];
  const acc = s.name.length > 1 ? s.name[1] : '';
  const within = NOTE_VALUES[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
  return (s.octave + 1) * 12 + within;
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/** Pitch classes (0–11) of a scale. `root` is a letter like "C", "F#", "Bb". */
export function scaleSemitones(root: string, type: 'major' | 'minor'): number[] {
  const letter = root[0]?.toUpperCase();
  const acc = root[1];
  let rootSemi = NOTE_VALUES[letter as keyof typeof NOTE_VALUES] ?? 0;
  if (acc === '#') rootSemi += 1;
  else if (acc === 'b') rootSemi -= 1;
  const intervals = type === 'minor' ? MINOR_INTERVALS : MAJOR_INTERVALS;
  return intervals.map((i) => (((rootSemi + i) % 12) + 12) % 12);
}
