import assert from 'node:assert/strict';
import { createDemoStartProject } from './demoStart.ts';

const project = createDemoStartProject();

assert.equal(project.title, 'PlayBand Starter Loop');
assert.equal(project.tempo, 112);
assert.equal(project.bars, 8);
assert.equal(project.tracks.length, 4);
assert.equal(project.selectedClipId, 'clip-drums');

for (const track of project.tracks) {
  assert.equal(track.clips.length, 1, `${track.kind} should start with one clip`);
  assert.equal(track.clips[0].notes.length, 0, `${track.kind} should start without notes`);
  assert.equal(track.clips[0].drumHits.length, 0, `${track.kind} should start without drum hits`);
}

assert.equal(project.lastExplanation?.summary, '先敲几下鼓，再让 AI 把它扩成一支乐队。');

console.log('demo start project tests passed');
