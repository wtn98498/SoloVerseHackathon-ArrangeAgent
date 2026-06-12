import { useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './frontend/contexts/EditorContext';
import { TransportBar } from './frontend/components/TransportBar';
import { TrackTimeline } from './frontend/components/TrackTimeline';
import { InstrumentControllers } from './frontend/components/InstrumentControllers';
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
    <div className="app-container">
      <header className="app-header">
        <h1>🎵 PlayBand AI</h1>
        <p className="tagline">音乐游乐场</p>
        {audioStatus === 'blocked' && (
          <p className="audio-warning">音频暂未启动，但演示界面仍可继续操作。</p>
        )}
      </header>

      <div className="main-content">
        <div className="editor-area">
          <TransportBar />

          <div className="editor-body">
            <div className="timeline-area">
              <TrackTimeline project={fixtureProject} />
            </div>

            <div className="instruments-area">
              <InstrumentControllers />
            </div>
          </div>
        </div>

        <div className="agent-area">
          <AgentPanel />
        </div>
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
