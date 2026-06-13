import { ArrangementProject, Track } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';

interface TrackTimelineProps {
  project: ArrangementProject;
}

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, ui, setUi } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;

  const handleTrackSelect = (trackId: string) => {
    setUi({
      ...ui,
      selectedTrackId: trackId
    });
  };

  const getPlayheadPosition = () => {
    if (!playback.isPlaying) return 0;
    return (playback.currentStep / totalSteps) * 100;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>编曲</h3>
        <div className="timeline-info">
          <span>{project.bars} 小节</span>
          <span>·</span>
          <span>{totalSteps} 步</span>
        </div>
      </div>

      <div className="tracks-container" style={{ position: 'relative' }}>
        {project.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            totalSteps={totalSteps}
            isSelected={ui.selectedTrackId === track.id}
            onSelect={() => handleTrackSelect(track.id)}
            isPlaying={playback.isPlaying}
            playheadPosition={getPlayheadPosition()}
          />
        ))}

        {/* Global playhead */}
        {playback.isPlaying && (
          <div
            className="playhead-line"
            style={{ left: `calc(100px + ${getPlayheadPosition()}% * (1 - 100px / 100%))` }}
          />
        )}
      </div>
    </div>
  );
}

interface TrackRowProps {
  track: Track;
  totalSteps: number;
  isSelected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  playheadPosition: number;
}

function TrackRow({ track, isSelected, onSelect, isPlaying, playheadPosition }: TrackRowProps) {
  const renderClips = () => {
    return track.clips.map(clip => {
      const startPercent = (clip.barStart / 8) * 100;
      const widthPercent = (clip.barLength / 8) * 100;
      const hasNotes = clip.notes.length > 0;
      const hasDrums = clip.drumHits.length > 0;

      return (
        <div
          key={clip.id}
          className="clip"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: `${track.color}30`,
          }}
        >
          {/* Waveform SVG pattern */}
          <WaveformSVG color={track.color} density={hasDrums ? 'high' : 'normal'} />

          <div className="clip-content">
            {hasNotes && <span className="clip-notes">{clip.notes.length} ♪</span>}
            {hasDrums && <span className="clip-drums">{clip.drumHits.length} ●</span>}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
    >
      <div className="track-info" style={{ borderColor: track.color }}>
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{track.kind}</div>
        {track.muted && <div className="muted-badge">MUTE</div>}
      </div>

      <div className="track-lane">
        {renderClips()}
        {isPlaying && (
          <div
            className="track-playhead"
            style={{ left: `${playheadPosition}%` }}
          />
        )}
      </div>
    </div>
  );
}

/** Inline SVG waveform pattern for clip visualization */
function WaveformSVG({ color, density }: { color: string; density: 'high' | 'normal' }) {
  const bars = density === 'high' ? 32 : 20;
  const heights = Array.from({ length: bars }, (_, i) => {
    // Pseudo-random waveform heights
    const seed = (i * 7 + 13) % 17;
    return 20 + (seed / 17) * 60; // 20% to 80% height
  });

  return (
    <svg
      className="clip-wave"
      viewBox={`0 0 ${bars * 8} 100`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 8 + 1}
          y={(100 - h) / 2}
          width={5}
          rx={2}
          height={h}
          fill={color}
        />
      ))}
    </svg>
  );
}
