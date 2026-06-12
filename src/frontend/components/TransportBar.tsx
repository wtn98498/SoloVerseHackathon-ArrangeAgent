import { useEditor } from '../contexts/EditorContext';

export function TransportBar() {
  const { project, playback, setPlayback } = useEditor();

  const handlePlayStop = () => {
    setPlayback({
      ...playback,
      isPlaying: !playback.isPlaying
    });
  };

  const handleTempoChange = (tempo: number) => {
    setPlayback({
      ...playback,
      tempo: Math.max(60, Math.min(200, tempo))
    });
  };

  if (!project) return null;

  return (
    <div className="transport-bar">
      <div className="transport-controls">
        <button
          className={`play-button ${playback.isPlaying ? 'playing' : ''}`}
          onClick={handlePlayStop}
        >
          {playback.isPlaying ? '⏸ 停止' : '▶ 播放'}
        </button>

        <div className="tempo-control">
          <label>速度:</label>
          <input
            type="number"
            min="60"
            max="200"
            value={playback.tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value) || 120)}
            className="tempo-input"
          />
          <span className="tempo-value">BPM</span>
        </div>
      </div>

      <div className="style-controls">
        <div className="style-badge">
          <span className="style-label">风格:</span>
          <span className="style-value">{project.style}</span>
        </div>
        <div className="mood-badge">
          <span className="mood-label">情绪:</span>
          <span className="mood-value">{project.mood}</span>
        </div>
      </div>
    </div>
  );
}