import type { AgentExplanation, ArrangementProject, TrackKind } from '../../contracts';

export interface AgentTasteNote {
  headline: string;
  listenFor: string[];
  nextMove: string;
}

const trackLabels: Record<TrackKind, string> = {
  drums: '鼓',
  bass: '贝斯',
  guitar: '吉他',
  keys: '键盘',
};

export function createAgentTasteNote(
  project: ArrangementProject,
  explanation: AgentExplanation,
): AgentTasteNote {
  const density = eventCount(project);
  const headline = headlineFor(project, density);
  const listenFor = [
    describeRhythm(project),
    describeBass(project),
    describeHarmony(project),
  ];

  return {
    headline,
    listenFor,
    nextMove: nextMoveFor(project, explanation),
  };
}

function headlineFor(project: ArrangementProject, density: number) {
  if (project.mood === 'energetic') {
    return `音乐总监判断：${project.tempo} BPM，已经更像副歌，能把 loop 推向前台。`;
  }
  if (project.mood === 'soft') {
    return `音乐总监判断：${project.tempo} BPM，空间变大了，适合做主歌或片头铺垫。`;
  }
  return `音乐总监判断：${project.tempo} BPM，${density} 个 MIDI 事件已经撑起一个明亮开场。`;
}

function describeRhythm(project: ArrangementProject) {
  const hits = trackEvents(project, 'drums');
  if (project.mood === 'energetic') {
    return `鼓：听下 kick/snare 有没有把身体往前推，当前有 ${hits} 个鼓击。`;
  }
  if (project.mood === 'soft') {
    return `鼓：保留拍点但少一点压迫感，给旋律留呼吸。`;
  }
  return `鼓：先确认 backbeat 是否清楚，评委应该能马上点头。`;
}

function describeBass(project: ArrangementProject) {
  const notes = trackEvents(project, 'bass');
  if (notes >= 20) {
    return `贝斯：已经不是只跟根音，注意它和鼓有没有锁住律动。`;
  }
  return `贝斯：现在像地基，负责把四个和弦稳稳拉住。`;
}

function describeHarmony(project: ArrangementProject) {
  const keys = trackEvents(project, 'keys');
  const guitar = trackEvents(project, 'guitar');
  if (keys + guitar >= 60) {
    return `和声：键盘和吉他都有可见运动，画面会比普通 AI 出歌更可信。`;
  }
  return `和声：键盘铺色彩，吉他补颗粒，别让画面变成一条音频。`;
}

function nextMoveFor(project: ArrangementProject, explanation: AgentExplanation) {
  const summary = explanation.summary;
  if (project.mood === 'energetic' || summary.includes('能量')) {
    return '下一步：先试听 4 小节；如果鼓太满就点“更柔和”，如果抓耳就放进编曲。';
  }
  if (project.mood === 'soft' || summary.includes('柔')) {
    return '下一步：先试听；如果像背景音乐就保留，如果要路演高光就再点“更有能量”。';
  }
  return '下一步：先试听，再决定放进编曲还是再来一版。';
}

function eventCount(project: ArrangementProject) {
  return project.tracks.reduce((sum, track) => (
    sum + track.clips.reduce((clipSum, clip) => clipSum + clip.notes.length + clip.drumHits.length, 0)
  ), 0);
}

function trackEvents(project: ArrangementProject, kind: TrackKind) {
  const track = project.tracks.find((candidate) => candidate.kind === kind);
  if (!track) return 0;
  return track.clips.reduce((sum, clip) => sum + clip.notes.length + clip.drumHits.length, 0);
}

export { trackLabels };
