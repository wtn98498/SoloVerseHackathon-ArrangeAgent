import assert from 'node:assert/strict';
import { validateArrangementProject } from '../backend/validation/arrangement.ts';
import { fixtureProject } from './project.ts';

const track = (kind: string) => {
  const found = fixtureProject.tracks.find((candidate) => candidate.kind === kind);
  assert.ok(found, `missing ${kind} track`);
  return found;
};

const notesFor = (kind: string) => track(kind).clips.flatMap((clip) => clip.notes);
const hitsFor = (kind: string) => track(kind).clips.flatMap((clip) => clip.drumHits);

function hasChord(kind: string, minVoices: number) {
  const counts = new Map<number, number>();
  notesFor(kind).forEach((note) => counts.set(note.step, (counts.get(note.step) ?? 0) + 1));
  return Array.from(counts.values()).some((count) => count >= minVoices);
}

function run() {
  const errors = validateArrangementProject(fixtureProject);
  assert.deepEqual(errors, []);

  assert.equal(fixtureProject.title, 'Neon Playground Loop');
  assert.equal(fixtureProject.tempo, 132);

  assert.ok(hitsFor('drums').length >= 72, 'drums should feel busy enough for a demo song');
  assert.ok(notesFor('bass').length >= 24, 'bass should have a real riff, not only root notes');
  assert.ok(notesFor('guitar').length >= 48, 'guitar should include visible strums');
  assert.ok(notesFor('keys').length >= 52, 'keys should include chords plus a hook');

  assert.ok(hasChord('guitar', 3), 'guitar should show same-step chord voices');
  assert.ok(hasChord('keys', 3), 'keys should show same-step chord voices');

  console.log('fixture project tests passed');
}

run();
