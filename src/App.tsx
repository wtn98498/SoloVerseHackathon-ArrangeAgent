import { useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './frontend/contexts/EditorContext';
import { TransportBar } from './frontend/components/TransportBar';
import { TrackTimeline } from './frontend/components/TrackTimeline';
import { PianoRoll } from './frontend/components/PianoRoll';
import { AgentPanel } from './frontend/components/AgentPanel';
import { audioEngine } from './frontend/audio/AudioEngine';
import { createDemoStartProject } from './frontend/demoStart';
import './App.css';

function AppContent() {
  const [audioStatus, setAudioStatus] = useState<'idle' | 'ready' | 'blocked'>('idle');
  const { project, setProject, ui, setUi, playback, setPlayback } = useEditor();

  // Render & play from the live context project; fall back to a blank demo
  // before the first effect runs (project is null on the initial render).
  const activeProject = project ?? createDemoStartProject();

  useEffect(() => {
    const starterProject = createDemoStartProject();
    setProject(starterProject);
    setUi({
      ...ui,
      selectedTrackId: 'track-drums',
      selectedInstrument: 'drums',
      onboardingStep: 'drums',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      audioEngine.dispose();
    };
  }, [setProject]);

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

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;
