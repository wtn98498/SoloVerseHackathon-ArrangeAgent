import assert from 'node:assert/strict';
import { validateArrangementProject } from '../validation/arrangement.ts';
import { generateEnergyTransformation, generateFallbackArrangement } from './fallback.ts';
import type { ArrangementProject, MoodId, SeedPattern, StyleId, TrackKind } from '../../contracts/index.ts';

const baseSeed: SeedPattern = {
  sourceTrackKind: 'drums',
  capturedAt: '2026-06-15T00:00:00.000Z',
  notes: [],
  drumHits: [
    { id: 'seed-kick', drum: 'kick', step: 0, velocity: 0.8 },
    { id: 'seed-hat', drum: 'hihat', step: 4, velocity: 0.55 },
    { id: 'seed-snare', drum: 'snare', step: 8, velocity: 0.72 },
  ],
  style: 'pop',
  mood: 'bright',
  tempo: 112,
};

function makeSeed(style: StyleId, mood: MoodId): SeedPattern {
  return { ...baseSeed, style, mood };
}

function track(project: ArrangementProject, kind: TrackKind) {
  const found = project.tracks.find((candidate) => candidate.kind === kind);
  assert.ok(found, `missing ${kind} track`);
  return found;
}

function signature(project: ArrangementProject): string {
  return project.tracks
    .map((candidate) => {
      const clip = candidate.clips[0];
      const notes = clip.notes
        .map((note) => `${note.pitch}@${note.step}/${note.durationSteps}`)
        .join(',');
      const hits = clip.drumHits
        .map((hit) => `${hit.drum}@${hit.step}`)
        .join(',');
      return `${candidate.kind}:${notes || hits}`;
    })
    .join('|');
}

const pop = generateFallbackArrangement(makeSeed('pop', 'bright')).project;
const lofi = generateFallbackArrangement(makeSeed('lofi', 'soft')).project;
const rock = generateFallbackArrangement(makeSeed('rock', 'energetic')).project;

for (const project of [pop, lofi, rock]) {
  assert.deepEqual(validateArrangementProject(project), []);
}

assert.notEqual(signature(pop), signature(lofi), 'lo-fi should not reuse the pop arrangement shape');
assert.notEqual(signature(pop), signature(rock), 'rock should not reuse the pop arrangement shape');
assert.notEqual(signature(lofi), signature(rock), 'rock and lo-fi should be clearly different');

assert.notDeepEqual(
  track(pop, 'bass').clips[0].notes.map((note) => note.pitch),
  track(lofi, 'bass').clips[0].notes.map((note) => note.pitch),
  'style/mood should change harmonic roots, not only velocity',
);

const increased = generateEnergyTransformation(pop, 'increase').project;
const softened = generateEnergyTransformation(pop, 'soften').project;

assert.deepEqual(validateArrangementProject(increased), []);
assert.deepEqual(validateArrangementProject(softened), []);

const popEvents = signature(pop);
assert.notEqual(signature(increased), popEvents, 'increase should change event placement or density');
assert.notEqual(signature(softened), popEvents, 'soften should change event placement or density');

assert.ok(
  track(increased, 'drums').clips[0].drumHits.length > track(pop, 'drums').clips[0].drumHits.length,
  'increase should add audible rhythmic density',
);
assert.ok(
  track(softened, 'drums').clips[0].drumHits.length < track(pop, 'drums').clips[0].drumHits.length,
  'soften should remove some rhythmic density',
);

console.log('fallback arrangement variation tests passed');
