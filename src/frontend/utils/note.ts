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
