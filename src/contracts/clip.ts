import { Clip, ClipKind, DrumHit, NoteEvent, QuantizeGrid } from './index';

interface CreateClipInput {
  id: string;
  kind: ClipKind;
  name: string;
  barStart?: number;
  barLength?: number;
  loop?: boolean;
  quantize?: QuantizeGrid;
  notes?: NoteEvent[];
  drumHits?: DrumHit[];
}

export function createClip({
  id,
  kind,
  name,
  barStart = 0,
  barLength = 8,
  loop = true,
  quantize = 4,
  notes = [],
  drumHits = [],
}: CreateClipInput): Clip {
  return {
    id,
    kind,
    name,
    barStart,
    barLength,
    loop,
    quantize,
    notes,
    drumHits,
  };
}
