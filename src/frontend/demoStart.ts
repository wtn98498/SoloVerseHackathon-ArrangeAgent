import type { ArrangementProject, TrackKind } from '../contracts';
import { createClip } from '../contracts/clip';
import { generateArrangement } from '../arrangement/generators';
import { INSTRUMENT_THEME } from './theme';

const tracks: Array<{
  kind: TrackKind;
  name: string;
  color: string;
}> = [
  { kind: 'drums', name: 'Drums', color: '#ff6b6b' },
  { kind: 'bass', name: 'Bass', color: '#4ecdc4' },
  { kind: 'guitar', name: 'Guitar', color: '#ffe66d' },
  { kind: 'keys', name: 'Keys', color: '#a8dadc' },
];

export function createDemoStartProject(): ArrangementProject {
  return {
    id: `project-${Date.now()}`,
    title: 'PlayBand Starter Loop',
    tempo: 112,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style: 'pop',
    mood: 'bright',
    scale: { root: 'C', type: 'major' },
    selectedClipId: 'clip-drums',
    tracks: tracks.map((track) => ({
      id: `track-${track.kind}`,
      kind: track.kind,
      name: track.name,
      color: track.color,
      muted: false,
      clips: [
        createClip({
          id: `clip-${track.kind}`,
          kind: track.kind === 'drums' ? 'drum' : 'midi',
          name: `${track.name} MIDI Clip`,
          notes: [],
          drumHits: [],
        }),
      ],
    })),
    lastExplanation: {
      summary: '先敲几下鼓，再让 AI 把它扩成一支乐队。',
      changes: [
        '创建空白 8 小节四轨工程',
        '等待用户捕获一个音乐种子',
      ],
    },
  };
}

/**
 * A ready-made, fully-local (no network) 8-bar groove for the "给我个开头"
 * escape hatch on the hero screen. Reuses the deterministic arrangement
 * generator, then normalizes ids/colors so the rest of the UI (which keys off
 * `track-<kind>` / `clip-<kind>` and INSTRUMENT_THEME) stays consistent. This is
 * the mock-first safety net for users who'd rather react to something than stare
 * at a blank canvas.
 */
export function createCannedGrooveProject(): ArrangementProject {
  const base = generateArrangement({ tempo: 112 }, 'pop', 'bright');
  return {
    ...base,
    title: 'PlayBand Starter Groove',
    tempo: 112,
    scale: { root: 'C', type: 'major' as const },
    selectedClipId: 'clip-drums',
    tracks: base.tracks.map((track) => ({
      ...track,
      id: `track-${track.kind}`,
      color: INSTRUMENT_THEME[track.kind].color,
      clips: track.clips.map((clip, index) =>
        index === 0 ? { ...clip, id: `clip-${track.kind}` } : clip
      ),
    })),
    lastExplanation: {
      summary: '这是一段现成的小样，按播放听听，再让右侧 Agent 改。',
      changes: [
        '载入了一段本地生成的 8 小节四轨律动',
        '试试“更有能量”或“更柔和”，或自己再抓一个种子',
      ],
    },
  };
}
