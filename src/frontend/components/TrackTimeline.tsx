import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrangementProject, Track, Clip, TrackKind } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { midiOf, aliasPitch } from '../utils/note';
import { AddInstrumentModal } from './AddInstrumentModal';

interface TrackTimelineProps {
  project: ArrangementProject;
}

interface ClipMenu { x: number; y: number; trackId: string; clipId: string; }

/* ── Pad definitions for the right-click controller popup ── */
const PAD_DEFS: Record<TrackKind, { id: string; label: string; color: string }[]> = {
  drums: [
    { id: 'kick', label: 'Kick', color: '#e60012' },
    { id: 'snare', label: 'Snare', color: '#ff6a3d' },
    { id: 'hihat', label: 'HiHat', color: '#ff9f1c' },
    { id: 'clap', label: 'Clap', color: '#ff4d6d' },
  ],
  bass: [
    { id: '1', label: '低', color: '#16c265' },
    { id: '2', label: '中低', color: '#0fae57' },
    { id: '3', label: '中高', color: '#0b8a3d' },
    { id: '4', label: '高', color: '#0a5c2c' },
  ],
  guitar: [
    { id: '1', label: '低', color: '#ebc300' },
    { id: '2', label: '中低', color: '#d9ae00' },
    { id: '3', label: '中高', color: '#a88500' },
    { id: '4', label: '高', color: '#554500' },
  ],
  keys: [
    { id: 'C', label: 'C', color: '#37b4ff' },
    { id: 'D', label: 'D', color: '#5cc4ff' },
    { id: 'E', label: 'E', color: '#2aa0f0' },
    { id: 'F', label: 'F', color: '#1b8fd6' },
    { id: 'G', label: 'G', color: '#37b4ff' },
    { id: 'A', label: 'A', color: '#1f7fc0' },
    { id: 'B', label: 'B', color: '#0e6aa8' },
    { id: 'C2', label: 'C²', color: '#004b70' },
  ],
};
const PAD_SHADOW: Record<TrackKind, string> = {
  drums: '#930007', bass: '#0a5c2c', guitar: '#554500', keys: '#004b70',
};

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, setPlayback, ui, setUi, setProject, captureSeed } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;
  const rulerRef = useRef<HTMLDivElement>(null);
  const clipClipboard = useRef<Clip | null>(null);
  const [menu, setMenu] = useState<ClipMenu | null>(null);

  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const loopDrag = useRef<{ startStep: number; moved: boolean } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [padTrackId, setPadTrackId] = useState<string | null>(null);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  const handleTrackSelect = (trackId: string) => setUi({ ...ui, selectedTrackId: trackId });

  const toggleMute = (trackId: string) => {
    setProject({
      ...project,
      tracks: project.tracks.map((t) => (t.id !== trackId ? t : { ...t, muted: !t.muted })),
    });
  };

  const deleteTrack = (trackId: string) => {
    const remaining = project.tracks.filter((t) => t.id !== trackId);
    setProject({ ...project, tracks: remaining });
    if (ui.selectedTrackId === trackId) {
      setUi({ ...ui, selectedTrackId: remaining[0]?.id ?? null });
    }
  };

  const playheadPct = (playback.currentStep / (totalSteps - 1)) * 100;

  const stepFromRulerX = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (totalSteps - 1));
  };
  const scrubFromX = (clientX: number) => setPlayback({ ...playback, currentStep: stepFromRulerX(clientX) });

  const onRulerPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const step = stepFromRulerX(e.clientX);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    loopDrag.current = { startStep: step, moved: false };
    setDraft({ start: step, end: step });
  };
  const onRulerPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 || !loopDrag.current) return;
    const step = stepFromRulerX(e.clientX);
    const s = loopDrag.current.startStep;
    loopDrag.current.moved = true;
    setDraft({ start: Math.min(s, step), end: Math.max(s, step) });
  };
  const onRulerPointerUp = (e: React.PointerEvent) => {
    const d = loopDrag.current;
    loopDrag.current = null;
    if (!d) { setDraft(null); return; }
    if (!d.moved) { setDraft(null); setPlayback({ ...playback, currentStep: d.startStep }); return; }
    const end = stepFromRulerX(e.clientX);
    setDraft(null);
    setPlayback({ ...playback, loop: true, loopStart: Math.min(d.startStep, end), loopEnd: Math.max(d.startStep, end) });
  };

  const openClipMenu = (trackId: string, clip: Clip, x: number, y: number) => {
    handleTrackSelect(trackId);
    setMenu({ x, y, trackId, clipId: clip.id });
  };
  const findClip = () => {
    const t = project.tracks.find((tr) => tr.id === menu?.trackId);
    return t?.clips.find((c) => c.id === menu?.clipId) ?? null;
  };
  const copyClip = () => { const c = findClip(); if (c) clipClipboard.current = c; setMenu(null); };
  const pasteIntoClip = () => {
    if (!menu) return;
    const src = clipClipboard.current;
    if (!src) { setMenu(null); return; }
    const stamp = Date.now();
    setProject({
      ...project,
      tracks: project.tracks.map((t) => (t.id !== menu.trackId ? t : {
        ...t, clips: t.clips.map((c) => (c.id !== menu.clipId ? c : {
          ...c,
          notes: src.notes.map((n, i) => ({ ...n, id: `note-${stamp}-${i}` })),
          drumHits: src.drumHits.map((h, i) => ({ ...h, id: `hit-${stamp}-${i}` })),
        })),
      })),
    });
    setMenu(null);
  };
  const deleteClip = () => {
    if (!menu) return;
    setProject({
      ...project,
      tracks: project.tracks.map((t) => (t.id !== menu.trackId ? t : { ...t, clips: t.clips.filter((c) => c.id !== menu.clipId) })),
    });
    setMenu(null);
  };

  /* ── Pad controller popup ── */
  const openPadPopup = (track: Track) => {
    handleTrackSelect(track.id);
    setPadTrackId(track.id);
    setActivePads(new Set());
  };
  const togglePad = (id: string) =>
    setActivePads((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleCapture = () => {
    const track = project.tracks.find((t) => t.id === padTrackId);
    if (!track || activePads.size === 0) return;
    const data = Array.from(activePads);
    if (track.kind === 'drums') {
      captureSeed(track.kind, [], data.map((id, i) => ({ id, drum: id as any, step: i * 4, velocity: 0.7 })));
    } else {
      captureSeed(track.kind, data.map((id, i) => ({ id, pitch: 'C4', step: i * 4, durationSteps: 2, velocity: 0.7 })), []);
    }
    setActivePads(new Set());
    setPadTrackId(null);
  };

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const loopRegion = draft ?? (playback.loop ? { start: playback.loopStart, end: playback.loopEnd } : null);
  const GUTTER = 200;
  const laneLeft = (step: number) => `calc(${GUTTER}px + ${step}/${totalSteps} * (100% - ${GUTTER}px))`;
  const laneWidth = (start: number, end: number) => `calc(${end - start + 1}/${totalSteps} * (100% - ${GUTTER}px))`;

  const padTrack = project.tracks.find((t) => t.id === padTrackId);

  return (
    <>
      <div className="timeline-container" role="region" aria-label="编曲时间线">
        {loopRegion && (
          <div className="loop-band" style={{ left: laneLeft(loopRegion.start), width: laneWidth(loopRegion.start, loopRegion.end) }} />
        )}

        {/* Ruler — left gutter holds the "乐器" header + add button */}
        <div className="bar-ruler">
          <div className="track-card-head">
            <span className="track-card-title">乐器</span>
            <button className="add-instrument-btn" onClick={() => setShowAdd(true)} aria-label="添加乐器" title="添加乐器">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div
            className="bar-ruler-track scrub-surface"
            ref={rulerRef}
            onPointerDown={onRulerPointerDown}
            onPointerMove={onRulerPointerMove}
            onPointerUp={onRulerPointerUp}
          >
            {Array.from({ length: project.bars }, (_, i) => (
              <div key={i} className="bar-ruler-cell"><span className="bar-ruler-label">{i + 1}</span></div>
            ))}
          </div>
        </div>

        <div className="tracks-container">
          {project.tracks.map((track) => {
            const theme = INSTRUMENT_THEME[track.kind];
            return (
              <div
                key={track.id}
                className={`track-row ${ui.selectedTrackId === track.id ? 'selected' : ''}`}
                style={instrumentVars(theme)}
              >
                {/* Instrument card = left header (aligned 1:1 with its lane) */}
                <div
                  className={`track-card ${track.muted ? 'muted' : ''}`}
                  onClick={() => handleTrackSelect(track.id)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openPadPopup(track); }}
                  title="左键选中 · 右键打开控制器"
                >
                  <div className="track-card-icon"><img src={theme.icon} alt="" draggable={false} /></div>
                  <div className="track-card-meta">
                    <span className="track-card-name">{track.name}</span>
                    <span className="track-card-en">{theme.en}</span>
                  </div>
                  <button
                    type="button"
                    className={`clip-toggle ${track.muted ? 'off' : 'on'}`}
                    title={track.muted ? '已静音 · 点击启用' : '播放中 · 点击静音'}
                    aria-pressed={!track.muted}
                    onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <span className="clip-toggle-knob" />
                  </button>
                  <button
                    type="button"
                    className="track-card-delete"
                    title="删除该乐器及其片段"
                    aria-label="删除该乐器"
                    onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                {/* Lane = the MIDI region */}
                <div className="track-lane">
                  {Array.from({ length: project.bars - 1 }, (_, i) => (
                    <div key={i} className="bar-gridline" style={{ left: `${((i + 1) / project.bars) * 100}%` }} />
                  ))}
                  {track.clips.map((clip) => (
                    <MIDIClip key={clip.id} clip={clip} totalSteps={totalSteps} trackKind={track.kind} muted={track.muted} onClipContext={(c, x, y) => openClipMenu(track.id, c, x, y)} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="playhead-line" style={{ left: `calc(${GUTTER}px + ${playheadPct}% * ((100% - ${GUTTER}px) / 100%))` }}>
            <div
              className="playhead-grip"
              title="拖动定位播放指针"
              onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); scrubFromX(e.clientX); }}
              onPointerMove={(e) => { if (e.buttons === 1) scrubFromX(e.clientX); }}
            />
          </div>
        </div>
      </div>

      {/* Clip context menu */}
      {menu && (
        <>
          <div className="ctx-backdrop" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
          <div className="ctx-menu" role="menu" style={{ left: Math.min(menu.x, window.innerWidth - 200), top: Math.min(menu.y, window.innerHeight - 200) }}>
            <button className="ctx-item" role="menuitem" onClick={copyClip}><span className="material-symbols-outlined">content_copy</span>复制片段</button>
            {clipClipboard.current && (
              <button className="ctx-item" role="menuitem" onClick={pasteIntoClip}><span className="material-symbols-outlined">content_paste</span>粘贴到该轨</button>
            )}
            <button className="ctx-item danger" role="menuitem" onClick={deleteClip}><span className="material-symbols-outlined">delete</span>删除片段</button>
          </div>
        </>
      )}

      {/* Pad controller popup (right-click a card) */}
      {padTrack && (
        <div className="pad-popup-overlay" onClick={() => setPadTrackId(null)} onContextMenu={(e) => { e.preventDefault(); setPadTrackId(null); }}>
          <div className="pad-popup" style={instrumentVars(INSTRUMENT_THEME[padTrack.kind])} onClick={(e) => e.stopPropagation()}>
            <div className="pad-popup-head">
              <span className="material-symbols-outlined" aria-hidden>music_note</span>
              <strong>{padTrack.name} 控制器</strong>
              <button className="pad-popup-close" onClick={() => setPadTrackId(null)} aria-label="关闭"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className={`pad-grid ${padTrack.kind === 'keys' ? 'pad-grid-8' : 'pad-grid-4'}`}>
              {PAD_DEFS[padTrack.kind].map((p) => (
                <button
                  key={p.id}
                  className={`drum-pad ${activePads.has(p.id) ? 'active' : ''}`}
                  style={{ backgroundColor: p.color, ['--cs' as any]: PAD_SHADOW[padTrack.kind] }}
                  onClick={() => togglePad(p.id)}
                  aria-pressed={activePads.has(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button className="capture-seed-btn" onClick={handleCapture} disabled={activePads.size === 0}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
              捕获律动
            </button>
            <p className="pad-popup-hint">点亮 pad，再「捕获律动」作为 AI 补全的种子。</p>
          </div>
        </div>
      )}

      <AddInstrumentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}

/* ═══════════════════════════════════════
   MIDI Clip – note blocks & drum hits (no toggle now; controls live on the card)
   ═══════════════════════════════════════ */
function MIDIClip({ clip, totalSteps, trackKind, muted, onClipContext }: {
  clip: Clip; totalSteps: number; trackKind: string; muted: boolean;
  onClipContext: (clip: Clip, x: number, y: number) => void;
}) {
  const leftPct = (clip.barStart / 8) * 100;
  const widthPct = (clip.barLength / 8) * 100;

  const { noteBlocks, drumMarks } = useMemo(() => {
    const notes = clip.notes.map((n) => ({
      x: (n.step / totalSteps) * 100,
      w: Math.max((n.durationSteps / totalSteps) * 100, 0.8),
      y: pitchToY(n.pitch),
      key: n.id,
    }));
    const drums = clip.drumHits.map((h) => ({
      x: (h.step / totalSteps) * 100,
      y: drumToY(h.drum),
      size: Math.max(4, h.velocity * 7),
      key: h.id,
    }));
    return { noteBlocks: notes, drumMarks: drums };
  }, [clip.notes, clip.drumHits, totalSteps]);

  return (
    <div
      className={`midi-clip ${muted ? 'muted' : ''}`}
      title="右键：复制 / 粘贴 / 删除"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClipContext(clip, e.clientX, e.clientY); }}
      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
    >
      {trackKind !== 'drums' && noteBlocks.map((n) => (
        <div key={n.key} className="note-block" style={{ left: `${n.x}%`, width: `${n.w}%`, bottom: `${n.y}%` }} />
      ))}
      {trackKind === 'drums' && drumMarks.map((d) => (
        <div key={d.key} className="drum-mark" style={{ left: `calc(${d.x}% - ${d.size / 2}px)`, bottom: `${d.y}%`, width: `${d.size}px`, height: `${d.size}px`, borderRadius: '3px' }} />
      ))}
    </div>
  );
}

const TL_MIN_MIDI = midiOf('C2') ?? 36;
const TL_MAX_MIDI = midiOf('C5') ?? 72;
function pitchToY(pitch: string): number {
  const m = midiOf(aliasPitch(pitch));
  if (m == null) return 40;
  const ratio = (m - TL_MIN_MIDI) / (TL_MAX_MIDI - TL_MIN_MIDI);
  return Math.max(4, Math.min(88, 8 + ratio * 78));
}
function drumToY(drum: string): number {
  switch (drum) {
    case 'kick': return 15;
    case 'snare': return 35;
    case 'hihat': return 60;
    case 'clap': return 80;
    default: return 50;
  }
}
