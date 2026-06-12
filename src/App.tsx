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
  const [isInitialized, setIsInitialized] = useState(false);
  const { setProject, playback } = useEditor();

  useEffect(() => {
    // Initialize audio engine on mount
    audioEngine.initialize().then(() => {
      setIsInitialized(true);
      // Load fixture project
      setProject(fixtureProject);
    });

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

    audioEngine.playProject(fixtureProject, playback.currentStep);
    audioEngine.setTempo(playback.tempo);

    return () => {
      audioEngine.stopSequence();
    };
  }, [playback.isPlaying, playback.tempo, fixtureProject]);

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>初始化音频引擎...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎵 PlayBand AI</h1>
        <p className="tagline">音乐游乐场</p>
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
