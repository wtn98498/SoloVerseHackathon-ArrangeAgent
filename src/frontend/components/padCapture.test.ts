import assert from 'node:assert/strict';
import { buildPadCaptureEvents, mergePadCaptureIntoProject } from './padCapture.ts';
import type { ArrangementProject, TrackKind } from '../../contracts/index.ts';

const testProject: ArrangementProject = {
  id: 'pad-capture-test',
  title: 'Pad Capture Test',
  tempo: 120,
  bars: 8,
  beatsPerBar: 4,
  subdivision: 4,
  style: 'pop',
  mood: 'bright',
  tracks: ['drums', 'bass', 'guitar', 'keys'].map((kind) => ({
    id: `track-${kind}`,
    kind: kind as TrackKind,
    name: kind,
    color: '#fff',
    muted: false,
    clips: [{
      id: `clip-${kind}`,
      kind: kind === 'drums' ? 'drum' : 'midi',
      name: `${kind} clip`,
      barStart: 0,
      barLength: 8,
      loop: true,
      quantize: 4,
      notes: [],
      drumHits: [],
    }],
  })),
};

function testTrack(kind: TrackKind, padIds: string[], baseStep: number) {
  const events = buildPadCaptureEvents(kind, padIds, baseStep, 'test');
  const project = mergePadCaptureIntoProject(testProject, `track-${kind}`, events);
  const track = project.tracks.find((t) => t.kind === kind);

  assert.ok(track, `expected ${kind} track`);
  assert.equal(track.clips[0].notes.length, events.notes.length);
  assert.equal(track.clips[0].drumHits.length, events.drumHits.length);

  return { events, track };
}

function run() {
  const drums = testTrack('drums', ['kick', 'hihat'], 12);
  assert.deepEqual(drums.events.drumHits.map((hit) => hit.step), [12, 12]);
  assert.deepEqual(drums.events.drumHits.map((hit) => hit.drum), ['kick', 'hihat']);

  const bass = testTrack('bass', ['1', '2', '3'], 16);
  assert.deepEqual(bass.events.notes.map((note) => note.pitch), ['C2', 'G2', 'A2']);
  assert.deepEqual(bass.events.notes.map((note) => note.step), [16, 24, 32]);

  const guitar = testTrack('guitar', ['1'], 20);
  assert.deepEqual(guitar.events.notes.map((note) => note.pitch), ['C3', 'E3', 'G3']);
  assert.deepEqual(new Set(guitar.events.notes.map((note) => note.step)).size, 1);

  const keys = testTrack('keys', ['C', 'E', 'G'], 24);
  assert.deepEqual(keys.events.notes.map((note) => note.pitch), ['C4', 'E4', 'G4']);
  assert.deepEqual(new Set(keys.events.notes.map((note) => note.step)).size, 1);

  console.log('padCapture tests passed');
}

run();
