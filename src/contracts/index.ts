export type TrackKind = "drums" | "bass" | "guitar" | "keys";
export type StyleId = "pop" | "lofi" | "rock";
export type MoodId = "bright" | "soft" | "energetic";

export interface ArrangementProject {
  id: string;
  title: string;
  tempo: number;
  bars: 8;
  beatsPerBar: 4;
  subdivision: 4;
  style: StyleId;
  mood: MoodId;
  tracks: Track[];
  lastExplanation?: AgentExplanation;
}

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
  color: string;
  muted: boolean;
  clips: Clip[];
}

export interface Clip {
  id: string;
  barStart: number;
  barLength: number;
  notes: NoteEvent[];
  drumHits: DrumHit[];
}

export interface NoteEvent {
  id: string;
  pitch: string;
  step: number;
  durationSteps: number;
  velocity: number;
}

export interface DrumHit {
  id: string;
  drum: "kick" | "snare" | "hihat" | "clap";
  step: number;
  velocity: number;
}

export interface SeedPattern {
  sourceTrackKind: TrackKind;
  capturedAt: string;
  notes: NoteEvent[];
  drumHits: DrumHit[];
  style: StyleId;
  mood: MoodId;
  tempo: number;
}

export interface AgentExplanation {
  summary: string;
  changes: string[];
}
