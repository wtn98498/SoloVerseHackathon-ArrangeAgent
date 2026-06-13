import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';

/* ── Instrument catalogue ── */
const INSTRUMENTS = [
  { kind: 'drums'  as const, icon: '🥁', name: '鼓组', en: 'Drums',  color: '#FF5E5B', soft: '#FFD9D8' },
  { kind: 'bass'   as const, icon: '🎸', name: '贝斯', en: 'Bass',   color: '#00B4A0', soft: '#C8F5EE' },
  { kind: 'guitar' as const, icon: '🎵', name: '吉他', en: 'Guitar', color: '#FFBE0B', soft: '#FFF3CC' },
  { kind: 'keys'   as const, icon: '🎹', name: '键盘', en: 'Keys',   color: '#8338EC', soft: '#E2CCFF' },
];

export function InstrumentSidebar() {
  const { ui, setUi, project, captureSeed } = useEditor();
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  if (!project) return null;

  const selectedTrack = ui.selectedTrackId
    ? project.tracks.find(t => t.id === ui.selectedTrackId) ?? null
    : null;

  const handleSelect = (kind: string) => {
    const track = project.tracks.find(t => t.kind === kind);
    if (track) setUi({ ...ui, selectedTrackId: track.id });
  };

  const handlePadPress = (padId: string) => {
    setActivePads(prev => new Set(prev).add(padId));
  };

  const handleCapture = () => {
    if (!selectedTrack || activePads.size === 0) return;
    const data = Array.from(activePads);

    if (selectedTrack.kind === 'drums') {
      const drumHits = data.map((id, i) => ({
        id, drum: id as any, step: i * 4, velocity: 0.7
      }));
      captureSeed(selectedTrack.kind, [], drumHits);
    } else {
      const notes = data.map((id, i) => ({
        id, pitch: 'C4', step: i * 4, durationSteps: 2, velocity: 0.7
      }));
      captureSeed(selectedTrack.kind, notes, []);
    }
    setActivePads(new Set());
  };

  return (
    <nav className="instrument-sidebar" aria-label="乐器选择">
      <div className="sidebar-title">乐器</div>

      {INSTRUMENTS.map(inst => {
        const track = project.tracks.find(t => t.kind === inst.kind);
        const active = selectedTrack?.kind === inst.kind;

        return (
          <div
            key={inst.kind}
            className={`instrument-item ${active ? 'selected' : ''}`}
            onClick={() => handleSelect(inst.kind)}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={inst.name}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(inst.kind); }}
          >
            <div
              className="instrument-icon"
              style={{
                background: active ? inst.soft : 'var(--canvas)',
                border: active ? `2px solid ${inst.color}` : '2px solid var(--rule-light)',
              }}
            >
              {inst.icon}
            </div>
            <div className="instrument-meta">
              <span className="instrument-name">{inst.name}</span>
              <span className="instrument-kind">{inst.en}</span>
            </div>
            {track?.muted && <span className="instrument-mute" aria-label="已静音">M</span>}
          </div>
        );
      })}

      {/* Pad controller for selected instrument */}
      {selectedTrack && (
        <div className="pad-section">
          <div className="pad-section-title">{selectedTrack.name} 控制器</div>

          <PadController
            kind={selectedTrack.kind}
            onPadPress={handlePadPress}
            activePads={activePads}
          />

          <button
            className="capture-seed-btn"
            onClick={handleCapture}
            disabled={activePads.size === 0}
          >
            🎯 捕获律动
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── Pad Controller dispatch ── */
interface PadProps {
  onPadPress: (id: string) => void;
  activePads: Set<string>;
}

function PadController({ kind, onPadPress, activePads }: PadProps & { kind: string }) {
  if (kind === 'drums') return <DrumsPads onPadPress={onPadPress} activePads={activePads} />;
  if (kind === 'keys')  return <KeysPads  onPadPress={onPadPress} activePads={activePads} />;
  return <SimplePads onPadPress={onPadPress} activePads={activePads} />;
}

/* ── Drums ── */
function DrumsPads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: 'kick',  label: 'Kick',  color: '#FF5E5B' },
    { id: 'snare', label: 'Snare', color: '#E84393' },
    { id: 'hihat', label: 'HiHat', color: '#FDAA4B' },
    { id: 'clap',  label: 'Clap',  color: '#FF8A65' },
  ];

  return (
    <div className="pad-grid pad-grid-4">
      {pads.map(p => (
        <button
          key={p.id}
          className={`drum-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color }}
          aria-label={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── Keys ── */
function KeysPads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: 'C',  label: 'C',  color: '#8338EC' },
    { id: 'D',  label: 'D',  color: '#9150F0' },
    { id: 'E',  label: 'E',  color: '#A068F4' },
    { id: 'F',  label: 'F',  color: '#B080F8' },
    { id: 'G',  label: 'G',  color: '#8338EC' },
    { id: 'A',  label: 'A',  color: '#7028D0' },
    { id: 'B',  label: 'B',  color: '#5C18B4' },
    { id: 'C2', label: 'C²', color: '#480898' },
  ];

  return (
    <div className="pad-grid pad-grid-8">
      {pads.map(p => (
        <button
          key={p.id}
          className={`key-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color }}
          aria-label={`音符 ${p.label}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── Bass / Guitar ── */
function SimplePads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: '1', label: '低',  color: '#00B4A0' },
    { id: '2', label: '中低', color: '#00A08E' },
    { id: '3', label: '中高', color: '#008C7C' },
    { id: '4', label: '高',  color: '#00786A' },
  ];

  return (
    <div className="pad-grid pad-grid-4">
      {pads.map(p => (
        <button
          key={p.id}
          className={`simple-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color }}
          aria-label={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
