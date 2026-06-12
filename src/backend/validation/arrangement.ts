import { ArrangementProject, SeedPattern, TrackKind, StyleId, MoodId } from '../../contracts';

const VALID_TRACK_KINDS: TrackKind[] = ['drums', 'bass', 'guitar', 'keys'];
const VALID_STYLE_IDS: StyleId[] = ['pop', 'lofi', 'rock'];
const VALID_MOOD_IDS: MoodId[] = ['bright', 'soft', 'energetic'];
const VALID_DRUMS = ['kick', 'snare', 'hihat', 'clap'];

const MAX_STEP = 127; // 8 bars * 4 beats * 4 subdivisions
const MAX_VELOCITY = 1;
const MIN_VELOCITY = 0;

export interface ValidationError {
  path: string;
  message: string;
}

export function validateSeedPattern(seed: SeedPattern): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!VALID_TRACK_KINDS.includes(seed.sourceTrackKind)) {
    errors.push({ path: 'sourceTrackKind', message: `Invalid track kind: ${seed.sourceTrackKind}` });
  }

  if (!VALID_STYLE_IDS.includes(seed.style)) {
    errors.push({ path: 'style', message: `Invalid style: ${seed.style}` });
  }

  if (!VALID_MOOD_IDS.includes(seed.mood)) {
    errors.push({ path: 'mood', message: `Invalid mood: ${seed.mood}` });
  }

  if (seed.tempo < 60 || seed.tempo > 200) {
    errors.push({ path: 'tempo', message: `Tempo must be between 60 and 200, got ${seed.tempo}` });
  }

  seed.notes.forEach((note, index) => {
    if (note.step < 0 || note.step > MAX_STEP) {
      errors.push({ path: `notes[${index}].step`, message: `Step must be 0-127, got ${note.step}` });
    }
    if (note.durationSteps < 1) {
      errors.push({ path: `notes[${index}].durationSteps`, message: `Duration must be at least 1` });
    }
    if (note.velocity < MIN_VELOCITY || note.velocity > MAX_VELOCITY) {
      errors.push({ path: `notes[${index}].velocity`, message: `Velocity must be 0-1, got ${note.velocity}` });
    }
  });

  seed.drumHits.forEach((hit, index) => {
    if (!VALID_DRUMS.includes(hit.drum)) {
      errors.push({ path: `drumHits[${index}].drum`, message: `Invalid drum type: ${hit.drum}` });
    }
    if (hit.step < 0 || hit.step > MAX_STEP) {
      errors.push({ path: `drumHits[${index}].step`, message: `Step must be 0-127, got ${hit.step}` });
    }
    if (hit.velocity < MIN_VELOCITY || hit.velocity > MAX_VELOCITY) {
      errors.push({ path: `drumHits[${index}].velocity`, message: `Velocity must be 0-1, got ${hit.velocity}` });
    }
  });

  return errors;
}

export function validateArrangementProject(project: ArrangementProject): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!project.id || project.id.trim() === '') {
    errors.push({ path: 'id', message: 'Project ID is required' });
  }

  if (project.tempo < 60 || project.tempo > 200) {
    errors.push({ path: 'tempo', message: `Tempo must be between 60 and 200, got ${project.tempo}` });
  }

  if (project.bars !== 8) {
    errors.push({ path: 'bars', message: `Project must have 8 bars, got ${project.bars}` });
  }

  if (project.beatsPerBar !== 4) {
    errors.push({ path: 'beatsPerBar', message: `Must have 4 beats per bar, got ${project.beatsPerBar}` });
  }

  if (project.subdivision !== 4) {
    errors.push({ path: 'subdivision', message: `Must have 4 subdivisions per beat, got ${project.subdivision}` });
  }

  if (!VALID_STYLE_IDS.includes(project.style)) {
    errors.push({ path: 'style', message: `Invalid style: ${project.style}` });
  }

  if (!VALID_MOOD_IDS.includes(project.mood)) {
    errors.push({ path: 'mood', message: `Invalid mood: ${project.mood}` });
  }

  // Check for required tracks
  const trackKinds = new Set(project.tracks.map(t => t.kind));
  if (!trackKinds.has('drums')) {
    errors.push({ path: 'tracks', message: 'Missing required drums track' });
  }
  if (!trackKinds.has('bass')) {
    errors.push({ path: 'tracks', message: 'Missing required bass track' });
  }
  if (!trackKinds.has('guitar')) {
    errors.push({ path: 'tracks', message: 'Missing required guitar track' });
  }
  if (!trackKinds.has('keys')) {
    errors.push({ path: 'tracks', message: 'Missing required keys track' });
  }

  // Validate each track
  project.tracks.forEach((track, trackIndex) => {
    if (!VALID_TRACK_KINDS.includes(track.kind)) {
      errors.push({ path: `tracks[${trackIndex}].kind`, message: `Invalid track kind: ${track.kind}` });
    }

    if (!track.id || track.id.trim() === '') {
      errors.push({ path: `tracks[${trackIndex}].id`, message: 'Track ID is required' });
    }

    // Validate clips
    if (track.clips.length === 0) {
      errors.push({ path: `tracks[${trackIndex}].clips`, message: 'Track must have at least one clip' });
    }

    track.clips.forEach((clip, clipIndex) => {
      if (clip.barStart < 0 || clip.barStart >= 8) {
        errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].barStart`, message: `barStart must be 0-7, got ${clip.barStart}` });
      }
      if (clip.barStart + clip.barLength > 8) {
        errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].barLength`, message: 'Clip extends beyond 8 bars' });
      }

      // Validate notes
      clip.notes.forEach((note, noteIndex) => {
        if (note.step < 0 || note.step > MAX_STEP) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].notes[${noteIndex}].step`, message: `Step must be 0-127, got ${note.step}` });
        }
        if (note.durationSteps < 1) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].notes[${noteIndex}].durationSteps`, message: `Duration must be at least 1` });
        }
        if (note.velocity < MIN_VELOCITY || note.velocity > MAX_VELOCITY) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].notes[${noteIndex}].velocity`, message: `Velocity must be 0-1, got ${note.velocity}` });
        }
      });

      // Validate drum hits
      clip.drumHits.forEach((hit, hitIndex) => {
        if (!VALID_DRUMS.includes(hit.drum)) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].drumHits[${hitIndex}].drum`, message: `Invalid drum type: ${hit.drum}` });
        }
        if (hit.step < 0 || hit.step > MAX_STEP) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].drumHits[${hitIndex}].step`, message: `Step must be 0-127, got ${hit.step}` });
        }
        if (hit.velocity < MIN_VELOCITY || hit.velocity > MAX_VELOCITY) {
          errors.push({ path: `tracks[${trackIndex}].clips[${clipIndex}].drumHits[${hitIndex}].velocity`, message: `Velocity must be 0-1, got ${hit.velocity}` });
        }
      });
    });
  });

  return errors;
}
