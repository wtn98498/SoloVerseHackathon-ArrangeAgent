import { createContext, useContext, useState, ReactNode } from 'react';
import { ArrangementProject, SeedPattern, TrackKind } from '../../contracts';
import { OnboardingStep, PlaybackState, UIState } from '../types';
import { createClip } from '../../contracts/clip';

interface EditorContextType {
  project: ArrangementProject | null;
  setProject: (project: ArrangementProject) => void;
  playback: PlaybackState;
  setPlayback: (playback: PlaybackState) => void;
  ui: UIState;
  setUi: (ui: UIState) => void;
  seedPattern: SeedPattern | null;
  setSeedPattern: (seed: SeedPattern | null) => void;
  captureSeed: (trackKind: TrackKind, notes: any[], drumHits: any[]) => void;
  startNewSong: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ArrangementProject | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentStep: 0,
    tempo: 120,
    loop: false,
    loopStart: 0,
    loopEnd: 127
  });
  const [ui, setUi] = useState<UIState>({
    selectedTrackId: null,
    selectedInstrument: null,
    showAgentPanel: true,
    onboardingStep: 'idle'
  });
  const [seedPattern, setSeedPattern] = useState<SeedPattern | null>(null);

  // NOTE: the playhead position (playback.currentStep) is now driven by the
  // audio clock via AudioEngine.setOnStep() wired in App.tsx, so the UI
  // playhead stays in sync with sound at any tempo. Scrub handlers
  // (PianoRoll / TrackTimeline) still write currentStep directly when idle.

  const captureSeed = (trackKind: TrackKind, notes: any[], drumHits: any[]) => {
    if (!project) return;

    const seed: SeedPattern = {
      sourceTrackKind: trackKind,
      capturedAt: new Date().toISOString(),
      notes,
      drumHits,
      style: project.style,
      mood: project.mood,
      tempo: project.tempo
    };

    setSeedPattern(seed);
  };

  const startNewSong = () => {
    const nextProject = createBlankProject();
    setProject(nextProject);
    setSeedPattern(null);
    setPlayback({
      isPlaying: false,
      currentStep: 0,
      tempo: nextProject.tempo,
      loop: false,
      loopStart: 0,
      loopEnd: 127
    });
    setUi({
      selectedTrackId: 'track-drums',
      selectedInstrument: 'drums',
      showAgentPanel: true,
      onboardingStep: 'drums'
    });
  };

  const setOnboardingStep = (step: OnboardingStep) => {
    setUi((current) => ({ ...current, onboardingStep: step }));
  };

  return (
    <EditorContext.Provider value={{
      project,
      setProject,
      playback,
      setPlayback,
      ui,
      setUi,
      seedPattern,
      setSeedPattern,
      captureSeed,
      startNewSong,
      setOnboardingStep
    }}>
      {children}
    </EditorContext.Provider>
  );
}

function createBlankProject(): ArrangementProject {
  return {
    id: `project-${Date.now()}`,
    title: 'New Playground Loop',
    tempo: 112,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style: 'pop',
    mood: 'bright',
    scale: { root: 'C', type: 'major' },
    selectedClipId: 'clip-drums',
    tracks: [
      {
        id: 'track-drums',
        kind: 'drums',
        name: 'Drums',
        color: '#ff6b6b',
        muted: false,
        clips: [createClip({ id: 'clip-drums', kind: 'drum', name: 'Drums MIDI Clip', notes: [], drumHits: [] })],
      },
      {
        id: 'track-bass',
        kind: 'bass',
        name: 'Bass',
        color: '#4ecdc4',
        muted: false,
        clips: [createClip({ id: 'clip-bass', kind: 'midi', name: 'Bass MIDI Clip', notes: [], drumHits: [] })],
      },
      {
        id: 'track-guitar',
        kind: 'guitar',
        name: 'Guitar',
        color: '#ffe66d',
        muted: false,
        clips: [createClip({ id: 'clip-guitar', kind: 'midi', name: 'Guitar MIDI Clip', notes: [], drumHits: [] })],
      },
      {
        id: 'track-keys',
        kind: 'keys',
        name: 'Keys',
        color: '#a8dadc',
        muted: false,
        clips: [createClip({ id: 'clip-keys', kind: 'midi', name: 'Keys MIDI Clip', notes: [], drumHits: [] })],
      },
    ],
    lastExplanation: {
      summary: '新曲子已准备好，先敲鼓，再点几个音。',
      changes: ['创建空白 8 小节四轨工程', '等待用户捕获鼓和键盘种子'],
    },
  };
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
