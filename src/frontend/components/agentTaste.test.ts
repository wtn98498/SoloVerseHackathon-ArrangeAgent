import assert from 'node:assert/strict';
import { fixtureProject } from '../../fixtures/project.ts';
import { createAgentTasteNote } from './agentTaste.ts';

const completeNote = createAgentTasteNote(fixtureProject, {
  summary: '生成了一个基础 pop 风格的编曲',
  changes: ['创建了 4 个乐器轨道', '根据种子模式生成节奏', '应用情绪风格'],
});

assert.match(completeNote.headline, /音乐总监/);
assert.match(completeNote.headline, /132 BPM/);
assert.equal(completeNote.listenFor.length, 3);
assert.ok(completeNote.listenFor.some((item) => item.includes('鼓')));
assert.ok(completeNote.listenFor.some((item) => item.includes('贝斯')));
assert.ok(completeNote.listenFor.some((item) => item.includes('和声') || item.includes('键盘')));
assert.ok(completeNote.nextMove.includes('试听'));

const energeticProject = { ...fixtureProject, mood: 'energetic' as const };
const energeticNote = createAgentTasteNote(energeticProject, {
  summary: '增加了编曲能量',
  changes: ['提高了动态范围', '调整所有音符力度', '使节奏更有力'],
});

assert.match(energeticNote.headline, /更像副歌|推向前台|舞台/);
assert.ok(energeticNote.nextMove.includes('放进编曲') || energeticNote.nextMove.includes('再来'));

console.log('agent taste note tests passed');
