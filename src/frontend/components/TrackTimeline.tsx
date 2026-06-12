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
        <h3>音轨</h3>
        <div className="timeline-info">
          <span>{project.bars} 小节</span>
          <span>•</span>
          <span>{totalSteps} 步</span>
        </div>
      </div>

      <div className="tracks-container">
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
      </div>

      {playback.isPlaying && (
        <div className="playhead-line" style={{ left: `${getPlayheadPosition()}%` }} />
      )}
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

      return (
        <div
          key={clip.id}
          className="clip"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: `${track.color}40`
          }}
        >
          <div className="clip-content">
            <span className="clip-notes">{clip.notes.length} 音符</span>
            {clip.drumHits.length > 0 && (
              <span className="clip-drums"> + {clip.drumHits.length} 鼓点</span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
      style={{ borderLeftColor: track.color }}
    >
      <div className="track-info">
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{track.kind}</div>
        {track.muted && <div className="muted-badge">静音</div>}
      </div>

      <div className="track-lane">
        {renderClips()}
      </div>

      {isPlaying && (
        <div
          className="track-playhead"
          style={{ left: `${playheadPosition}%` }}
        />
      )}
    </div>
  );
}