import { useMemo } from 'react';
import { ArrangementProject, Track, Clip, NoteEvent, DrumHit } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';

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
      <div className="timeline-header">
        <h3>编曲</h3>
        <div className="timeline-info">
          <span>{project.bars} 小节</span>
          <span aria-hidden="true">·</span>
          <span>{totalSteps} 步</span>
        </div>
      </div>

      <div className="tracks-container">
        {project.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isSelected={ui.selectedTrackId === track.id}
            onSelect={() => handleTrackSelect(track.id)}
            isPlaying={playback.isPlaying}
            playheadPct={playheadPct}
          />
        ))}

        {/* Global playhead overlay */}
        {playheadPct >= 0 && (
          <div
            className="playhead-line"
            style={{ left: `calc(96px + ${playheadPct}% * ((100% - 96px) / 100%))` }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Track Row ── */
interface TrackRowProps {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  playheadPct: number;
}

function TrackRow({ track, isSelected, onSelect, isPlaying, playheadPct }: TrackRowProps) {
  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${track.name} 音轨`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className="track-info" style={{ borderColor: track.color }}>
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{track.kind}</div>
        {track.muted && <span className="muted-badge">MUTE</span>}
      </div>

      <div className="track-lane">
        {track.clips.map(clip => (
          <ClipBlock
            key={clip.id}
            clip={clip}
            trackColor={track.color}
          />
        ))}
        {isPlaying && playheadPct >= 0 && (
          <div
            className="track-playhead"
            style={{ left: `${playheadPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Clip Block with waveform ── */
function ClipBlock({ clip, trackColor }: { clip: Clip; trackColor: string }) {
  const leftPct = (clip.barStart / 8) * 100;
  const widthPct = (clip.barLength / 8) * 100;

  const hasNotes = clip.notes.length > 0;
  const hasDrums = clip.drumHits.length > 0;

  return (
    <div
      className="clip"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: `${trackColor}22`,
        borderLeft: `3px solid ${trackColor}`,
      }}
    >
      <WaveformBars
        color={trackColor}
        notes={clip.notes}
        drumHits={clip.drumHits}
        barLength={clip.barLength}
      />
      <div className="clip-content">
        {hasNotes && <span className="clip-notes">{clip.notes.length} ♪</span>}
        {hasDrums && <span className="clip-drums">{clip.drumHits.length} ●</span>}
      </div>
    </div>
  );
}

/* ── SVG Waveform bars – derived from actual note/drum data ── */
function WaveformBars({
  color,
  notes,
  drumHits,
  barLength,
}: {
  color: string;
  notes: NoteEvent[];
  drumHits: DrumHit[];
  barLength: number;
}) {
  const totalSteps = barLength * 4 * 4; // 16 steps per bar
  const barCount = 64;
  const stepWidth = totalSteps / barCount;

  // Build a density map from actual events
  const density = useMemo(() => {
    const d = new Float32Array(barCount);
    for (const n of notes) {
      const center = Math.floor((n.step + n.durationSteps / 2) / stepWidth);
      const spread = Math.max(1, Math.ceil(n.durationSteps / stepWidth / 2));
      for (let j = -spread; j <= spread; j++) {
        const idx = center + j;
        if (idx >= 0 && idx < barCount) {
          const falloff = 1 - Math.abs(j) / (spread + 1);
          d[idx] = Math.max(d[idx], n.velocity * falloff);
        }
      }
    }
    for (const h of drumHits) {
      const center = Math.floor(h.step / stepWidth);
      for (let j = -1; j <= 1; j++) {
        const idx = center + j;
        if (idx >= 0 && idx < barCount) {
          const falloff = j === 0 ? 1 : 0.5;
          d[idx] = Math.max(d[idx], h.velocity * falloff);
        }
      }
    }
    // Normalize: ensure minimum visual presence if there is any data
    const maxVal = Math.max(...d);
    if (maxVal > 0) {
      for (let i = 0; i < barCount; i++) {
        d[i] = Math.max(d[i], 0.08); // minimum bar height
      }
    }
    return d;
  }, [notes, drumHits, totalSteps]);

  const barW = 3;
  const gap = 2;
  const svgW = barCount * (barW + gap);

  return (
    <svg
      className="clip-wave"
      viewBox={`0 0 ${svgW} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from(density).map((d, i) => {
        const h = Math.max(4, d * 80);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={(100 - h) / 2}
            width={barW}
            rx={1.5}
            height={h}
            fill={color}
          />
        );
      })}
    </svg>
  );
}
