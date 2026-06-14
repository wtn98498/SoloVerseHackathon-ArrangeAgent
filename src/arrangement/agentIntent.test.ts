import { classifyAgentIntent } from './agentIntent.ts';
import { validateArrangementProject } from '../backend/validation/arrangement.ts';
import { fixtureProject } from '../fixtures/project.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const offTopic = classifyAgentIntent('今天上海天气怎么样');
assert(offTopic.kind === 'off_topic', 'off-topic chat should be refused locally');

const broad = classifyAgentIntent('我想编一段爵士音乐');
assert(broad.kind === 'needs_clarification', 'broad style request should ask clarification');
assert(broad.questions.length > 0 && broad.questions.length <= 2, 'clarification should be 1-2 questions');

const compose = classifyAgentIntent('做一段轻松的爵士开场，适合晚上散步');
assert(compose.kind === 'compose', 'specific music request should be composable');

const highPitchProject = structuredClone(fixtureProject);
const keysTrack = highPitchProject.tracks.find((track) => track.kind === 'keys');
const keysClip = keysTrack?.clips[0];
assert(Boolean(keysClip), 'fixture should have keys clip');
keysClip!.notes.push({
  id: 'test-high-note',
  pitch: 'C#5',
  step: 4,
  durationSteps: 4,
  velocity: 0.6,
});
assert(
  !validateArrangementProject(highPitchProject).some((error) => error.path.endsWith('.pitch')),
  'C#5 should be valid after widening the piano-roll range',
);

keysClip!.notes.push({
  id: 'test-too-high-note',
  pitch: 'C7',
  step: 8,
  durationSteps: 4,
  velocity: 0.6,
});
assert(
  validateArrangementProject(highPitchProject).some((error) => error.path.endsWith('.pitch')),
  'C7 should still be rejected',
);

console.log('agent intent and pitch validation checks passed');
