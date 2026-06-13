import { ArrangementProject } from '../contracts';
import { createClip } from '../contracts/clip';

export const fixtureProject: ArrangementProject = {
  id: 'fixture-001',
  title: 'Demo Loop',
  tempo: 120,
  bars: 8,
  beatsPerBar: 4,
  subdivision: 4,
  style: 'pop',
  mood: 'bright',
  tracks: [
    {
      id: 'track-drums',
      kind: 'drums',
      name: 'Drums',
      color: '#ff6b6b',
      muted: false,
      clips: [createClip({
        id: 'clip-drums',
        kind: 'drum',
        name: 'Drums MIDI Clip',
        notes: [],
        drumHits: [
          { id: 'dh-1', drum: 'kick', step: 0, velocity: 0.8 },
          { id: 'dh-2', drum: 'snare', step: 8, velocity: 0.7 },
          { id: 'dh-3', drum: 'hihat', step: 4, velocity: 0.5 },
          { id: 'dh-4', drum: 'hihat', step: 12, velocity: 0.5 },
          { id: 'dh-5', drum: 'kick', step: 16, velocity: 0.8 },
          { id: 'dh-6', drum: 'snare', step: 24, velocity: 0.7 },
          { id: 'dh-7', drum: 'hihat', step: 20, velocity: 0.5 },
          { id: 'dh-8', drum: 'hihat', step: 28, velocity: 0.5 },
          { id: 'dh-9', drum: 'kick', step: 32, velocity: 0.8 },
          { id: 'dh-10', drum: 'snare', step: 40, velocity: 0.7 },
          { id: 'dh-11', drum: 'hihat', step: 36, velocity: 0.5 },
          { id: 'dh-12', drum: 'hihat', step: 44, velocity: 0.5 },
          { id: 'dh-13', drum: 'kick', step: 48, velocity: 0.8 },
          { id: 'dh-14', drum: 'snare', step: 56, velocity: 0.7 },
          { id: 'dh-15', drum: 'hihat', step: 52, velocity: 0.5 },
          { id: 'dh-16', drum: 'hihat', step: 60, velocity: 0.5 },
          { id: 'dh-17', drum: 'kick', step: 64, velocity: 0.8 },
          { id: 'dh-18', drum: 'snare', step: 72, velocity: 0.7 },
          { id: 'dh-19', drum: 'hihat', step: 68, velocity: 0.5 },
          { id: 'dh-20', drum: 'hihat', step: 76, velocity: 0.5 },
          { id: 'dh-21', drum: 'kick', step: 80, velocity: 0.8 },
          { id: 'dh-22', drum: 'snare', step: 88, velocity: 0.7 },
          { id: 'dh-23', drum: 'hihat', step: 84, velocity: 0.5 },
          { id: 'dh-24', drum: 'hihat', step: 92, velocity: 0.5 },
          { id: 'dh-25', drum: 'kick', step: 96, velocity: 0.8 },
          { id: 'dh-26', drum: 'snare', step: 104, velocity: 0.7 },
          { id: 'dh-27', drum: 'hihat', step: 100, velocity: 0.5 },
          { id: 'dh-28', drum: 'hihat', step: 108, velocity: 0.5 },
          { id: 'dh-29', drum: 'kick', step: 112, velocity: 0.8 },
          { id: 'dh-30', drum: 'snare', step: 120, velocity: 0.7 },
          { id: 'dh-31', drum: 'hihat', step: 116, velocity: 0.5 },
          { id: 'dh-32', drum: 'hihat', step: 124, velocity: 0.5 },
        ]
        })]
    },
    {
      id: 'track-bass',
      kind: 'bass',
      name: 'Bass',
      color: '#4ecdc4',
      muted: false,
      clips: [createClip({
        id: 'clip-bass',
        kind: 'midi',
        name: 'Bass MIDI Clip',
        notes: [
          { id: 'bn-1', pitch: 'C2', step: 0, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-2', pitch: 'C2', step: 16, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-3', pitch: 'G2', step: 32, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-4', pitch: 'G2', step: 48, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-5', pitch: 'A2', step: 64, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-6', pitch: 'A2', step: 80, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-7', pitch: 'F2', step: 96, durationSteps: 8, velocity: 0.7 },
          { id: 'bn-8', pitch: 'F2', step: 112, durationSteps: 8, velocity: 0.7 },
        ],
        drumHits: []
        })]
    },
    {
      id: 'track-guitar',
      kind: 'guitar',
      name: 'Guitar',
      color: '#ffe66d',
      muted: false,
      clips: [createClip({
        id: 'clip-guitar',
        kind: 'midi',
        name: 'Guitar MIDI Clip',
        notes: [
          { id: 'gn-1', pitch: 'C3', step: 0, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-2', pitch: 'E3', step: 16, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-3', pitch: 'G3', step: 32, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-4', pitch: 'C3', step: 48, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-5', pitch: 'A3', step: 64, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-6', pitch: 'E3', step: 80, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-7', pitch: 'F3', step: 96, durationSteps: 16, velocity: 0.6 },
          { id: 'gn-8', pitch: 'G3', step: 112, durationSteps: 16, velocity: 0.6 },
        ],
        drumHits: []
        })]
    },
    {
      id: 'track-keys',
      kind: 'keys',
      name: 'Keys',
      color: '#a8dadc',
      muted: false,
      clips: [createClip({
        id: 'clip-keys',
        kind: 'midi',
        name: 'Keys MIDI Clip',
        notes: [
          { id: 'kn-1', pitch: 'C4', step: 0, durationSteps: 32, velocity: 0.5 },
          { id: 'kn-2', pitch: 'E4', step: 32, durationSteps: 32, velocity: 0.5 },
          { id: 'kn-3', pitch: 'G4', step: 64, durationSteps: 32, velocity: 0.5 },
          { id: 'kn-4', pitch: 'C4', step: 96, durationSteps: 32, velocity: 0.5 },
        ],
        drumHits: []
        })]
    }
  ],
  lastExplanation: {
    summary: '演示项目已加载',
    changes: ['创建了 4 个音轨', '每轨 8 小节', '共 128 步']
  }
};
