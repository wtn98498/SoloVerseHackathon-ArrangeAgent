import { useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './frontend/contexts/EditorContext';
import { TransportBar } from './frontend/components/TransportBar';
import { TrackTimeline } from './frontend/components/TrackTimeline';
import { PianoRoll } from './frontend/components/PianoRoll';
import { AgentPanel } from './frontend/components/AgentPanel';
import { audioEngine } from './frontend/audio/AudioEngine';
import { createDemoStartProject } from './frontend/demoStart';
import { INSTRUMENT_THEME, INSTRUMENT_ORDER } from './frontend/theme';
import './App.css';

function AppContent() {
  const [audioStatus, setAudioStatus] = useState<'idle' | 'ready' | 'blocked'>('idle');
  const [view, setView] = useState<'hero' | 'editor'>('hero');
  const { project, ui, setUi, playback, setPlayback, startNewSong, startWithCannedGroove } = useEditor();

  // Render & play from the live context project; fall back to a blank demo
  // before the user picks a start path from the hero.
  const activeProject = project ?? createDemoStartProject();

  // Only tear down audio on unmount. The initial project + onboarding state are
  // now set by the hero CTAs (startNewSong / startWithCannedGroove), so we no
  // longer auto-create a project on mount — the hero is the first screen.
  useEffect(() => () => audioEngine.dispose(), []);

  const beginFreePlay = () => {
    startNewSong();
    setView('editor');
  };
  const beginWithGroove = () => {
    startWithCannedGroove();
    setView('editor');
  };

  // Handle playback state changes
  useEffect(() => {
    if (!playback.isPlaying || !activeProject) {
      audioEngine.stopSequence();
      return;
    }

    let cancelled = false;

    // Drive the UI playhead from the audio clock so it stays in sync with sound
    // at any tempo (replaces the old fixed 125ms UI interval that drifted).
    audioEngine.setOnStep((step) => {
      if (cancelled) return;
      setPlayback({ ...playback, currentStep: step });
    });

    audioEngine.initialize()
      .then(() => {
        if (cancelled) return;
        setAudioStatus('ready');
        audioEngine.setTempo(playback.tempo);
        audioEngine.playProject(
          activeProject,
          playback.currentStep,
          playback.loop ? { start: playback.loopStart, end: playback.loopEnd } : null
        );
      })
      .catch(() => {
        if (!cancelled) {
          setAudioStatus('blocked');
        }
      });

    return () => {
      cancelled = true;
      audioEngine.setOnStep(undefined);
      audioEngine.stopSequence();
    };
  }, [playback.isPlaying, playback.tempo, playback.loop, playback.loopStart, playback.loopEnd, activeProject]);

  if (view === 'hero') {
    return (
      <div className="app-root">
        <StartHero onFreePlay={beginFreePlay} onGroove={beginWithGroove} />
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Transport – top, centered */}
      <header className="player-bar">
        <div className="player-bar-inner">
          <TransportBar />
        </div>
      </header>

      {/* Two-column layout — instrument cards are now the timeline's left header;
          agent panel is a closable drawer */}
      <div className={`main-layout ${ui.showAgentPanel ? 'agent-open' : 'agent-closed'}`}>
        {/* Center: Arrangement canvas (track headers + lanes) + piano roll */}
        <main className="center-stage">
          {audioStatus === 'blocked' && (
            <div className="audio-notice">
              音频暂未启动，界面仍可继续操作
            </div>
          )}
          <div className="editor-split">
            <TrackTimeline project={activeProject} />
            <PianoRoll project={activeProject} />
          </div>
        </main>

        {/* Right: AI Copilot drawer (or a reopen tab when closed) */}
        {ui.showAgentPanel ? (
          <aside className="sidebar-agent">
            <AgentPanel />
          </aside>
        ) : (
          <button
            className="agent-reopen"
            onClick={() => setUi({ ...ui, showAgentPanel: true })}
            aria-label="展开 AI 助手"
            title="展开 AI 助手"
          >
            <span className="material-symbols-outlined" aria-hidden>auto_awesome</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StartHero({ onFreePlay, onGroove }: { onFreePlay: () => void; onGroove: () => void; }) {
  return (
    <section className="hero-screen" aria-label="开始">
      <div className="hero-inner">
        <span className="hero-kicker">Play first. Arrange later.</span>
        <h1 className="hero-title">先玩 5 秒<br />AI 帮你扩成一支乐队</h1>
        <p className="hero-tagline">
          不用懂乐理，也不用打开专业 DAW。敲几下、或先听个现成的开头，剩下的交给 Music Director。
        </p>
        <div className="hero-ctas">
          <button className="hero-cta play" onClick={onFreePlay} aria-label="随便玩玩">
            <span className="material-symbols-outlined" aria-hidden>music_note</span>
            <span className="hero-cta-text">
              <strong>随便玩玩</strong>
              <em>敲几下鼓或弹几个音</em>
            </span>
          </button>
          <button className="hero-cta groove" onClick={onGroove} aria-label="给我个开头">
            <span className="material-symbols-outlined" aria-hidden>auto_awesome</span>
            <span className="hero-cta-text">
              <strong>给我个开头</strong>
              <em>先听一段现成律动，再改</em>
            </span>
          </button>
        </div>
        <div className="hero-chips" aria-hidden>
          {INSTRUMENT_ORDER.map((kind) => (
            <span
              key={kind}
              className="hero-chip"
              style={{ background: INSTRUMENT_THEME[kind].color }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;
