import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { createClip } from '../../contracts/clip';
import { INSTRUMENT_ORDER, INSTRUMENT_THEME, instrumentVars } from '../theme';
import type { TrackKind } from '../../contracts';

const INPUT_SOURCES = ['默认 MIDI 输入', '外部控制器 (USB)', '虚拟键盘'];

export function AddInstrumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project, setProject, ui, setUi } = useEditor();
  const [selected, setSelected] = useState<TrackKind>('keys');
  const [name, setName] = useState('');
  const [source, setSource] = useState(INPUT_SOURCES[0]);

  if (!open || !project) return null;

  const handleCreate = () => {
    const theme = INSTRUMENT_THEME[selected];
    const id = `track-${selected}-${Date.now()}`;
    const finalName = name.trim() || theme.label;
    const newTrack = {
      id,
      kind: selected,
      name: finalName,
      color: theme.color,
      muted: false,
      clips: [
        createClip({
          id: `clip-${id}`,
          kind: selected === 'drums' ? 'drum' : 'midi',
          name: `${finalName} Clip`,
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: [],
        }),
      ],
    };
    setProject({ ...project, tracks: [...project.tracks, newTrack] });
    setUi({ ...ui, selectedTrackId: id });
    setName('');
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="添加乐器">
      <div className="modal">
        <div className="modal-header">
          <h2>
            <span className="material-symbols-outlined" aria-hidden>add_circle</span>
            添加新乐器
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">选一个类别，开始你的下一段创作。</p>

          <div className="cat-grid">
            {INSTRUMENT_ORDER.map((kind) => {
              const theme = INSTRUMENT_THEME[kind];
              const active = selected === kind;
              return (
                <button
                  key={kind}
                  className={`cat-card ${active ? 'selected' : ''}`}
                  onClick={() => setSelected(kind)}
                  style={active ? instrumentVars(theme) : undefined}
                  aria-pressed={active}
                >
                  <div className="cat-card-icon">
                    <img src={theme.icon} alt="" draggable={false} />
                  </div>
                  <span className="cat-card-label">{theme.label}</span>
                  <span className="cat-card-en">{theme.en}</span>
                </button>
              );
            })}
          </div>

          <div className="modal-fields">
            <label className="modal-field">
              <span className="label-cap">音轨名称</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="新乐器音轨"
              />
            </label>
            <label className="modal-field">
              <span className="label-cap">输入源</span>
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                {INPUT_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button className="modal-btn primary" onClick={handleCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>add</span>
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
