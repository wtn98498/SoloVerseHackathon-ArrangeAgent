import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ArrangementProject, SeedPattern, TrackKind } from '../../contracts';
import { PlaybackState, UIState } from '../types';

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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ArrangementProject | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentStep: 0,
    tempo: 120
  });
  const [ui, setUi] = useState<UIState>({
    selectedTrackId: null,
    selectedInstrument: null,
    showAgentPanel: true
  });
  const [seedPattern, setSeedPattern] = useState<SeedPattern | null>(null);

  useEffect(() => {
    if (!playback.isPlaying) return;

    const intervalId = window.setInterval(() => {
      setPlayback(current => ({
        ...current,
        currentStep: (current.currentStep + 1) % 128
      }));
    }, 125);

    return () => window.clearInterval(intervalId);
  }, [playback.isPlaying]);

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
      captureSeed
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
