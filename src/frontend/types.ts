import { TrackKind } from '../contracts';

export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  tempo: number;
  /** Loop toggle (transport loop button). */
  loop: boolean;
  /** Inclusive loop region in steps. Defaults to the whole 0..127 range. */
  loopStart: number;
  loopEnd: number;
}

export interface UIState {
  selectedTrackId: string | null;
  selectedInstrument: TrackKind | null;
  showAgentPanel: boolean;
}