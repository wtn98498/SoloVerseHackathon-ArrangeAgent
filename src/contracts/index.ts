export type TrackKind = "drums" | "bass" | "guitar" | "keys";
export type StyleId = "pop" | "lofi" | "rock";
export type MoodId = "bright" | "soft" | "energetic";
export type ClipKind = "midi" | "drum";
export type AgentAction = "complete" | "increase" | "soften" | "fill_clip" | "variation";
export type QuantizeGrid = 1 | 2 | 4 | 8 | 16;
export type ScaleType = 'major' | 'minor';

export interface ScaleConfig {
  /** Pitch letter, e.g. "C", "F#", "Bb". Drives in-scale row highlighting. */
  root: string;
  type: ScaleType;
}

export interface ArrangementProject {
  id: string;
  title: string;
  tempo: number;
  bars: 8;
  beatsPerBar: 4;
  subdivision: 4;
  style: StyleId;
  mood: MoodId;
  scale?: ScaleConfig;
  tracks: Track[];
  selectedClipId?: string;
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
  kind: ClipKind;
  name: string;
  barStart: number;
  barLength: number;
  loop: boolean;
  quantize: QuantizeGrid;
  notes: NoteEvent[];
  drumHits: DrumHit[];
}

export interface NoteEvent {
  id: string;
  pitch: string;
  step: number;
  durationSteps: number;
  velocity: number;
  lane?: number;
}

export interface DrumHit {
  id: string;
  drum: "kick" | "snare" | "hihat" | "clap";
  step: number;
  velocity: number;
  durationSteps?: number;
}

export interface SeedPattern {
  sourceTrackKind: TrackKind;
  sourceClipId?: string;
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

export interface MidiEdit {
  type: "add_note" | "remove_note" | "move_note" | "resize_note" | "set_velocity";
  trackId: string;
  clipId: string;
  noteId?: string;
  note?: NoteEvent;
  step?: number;
  durationSteps?: number;
  velocity?: number;
}
