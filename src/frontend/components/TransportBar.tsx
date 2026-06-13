import { useEditor } from '../contexts/EditorContext';

const STYLE_LABELS: Record<string, string> = {
  pop: 'Pop',
  lofi: 'Lo-fi',
  rock: 'Rock',
};

const MOOD_LABELS: Record<string, string> = {
  bright: '明亮',
  soft: '柔和',
  energetic: '活力',
};

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
    <div className="transport-bar" role="toolbar" aria-label="播放控制">
      {/* Play / Stop */}
      <div className="transport-controls">
        <button
          className={`play-button ${playback.isPlaying ? 'playing' : ''}`}
          onClick={handlePlayStop}
          aria-label={playback.isPlaying ? '停止' : '播放'}
          title={playback.isPlaying ? '停止 (Space)' : '播放 (Space)'}
        >
          {playback.isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      {/* BPM */}
      <div className="tempo-control">
        <label htmlFor="tempo-input">BPM</label>
        <input
          id="tempo-input"
          type="number"
          min="60"
          max="200"
          value={playback.tempo}
          onChange={(e) => handleTempoChange(parseInt(e.target.value) || 120)}
          className="tempo-input"
          aria-label="速度"
        />
      </div>

      {/* Style pill */}
      <div className="style-badge">
        <span className="style-label">风格</span>
        <span className="style-value">
          {STYLE_LABELS[project.style] ?? project.style}
        </span>
      </div>

      {/* Mood pill */}
      <div className="mood-badge">
        <span className="mood-label">情绪</span>
        <span className="mood-value">
          {MOOD_LABELS[project.mood] ?? project.mood}
        </span>
      </div>
    </div>
  );
}
