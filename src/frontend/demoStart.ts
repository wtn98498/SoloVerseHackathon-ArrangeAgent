import type { ArrangementProject, TrackKind } from '../contracts';
import { createClip } from '../contracts/clip';

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
