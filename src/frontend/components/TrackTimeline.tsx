import { useMemo } from 'react';
import { ArrangementProject, Track, Clip } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';

interface TrackTimelineProps {
  project: ArrangementProject;
}

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, ui, setUi } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

  const playheadPct = playback.isPlaying
    ? (playback.currentStep / totalSteps) * 100
    : -1;

  return (
    <div className="timeline-container" role="region" aria-label="编曲时间线">
      {/* Bar ruler */}
      <div className="bar-ruler">
        <div className="bar-ruler-gutter" />
        <div className="bar-ruler-track">
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

        {playheadPct >= 0 && (
          <div className="playhead-line" style={{ left: `calc(104px + ${playheadPct}% * ((100% - 104px) / 100%))` }} />
        )}
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

/* ── Pitch → vertical position mapping ── */
const PITCH_MAP: Record<string, number> = {};
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MIN_PIANO_OCTAVE = 2;
const MAX_PIANO_OCTAVE = 4;
const PIANO_LANE_COUNT = (MAX_PIANO_OCTAVE - MIN_PIANO_OCTAVE + 1) * NOTES.length;

for (let oct = MIN_PIANO_OCTAVE; oct <= MAX_PIANO_OCTAVE; oct++) {
  NOTES.forEach((note, i) => {
    const lane = (oct - MIN_PIANO_OCTAVE) * NOTES.length + i;
    PITCH_MAP[`${note}${oct}`] = 8 + (lane / Math.max(1, PIANO_LANE_COUNT - 1)) * 78;
  });
}
PITCH_MAP['C²'] = PITCH_MAP['C4'] ?? 78;

function pitchToY(pitch: string): number {
  return Math.min(85, PITCH_MAP[pitch] ?? 40);
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
