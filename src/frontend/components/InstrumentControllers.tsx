import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';

export function InstrumentControllers() {
  const { ui, project, captureSeed } = useEditor();
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  if (!ui.selectedTrackId || !project) return null;

  const track = project.tracks.find(t => t.id === ui.selectedTrackId);
  if (!track) return null;

  const handlePadPress = (padId: string) => {
    setActivePads(prev => {
      const next = new Set(prev);
      next.add(padId);
      return next;
    });
  };

  const handleCompleteSeed = () => {
    if (activePads.size === 0) return;

    const seedData = Array.from(activePads);

    if (track.kind === 'drums') {
      const drumHits = seedData.map((drumId, i) => ({
        id: drumId,
        drum: drumId as any,
        step: i * 4,
        velocity: 0.7
      }));
      captureSeed(track.kind, [], drumHits);
    } else {
      const notes = seedData.map((noteId, i) => ({
        id: noteId,
        pitch: 'C4',
        step: i * 4,
        durationSteps: 2,
        velocity: 0.7
      }));
      captureSeed(track.kind, notes, []);
    }

    setActivePads(new Set());
  };

  return (
    <div className="instrument-controllers">
      <div className="controller-header">
        <h3>控制面板</h3>
        <span className="track-badge" style={{ backgroundColor: track.color }}>
          {track.name}
        </span>
      </div>

      <div className="controller-body">
        {track.kind === 'drums' && <DrumsController onPadPress={handlePadPress} activePads={activePads} />}
        {track.kind === 'keys' && <KeysController onPadPress={handlePadPress} activePads={activePads} />}
        {(track.kind === 'bass' || track.kind === 'guitar') && <SimpleController onPadPress={handlePadPress} activePads={activePads} />}
      </div>

      <div className="controller-footer">
        <button
          className="complete-seed-button"
          onClick={handleCompleteSeed}
          disabled={activePads.size === 0}
        >
          捕获律动
        </button>
      </div>
    </div>
  );
}

interface ControllerProps {
  onPadPress: (padId: string) => void;
  activePads: Set<string>;
}

function DrumsController({ onPadPress, activePads }: ControllerProps) {
  const drums = [
    { id: 'kick', label: '脚鼓', color: '#ff6b6b' },
    { id: 'snare', label: '军鼓', color: '#ee5a5a' },
    { id: 'hihat', label: '踩镲', color: '#ff8787' },
    { id: 'clap', label: '拍手', color: '#ffa8a8' }
  ];

  return (
    <div className="drums-controller">
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

function KeysController({ onPadPress, activePads }: ControllerProps) {
  const keys = [
    { id: 'C', label: 'C', color: '#a8dadc' },
    { id: 'D', label: 'D', color: '#87ceeb' },
    { id: 'E', label: 'E', color: '#6bb8d9' },
    { id: 'F', label: 'F', color: '#4ea8c7' },
    { id: 'G', label: 'G', color: '#3198b5' },
    { id: 'A', label: 'A', color: '#1488a3' },
    { id: 'B', label: 'B', color: '#007891' },
    { id: 'C2', label: 'C²', color: '#00687f' }
  ];

  return (
    <div className="keys-controller">
      {keys.map(key => (
        <button
          key={key.id}
          className={`key-pad ${activePads.has(key.id) ? 'active' : ''}`}
          onClick={() => onPadPress(key.id)}
          style={{ backgroundColor: key.color }}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

function SimpleController({ onPadPress, activePads }: ControllerProps) {
  const pads = [
    { id: '1', label: '低', color: '#4ecdc4' },
    { id: '2', label: '中低', color: '#45b7af' },
    { id: '3', label: '中', color: '#3ca49c' },
    { id: '4', label: '中高', color: '#38918a' }
  ];

  return (
    <div className="simple-controller">
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
