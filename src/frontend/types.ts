import { TrackKind } from '../contracts';

export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  tempo: number;
}

export interface UIState {
  selectedTrackId: string | null;
  selectedInstrument: TrackKind | null;
  showAgentPanel: boolean;
}