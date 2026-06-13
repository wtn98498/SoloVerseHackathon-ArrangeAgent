import { useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './frontend/contexts/EditorContext';
import { TransportBar } from './frontend/components/TransportBar';
import { TrackTimeline } from './frontend/components/TrackTimeline';
import { InstrumentSidebar } from './frontend/components/InstrumentSidebar';
import { AgentPanel } from './frontend/components/AgentPanel';
import { audioEngine } from './frontend/audio/AudioEngine';
import { fixtureProject } from './fixtures/project';
import './App.css';

function AppContent() {
  const [audioStatus, setAudioStatus] = useState<'idle' | 'ready' | 'blocked'>('idle');
  const { setProject, playback } = useEditor();

  useEffect(() => {
    setProject(fixtureProject);

    return () => {
      audioEngine.dispose();
    };
  }, [setProject]);

  // Handle playback state changes
  useEffect(() => {
    if (!playback.isPlaying || !fixtureProject) {
      audioEngine.stopSequence();
      return;
    }

    let cancelled = false;

    audioEngine.initialize()
      .then(() => {
        if (cancelled) return;
        setAudioStatus('ready');
        audioEngine.setTempo(playback.tempo);
        audioEngine.playProject(fixtureProject, playback.currentStep);
      })
      .catch(() => {
        if (!cancelled) {
          setAudioStatus('blocked');
        }
      });

    return () => {
      cancelled = true;
      audioEngine.stopSequence();
    };
  }, [playback.isPlaying, playback.tempo, fixtureProject]);

  return (
    <div className="app-root">
      {/* Transport – top, centered */}
      <header className="player-bar">
        <div className="player-bar-inner">
          <TransportBar />
        </div>
      </header>

      {/* Three-column layout */}
      <div className="main-layout">
        {/* Left: Instruments */}
        <aside className="sidebar-instruments">
          <InstrumentSidebar />
        </aside>

        {/* Center: Arrangement canvas */}
        <main className="center-stage">
          {audioStatus === 'blocked' && (
            <div className="audio-notice">
              音频暂未启动，界面仍可继续操作
            </div>
          )}
          <TrackTimeline project={fixtureProject} />
        </main>

        {/* Right: AI Copilot */}
        <aside className="sidebar-agent">
          <AgentPanel />
        </aside>
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
