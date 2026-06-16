import assert from 'node:assert/strict';
import { completeArrangementWithDeepSeek, energyWithDeepSeek } from '../services/deepseekArrangement.ts';
import { validateArrangementProject } from '../validation/arrangement.ts';
import { SeedPattern } from '../../contracts/index.ts';

const seed: SeedPattern = {
  sourceTrackKind: 'drums',
  capturedAt: new Date().toISOString(),
  notes: [],
  drumHits: [
    { id: 'kick-1', drum: 'kick', step: 0, velocity: 0.8 },
    { id: 'snare-1', drum: 'snare', step: 8, velocity: 0.7 },
  ],
  style: 'pop',
  mood: 'bright',
  tempo: 120,
};

async function run() {
  const complete = await completeArrangementWithDeepSeek(seed, undefined, async () => ({
    choices: [{
      message: {
        content: JSON.stringify({
          style: 'rock',
          mood: 'energetic',
          tempo: 138,
          summary: 'DeepSeek 选择了更适合录屏开场的高能 rock 方案',
          changes: ['保留 seed 的 kick/snare 重音', '提高速度', '让吉他和键盘更短促'],
        }),
      },
    }],
  }));

  assert.equal(complete.project.style, 'rock');
  assert.equal(complete.project.mood, 'energetic');
  assert.equal(complete.project.tempo, 138);
  assert.equal(complete.explanation.summary.includes('DeepSeek'), true);
  assert.deepEqual(validateArrangementProject(complete.project), []);

  const energy = await energyWithDeepSeek(complete.project, 'soften', async () => ({
    choices: [{
      message: {
        content: JSON.stringify({
          mood: 'soft',
          tempo: 96,
          summary: 'DeepSeek 把它改成更柔和的展示段落',
          changes: ['降低速度', '减少镲片密度', '给主旋律留白'],
        }),
      },
    }],
  }));

  assert.equal(energy.project.mood, 'soft');
  assert.equal(energy.project.tempo, 96);
  assert.deepEqual(validateArrangementProject(energy.project), []);
}

run().then(() => console.log('deepseek arrangement tests passed'));
