import type { ArrangementProject, DrumHit, NoteEvent, TrackKind } from '../../contracts/index.ts';

const TOTAL_STEPS = 128;

interface PadCaptureEvents {
  notes: NoteEvent[];
  drumHits: DrumHit[];
}

const DRUM_PADS: Record<string, DrumHit['drum']> = {
  kick: 'kick',
  snare: 'snare',
  hihat: 'hihat',
  clap: 'clap',
};

const BASS_PADS: Record<string, string> = {
  '1': 'C2',
  '2': 'G2',
  '3': 'A2',
  '4': 'F2',
};

const GUITAR_PADS: Record<string, string[]> = {
  '1': ['C3', 'E3', 'G3'],
  '2': ['F3', 'A3', 'C4'],
  '3': ['G3', 'B3', 'D4'],
  '4': ['A3', 'C4', 'E4'],
};

const KEY_PADS: Record<string, string> = {
  C: 'C4',
  D: 'D4',
  E: 'E4',
  F: 'F4',
  G: 'G4',
  A: 'A4',
  B: 'B4',
  C2: 'C5',
};

const clampStep = (step: number) => Math.max(0, Math.min(TOTAL_STEPS - 1, Math.floor(step)));

export function buildPadCaptureEvents(
  trackKind: TrackKind,
  padIds: string[],
  baseStep: number,
  idPrefix = `pad-${Date.now()}`
): PadCaptureEvents {
  const step = clampStep(baseStep);

  if (trackKind === 'drums') {
    return {
      notes: [],
      drumHits: padIds.flatMap((id, index) => {
        const drum = DRUM_PADS[id];
        return drum ? [{ id: `${idPrefix}-hit-${index}`, drum, step, velocity: 0.78 }] : [];
      }),
    };
  }

  if (trackKind === 'bass') {
    return {
      drumHits: [],
      notes: padIds.flatMap((id, index) => {
        const pitch = BASS_PADS[id];
        return pitch
          ? [{
              id: `${idPrefix}-bass-${index}`,
              pitch,
              step: clampStep(step + index * 8),
              durationSteps: 6,
              velocity: 0.76,
            }]
          : [];
      }),
    };
  }

  if (trackKind === 'guitar') {
    return {
      drumHits: [],
      notes: padIds.flatMap((id, padIndex) => {
        const chord = GUITAR_PADS[id];
        const chordStep = clampStep(step + padIndex * 8);
        return chord
          ? chord.map((pitch, noteIndex) => ({
              id: `${idPrefix}-guitar-${padIndex}-${noteIndex}`,
              pitch,
              step: chordStep,
              durationSteps: 8,
              velocity: 0.68,
            }))
          : [];
      }),
    };
  }

  return {
    drumHits: [],
    notes: padIds.flatMap((id, index) => {
      const pitch = KEY_PADS[id];
      return pitch
        ? [{ id: `${idPrefix}-keys-${index}`, pitch, step, durationSteps: 8, velocity: 0.72 }]
        : [];
    }),
  };
}

export function mergePadCaptureIntoProject(
  project: ArrangementProject,
  trackId: string,
  events: PadCaptureEvents
): ArrangementProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.map((clip, index) =>
          index === 0
            ? {
                ...clip,
                notes: [...clip.notes, ...events.notes],
                drumHits: [...clip.drumHits, ...events.drumHits],
              }
            : clip
        ),
      };
    }),
  };
}
