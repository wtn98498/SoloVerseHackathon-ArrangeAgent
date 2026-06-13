import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_ORDER, INSTRUMENT_THEME, instrumentVars } from '../theme';
import { AddInstrumentModal } from './AddInstrumentModal';

export function InstrumentSidebar() {
  const { ui, setUi, project, captureSeed } = useEditor();
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

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
      <div className="sidebar-title">Instruments · 乐器</div>

      {INSTRUMENT_ORDER.map(kind => {
        const theme = INSTRUMENT_THEME[kind];
        const track = project.tracks.find(t => t.kind === kind);
        const active = selectedTrack?.kind === kind;

        return (
          <div
            key={kind}
            className={`instrument-item ${active ? 'selected' : ''}`}
            onClick={() => handleSelect(kind)}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={theme.label}
            style={instrumentVars(theme)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(kind); }}
          >
            <div className="instrument-icon">
              <img src={theme.icon} alt="" draggable={false} />
            </div>
            <div className="instrument-meta">
              <span className="instrument-name">{theme.label}</span>
              <span className="instrument-kind">{theme.en}</span>
            </div>
            {track?.muted && <span className="instrument-mute" aria-label="已静音">M</span>}
          </div>
        );
      })}

      {/* Pad controller for selected instrument */}
      {selectedTrack && (
        <div className="pad-section">
          <div className="pad-section-title">{selectedTrack.name} · 控制器</div>

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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
            捕获律动
          </button>
        </div>
      )}

      <button className="add-track-btn" onClick={() => setShowAdd(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>add</span>
        添加乐器
      </button>

      <AddInstrumentModal open={showAdd} onClose={() => setShowAdd(false)} />
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
  return <SimplePads kind={kind} onPadPress={onPadPress} activePads={activePads} />;
}

/* ── Drums — warm red/orange family, red shadow ── */
function DrumsPads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: 'kick',  label: 'Kick',  color: '#e60012' },
    { id: 'snare', label: 'Snare', color: '#ff6a3d' },
    { id: 'hihat', label: 'HiHat', color: '#ff9f1c' },
    { id: 'clap',  label: 'Clap',  color: '#ff4d6d' },
  ];

  return (
    <div className="pad-grid pad-grid-4">
      {pads.map(p => (
        <button
          key={p.id}
          className={`drum-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color, ['--cs' as any]: '#930007' }}
          aria-label={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── Keys — blue family, blue shadow ── */
function KeysPads({ onPadPress, activePads }: PadProps) {
  const pads = [
    { id: 'C',  label: 'C',  color: '#37b4ff' },
    { id: 'D',  label: 'D',  color: '#5cc4ff' },
    { id: 'E',  label: 'E',  color: '#2aa0f0' },
    { id: 'F',  label: 'F',  color: '#1b8fd6' },
    { id: 'G',  label: 'G',  color: '#37b4ff' },
    { id: 'A',  label: 'A',  color: '#1f7fc0' },
    { id: 'B',  label: 'B',  color: '#0e6aa8' },
    { id: 'C2', label: 'C²', color: '#004b70' },
  ];

  return (
    <div className="pad-grid pad-grid-8">
      {pads.map(p => (
        <button
          key={p.id}
          className={`key-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color, color: p.id === 'C2' ? '#fff' : '#001e30', ['--cs' as any]: '#004b70' }}
          aria-label={`音符 ${p.label}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── Bass (green) / Guitar (gold) — matching shadow ── */
function SimplePads({ kind, onPadPress, activePads }: PadProps & { kind: string }) {
  const palette =
    kind === 'guitar'
      ? {
          pads: [
            { id: '1', label: '低',  color: '#ebc300' },
            { id: '2', label: '中低', color: '#d9ae00' },
            { id: '3', label: '中高', color: '#a88500' },
            { id: '4', label: '高',  color: '#554500' },
          ],
          shadow: '#554500',
          dark: '#231b00',
        }
      : {
          pads: [
            { id: '1', label: '低',  color: '#16c265' },
            { id: '2', label: '中低', color: '#0fae57' },
            { id: '3', label: '中高', color: '#0b8a3d' },
            { id: '4', label: '高',  color: '#0a5c2c' },
          ],
          shadow: '#0a5c2c',
          dark: '#002814',
        };

  return (
    <div className="pad-grid pad-grid-4">
      {palette.pads.map(p => (
        <button
          key={p.id}
          className={`simple-pad ${activePads.has(p.id) ? 'active' : ''}`}
          onClick={() => onPadPress(p.id)}
          style={{ backgroundColor: p.color, color: p.id === '4' ? '#fff' : palette.dark, ['--cs' as any]: palette.shadow }}
          aria-label={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
