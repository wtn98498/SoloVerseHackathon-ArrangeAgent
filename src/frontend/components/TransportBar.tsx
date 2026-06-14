import { useEditor } from '../contexts/EditorContext';

export function TransportBar() {
  const { project, playback, setPlayback, startNewSong, ui } = useEditor();

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

  // Position readout: bar.beat.sub — derived from the current step.
  const step = playback.currentStep;
  const bar = Math.floor(step / 16) + 1;
  const beat = Math.floor((step % 16) / 4) + 1;
  const sub = (step % 4) + 1;
  const pos = `${String(bar).padStart(2, '0')}.${beat}.${sub}`;

  return (
    <div className="transport-bar" role="toolbar" aria-label="播放控制">
      <button
        className="new-song-button"
        onClick={startNewSong}
        aria-label="新建曲子"
        title="新建曲子"
      >
        <span className="material-symbols-outlined" aria-hidden>add_circle</span>
        新建曲子
      </button>

      {/* Loop toggle */}
      <div className="transport-controls">
        <button
          className={`loop-button ${playback.loop ? 'active' : ''}`}
          onClick={() => setPlayback({ ...playback, loop: !playback.loop })}
          aria-label={playback.loop ? '关闭循环' : '开启循环'}
          aria-pressed={playback.loop}
          title={playback.loop ? '循环：开（再按关闭）' : '循环：关'}
        >
          <span className="material-symbols-outlined" aria-hidden>repeat</span>
        </button>

        {/* Play / Stop */}
        <button
          className={`play-button ${playback.isPlaying ? 'playing' : ''}`}
          onClick={handlePlayStop}
          aria-label={playback.isPlaying ? '停止' : '播放'}
          title={playback.isPlaying ? '停止 (Space)' : '播放 (Space)'}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {playback.isPlaying ? 'stop' : 'play_arrow'}
          </span>
        </button>
      </div>

      {/* BPM */}
      <div className="tempo-control">
        <label htmlFor="tempo-input" className="label-cap">BPM</label>
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

      {/* Signature readout — same size as BPM */}
      <div className="tempo-control" title="拍号">
        <span className="label-cap">SIG</span>
        <span className="transport-value">4/4</span>
      </div>

      {/* Position readout — same size as BPM */}
      <div className="tempo-control" title="位置">
        <span className="label-cap">POS</span>
        <span className="transport-value">{pos}</span>
      </div>

      {ui.onboardingStep !== 'idle' && (
        <div className={`onboarding-pill step-${ui.onboardingStep}`} aria-live="polite">
          <span className="material-symbols-outlined" aria-hidden>
            {ui.onboardingStep === 'agent' ? 'auto_awesome' : 'touch_app'}
          </span>
          {ui.onboardingStep === 'drums' && '点捕获律动，敲几下鼓，满意后进 MIDI'}
          {ui.onboardingStep === 'keys' && '再捕获几个 Keys 音，满意后进 MIDI'}
          {ui.onboardingStep === 'agent' && '种子已进 MIDI，去右侧和 Agent 对话或补全'}
        </div>
      )}
    </div>
  );
}
