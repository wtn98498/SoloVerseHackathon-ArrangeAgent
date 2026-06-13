import { useMemo, useRef } from 'react';
import { ArrangementProject, Track, Clip } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { midiOf, aliasPitch } from '../utils/note';

interface TrackTimelineProps {
  project: ArrangementProject;
}

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, setPlayback, ui, setUi } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

  // Playhead is always present (常驻); currentStep persists when paused.
  const playheadPct = (playback.currentStep / (totalSteps - 1)) * 100;

  // Click / drag the ruler to scrub the playhead position (可调节).
  const scrubFromEvent = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const step = Math.round(ratio * (totalSteps - 1));
    setPlayback({ ...playback, currentStep: step });
  };

  return (
    <div className="timeline-container" role="region" aria-label="编曲时间线">
      {/* Bar ruler — also the scrub surface */}
      <div className="bar-ruler">
        <div className="bar-ruler-gutter" />
        <div
          className="bar-ruler-track scrub-surface"
          ref={rulerRef}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            scrubFromEvent(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) scrubFromEvent(e.clientX);
          }}
        >
          {Array.from({ length: project.bars }, (_, i) => (
            <div key={i} className="bar-ruler-cell">
              <span className="bar-ruler-label">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tracks-container">
        {project.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            bars={project.bars}
            totalSteps={totalSteps}
            isSelected={ui.selectedTrackId === track.id}
            onSelect={() => handleTrackSelect(track.id)}
            isPlaying={playback.isPlaying}
            playheadPct={playheadPct}
          />
        ))}

        <div className="playhead-line" style={{ left: `calc(104px + ${playheadPct}% * ((100% - 104px) / 100%))` }} />
      </div>
    </div>
  );
}

/* ── Track Row ── */
interface TrackRowProps {
  track: Track;
  bars: number;
  totalSteps: number;
  isSelected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  playheadPct: number;
}

function TrackRow({ track, bars, totalSteps, isSelected, onSelect, isPlaying, playheadPct }: TrackRowProps) {
  const theme = INSTRUMENT_THEME[track.kind];

  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${track.name} 音轨`}
      style={instrumentVars(theme)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className="track-info">
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{theme.en}</div>
        {track.muted && <span className="muted-badge">MUTE</span>}
      </div>

      <div className="track-lane">
        {/* Bar grid lines */}
        {Array.from({ length: bars - 1 }, (_, i) => (
          <div
            key={i}
            className="bar-gridline"
            style={{ left: `${((i + 1) / bars) * 100}%` }}
          />
        ))}

        {track.clips.map(clip => (
          <MIDIClip
            key={clip.id}
            clip={clip}
            totalSteps={totalSteps}
            trackKind={track.kind}
          />
        ))}

        {isPlaying && playheadPct >= 0 && (
          <div className="track-playhead" style={{ left: `${playheadPct}%` }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MIDI Clip – renders note blocks & drum hits
   Kinetic Play piano-roll: colored blocks with
   chunky border + note rectangles by time (x) and pitch (y)
   ═══════════════════════════════════════ */
function MIDIClip({
  clip,
  totalSteps,
  trackKind,
}: {
  clip: Clip;
  totalSteps: number;
  trackKind: string;
}) {
  const leftPct = (clip.barStart / 8) * 100;
  const widthPct = (clip.barLength / 8) * 100;

  const { noteBlocks, drumMarks } = useMemo(() => {
    const notes = clip.notes.map(n => {
      const xPct = (n.step / totalSteps) * 100;
      const wPct = Math.max((n.durationSteps / totalSteps) * 100, 0.8);
      const yPct = pitchToY(n.pitch);
      return { x: xPct, w: wPct, y: yPct, key: n.id };
    });

    const drums = clip.drumHits.map(h => {
      const xPct = (h.step / totalSteps) * 100;
      const yPct = drumToY(h.drum);
      const size = Math.max(4, h.velocity * 7);
      return { x: xPct, y: yPct, size, key: h.id };
    });

    return { noteBlocks: notes, drumMarks: drums };
  }, [clip.notes, clip.drumHits, totalSteps]);

  return (
    <div
      className="midi-clip"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
    >
      {/* Note blocks for melodic instruments */}
      {trackKind !== 'drums' && noteBlocks.map(n => (
        <div
          key={n.key}
          className="note-block"
          style={{
            left: `${n.x}%`,
            width: `${n.w}%`,
            bottom: `${n.y}%`,
          }}
        />
      ))}

      {/* Drum hit marks */}
      {trackKind === 'drums' && drumMarks.map(d => (
        <div
          key={d.key}
          className="drum-mark"
          style={{
            left: `calc(${d.x}% - ${d.size / 2}px)`,
            bottom: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: '3px',
          }}
        />
      ))}
    </div>
  );
}

/* ── Pitch → vertical position mapping. Shares the chromatic scale with
   PianoRoll via utils/note.ts so accidentals map correctly and both roll
   views speak the same pitch language. Fixed C2–C5 staff. ── */
const TL_MIN_MIDI = midiOf('C2') ?? 36;
const TL_MAX_MIDI = midiOf('C5') ?? 72;

function pitchToY(pitch: string): number {
  const m = midiOf(aliasPitch(pitch));
  if (m == null) return 40;
  const ratio = (m - TL_MIN_MIDI) / (TL_MAX_MIDI - TL_MIN_MIDI);
  return Math.max(4, Math.min(88, 8 + ratio * 78));
}

function drumToY(drum: string): number {
  switch (drum) {
    case 'kick':  return 15;
    case 'snare': return 35;
    case 'hihat': return 60;
    case 'clap':  return 80;
    default:      return 50;
  }
}
