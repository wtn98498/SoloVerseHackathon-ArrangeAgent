import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';

const INSTRUMENTS = [
  { kind: 'drums' as const, icon: '🥁', name: '鼓组', label: 'Drums', color: '#FF6B6B' },
  { kind: 'bass' as const, icon: '🎸', name: '贝斯', label: 'Bass', color: '#4ECDC4' },
  { kind: 'guitar' as const, icon: '🎵', name: '吉他', label: 'Guitar', color: '#FFD93D' },
  { kind: 'keys' as const, icon: '🎹', name: '键盘', label: 'Keys', color: '#6C5CE7' },
];

export function InstrumentSidebar() {
  const { ui, setUi, project, captureSeed } = useEditor();
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  if (!project) return null;

  const selectedTrack = ui.selectedTrackId
    ? project.tracks.find(t => t.id === ui.selectedTrackId)
    : null;

  const handleSelectInstrument = (kind: string) => {
    const track = project.tracks.find(t => t.kind === kind);
    if (track) {
      setUi({ ...ui, selectedTrackId: track.id });
    }
  };

  const handlePadPress = (padId: string) => {
    setActivePads(prev => {
      const next = new Set(prev);
      next.add(padId);
      return next;
    });
  };

  const handleCaptureSeed = () => {
    if (!selectedTrack || activePads.size === 0) return;
    const seedData = Array.from(activePads);

    if (selectedTrack.kind === 'drums') {
      const drumHits = seedData.map((drumId, i) => ({
        id: drumId,
        drum: drumId as any,
        step: i * 4,
        velocity: 0.7
      }));
      captureSeed(selectedTrack.kind, [], drumHits);
    } else {
      const notes = seedData.map((noteId, i) => ({
        id: noteId,
        pitch: 'C4',
        step: i * 4,
        durationSteps: 2,
        velocity: 0.7
      }));
      captureSeed(selectedTrack.kind, notes, []);
    }
    setActivePads(new Set());
  };

  return (
    <div className="instrument-sidebar">
      <div className="sidebar-title">乐器</div>

      {INSTRUMENTS.map(inst => {
        const track = project.tracks.find(t => t.kind === inst.kind);
        const isSelected = selectedTrack?.kind === inst.kind;

        return (
          <div
            key={inst.kind}
            className={`instrument-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelectInstrument(inst.kind)}
            style={{ borderLeftColor: isSelected ? inst.color : 'transparent' }}
          >
            <div
              className="instrument-icon"
              style={{
                background: isSelected ? `${inst.color}20` : 'var(--bg)',
                border: isSelected ? `2px solid ${inst.color}` : '2px solid var(--border)'
              }}
            >
              {inst.icon}
            </div>
            <div className="instrument-meta">
              <span className="instrument-name">{inst.name}</span>
              <span className="instrument-kind">{inst.label}</span>
            </div>
            {track?.muted && <div className="instrument-mute">M</div>}
          </div>
        );
      })}

      {/* Pad Controller for selected instrument */}
      {selectedTrack && (
        <div className="pad-section">
          <div className="pad-section-title">
            {selectedTrack.name} 控制器
          </div>

          <PadController
            kind={selectedTrack.kind}
            onPadPress={handlePadPress}
            activePads={activePads}
          />

          <button
            className="capture-seed-btn"
            onClick={handleCaptureSeed}
            disabled={activePads.size === 0}
          >
            🎯 捕获律动
          </button>
        </div>
      )}
    </div>
  );
}

interface PadProps {
  onPadPress: (padId: string) => void;
  activePads: Set<string>;
}

function PadController({ kind, onPadPress, activePads }: PadProps & { kind: string }) {
  if (kind === 'drums') return <DrumsPads onPadPress={onPadPress} activePads={activePads} />;
  if (kind === 'keys') return <KeysPads onPadPress={onPadPress} activePads={activePads} />;
  return <SimplePads onPadPress={onPadPress} activePads={activePads} />;
}

function DrumsPads({ onPadPress, activePads }: PadProps) {
  const drums = [
    { id: 'kick', label: '脚鼓', color: '#FF6B6B' },
    { id: 'snare', label: '军鼓', color: '#E84393' },
    { id: 'hihat', label: '踩镲', color: '#FDCB6E' },
    { id: 'clap', label: '拍手', color: '#E17055' }
  ];

  return (
    <div className="pad-grid pad-grid-4">
      {drums.map(drum => (
        <button
          key={drum.id}
          className={`drum-pad ${activePads.has(drum.id) ? 'active' : ''}`}
          onClick={() => onPadPress(drum.id)}
          style={{ backgroundColor: drum.color }}
        >
          {drum.label}
        </button>
      ))}
    </div>
  );
}

function KeysPads({ onPadPress, activePads }: PadProps) {
  const keys = [
    { id: 'C', label: 'C', color: '#6C5CE7' },
    { id: 'D', label: 'D', color: '#7C6CF7' },
    { id: 'E', label: 'E', color: '#8B7CF7' },
    { id: 'F', label: 'F', color: '#A29BFE' },
    { id: 'G', label: 'G', color: '#6C5CE7' },
    { id: 'A', label: 'A', color: '#5B4CC4' },
    { id: 'B', label: 'B', color: '#4A3CA1' },
    { id: 'C2', label: 'C²', color: '#3A2C7E' }
  ];

  return (
    <div className="pad-grid pad-grid-8">
      {keys.map(key => (
        <button
          key={key.id}
          className={`key-pad ${activePads.has(key.id) ? 'active' : ''}`}
          onClick={() => onPadPress(key.id)}
          style={{ backgroundColor: key.color, minHeight: 36 }}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

function SimplePads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: '1', label: '低', color: '#4ECDC4' },
    { id: '2', label: '中低', color: '#45B7AF' },
    { id: '3', label: '中高', color: '#3BA09C' },
    { id: '4', label: '高', color: '#2E8B89' }
  ];

  return (
    <div className="pad-grid pad-grid-4">
      {pads.map(pad => (
        <button
          key={pad.id}
          className={`simple-pad ${activePads.has(pad.id) ? 'active' : ''}`}
          onClick={() => onPadPress(pad.id)}
          style={{ backgroundColor: pad.color }}
        >
          {pad.label}
        </button>
      ))}
    </div>
  );
}
