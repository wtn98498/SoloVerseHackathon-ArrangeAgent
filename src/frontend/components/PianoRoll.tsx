import { useRef, useMemo, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { aliasPitch, midiOf, scaleSemitones } from '../utils/note';
import { audioEngine } from '../audio/AudioEngine';
import type { ArrangementProject, Track, TrackKind, NoteEvent, DrumHit } from '../../contracts';
import { buildPadCaptureEvents, mergePadCaptureIntoProject } from './padCapture';

/* ── Chromatic pitch range shown in the roll. Use a broad piano-style range so
   the UI does not imply a three-octave product limit. ── */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_OCT = 0;

/* Drum lanes for drum tracks (bottom → top). */
const DRUM_ROWS: { id: DrumHit['drum']; label: string }[] = [
  { id: 'kick', label: 'Kick' },
  { id: 'snare', label: 'Snare' },
  { id: 'hihat', label: 'HiHat' },
  { id: 'clap', label: 'Clap' },
];
const DRUM_ROW_H = 34;

interface PitchRow { label: string; isBlack: boolean; row: number; }

const ROW_H = 18;
const TOTAL_STEPS = 128;
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

interface CtxMenu {
  x: number;
  y: number;
  noteId: string | null; // null → opened on empty grid (paste only)
  step: number;
}

export function PianoRoll({ project }: { project: ArrangementProject }) {
  const { playback, ui, setProject, captureSeed } = useEditor();
  const gridRef = useRef<HTMLDivElement>(null);
  const clipboard = useRef<NoteEvent[]>([]);
  const [menu, setMenu] = useState<CtxMenu | null>(null);
  const [drawing, setDrawing] = useState<{ pitch: string; startStep: number; endStep: number } | null>(null);
  const drawingRef = useRef<{ pitch: string; startStep: number; endStep: number } | null>(null);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  const track: Track | undefined =
    project.tracks.find((t) => t.id === ui.selectedTrackId) ?? project.tracks[0];

  const theme = track ? INSTRUMENT_THEME[track.kind] : INSTRUMENT_THEME.keys;
  const clip = track?.clips[0];
  const isDrum = track?.kind === 'drums';

  // In-scale row highlighting (defaults to C major when the project has none).
  const scale = project.scale ?? { root: 'C', type: 'major' as const };
  const scaleSemis = scaleSemitones(scale.root, scale.type);

  // Broad piano-style staff shown up front; the body scrolls vertically.
  const maxOct = 8;

  // Built bottom→top so row 0 = lowest pitch.
  const pitchRows = useMemo<PitchRow[]>(() => {
    const rows: PitchRow[] = [];
    for (let oct = MIN_OCT; oct <= maxOct; oct++) {
      NOTE_NAMES.forEach((n) => {
        rows.push({ label: `${n}${oct}`, isBlack: n.includes('#'), row: rows.length });
      });
    }
    return rows;
  }, [maxOct]);

  const pitchToRow = (pitch: string) =>
    pitchRows.findIndex((p) => p.label === aliasPitch(pitch));

  // top→bottom render order (highest pitch first)
  const rowsTopDown = [...pitchRows].reverse();
  const gridHeight = pitchRows.length * ROW_H;

  const stepFromX = (clientX: number) => {
    const el = gridRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.min(TOTAL_STEPS - 1, Math.max(0, Math.floor(ratio * TOTAL_STEPS)));
  };

  const playheadPct = (playback.currentStep / TOTAL_STEPS) * 100;

  /* ── Click a beat segment to audition its notes + drums ── */
  const STEPS_PER_AUDIT = TOTAL_STEPS / 16; // 8 steps per segment
  const auditionBeat = (i: number) => {
    const from = i * STEPS_PER_AUDIT;
    const to = from + STEPS_PER_AUDIT;
    const pitches = (clip?.notes ?? [])
      .filter((n) => n.step >= from && n.step < to)
      .map((n) => n.pitch);
    const drums = (clip?.drumHits ?? [])
      .filter((h) => h.step >= from && h.step < to)
      .map((h) => h.drum);
    audioEngine.auditionStep(pitches, drums);
  };

  // Land exactly where clicked (1-step resolution, no quantize snap) so the
  // hit/note lines up with the cell under the cursor.
  const snap = (step: number) => Math.min(TOTAL_STEPS - 1, Math.max(0, step));

  /* ── Click-drag to draw a note: press sets pitch + start step, drag sets the
     length, release commits. A click with no drag = a single 1/16 note. Drum
     tracks use the drum grid (toggleDrumAt), not this. ── */
  const beginDraw = (e: ReactPointerEvent) => {
    if (isDrum || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < 14) return; // ignore the top audition rail
    const rowIdx = pitchRows.length - 1 - Math.floor(y / ROW_H);
    if (rowIdx < 0 || rowIdx >= pitchRows.length) return;
    const step = snap(stepFromX(e.clientX));
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = { pitch: pitchRows[rowIdx].label, startStep: step, endStep: step };
    setDrawing({ ...drawingRef.current });
    audioEngine.auditionNote(pitchRows[rowIdx].label);
  };

  const extendDraw = (e: ReactPointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current.endStep = snap(stepFromX(e.clientX));
    setDrawing({ ...drawingRef.current });
  };

  const commitDraw = () => {
    const d = drawingRef.current;
    drawingRef.current = null;
    setDrawing(null);
    if (!d) return;
    const start = Math.min(d.startStep, d.endStep);
    const duration = Math.abs(d.endStep - d.startStep) + 1;
    updateClipNotes((notes) => [
      ...notes,
      { id: `note-${Date.now()}`, pitch: d.pitch, step: start, durationSteps: duration, velocity: 0.7 },
    ]);
  };

  const drumGridHeight = DRUM_ROWS.length * DRUM_ROW_H;
  const togglePad = (id: string) =>
    setActivePads((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleCapture = () => {
    if (!track || activePads.size === 0) return;
    const events = buildPadCaptureEvents(
      track.kind,
      Array.from(activePads),
      playback.currentStep,
      `pad-${track.kind}-${Date.now()}`
    );
    if (events.notes.length === 0 && events.drumHits.length === 0) return;

    setProject(mergePadCaptureIntoProject(project, track.id, events));
    captureSeed(track.kind, events.notes, events.drumHits);
    audioEngine.auditionStep(events.notes.map((note) => note.pitch), events.drumHits.map((hit) => hit.drum));
    setActivePads(new Set());
  };

  useEffect(() => {
    setActivePads(new Set());
  }, [track?.id]);

  /* ── Drum grid: click a cell to toggle a hit (drum tracks only) ── */
  const toggleDrumAt = (e: ReactPointerEvent) => {
    if (!track || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const step = snap(stepFromX(e.clientX));
    const rowFromTop = Math.floor((e.clientY - rect.top) / DRUM_ROW_H);
    const drum = DRUM_ROWS[rowFromTop]?.id;
    if (!drum) return;
    const existing = clip?.drumHits.find((h) => h.drum === drum && h.step === step);
    if (existing) {
      updateDrumHits((hits) => hits.filter((h) => h.id !== existing.id));
    } else {
      updateDrumHits((hits) => [...hits, { id: `hit-${Date.now()}`, drum, step, velocity: 0.8 }]);
      audioEngine.auditionStep([], [drum]);
    }
  };

  const updateDrumHits = (fn: (hits: DrumHit[]) => DrumHit[]) => {
    if (!track) return;
    setProject({
      ...project,
      tracks: project.tracks.map((t) =>
        t.id === track.id
          ? { ...t, clips: t.clips.map((c, i) => (i === 0 ? { ...c, drumHits: fn(c.drumHits) } : c)) }
          : t
      ),
    });
  };

  /* ── Note editing (copy / paste / delete) — mutates the selected clip ── */
  const updateClipNotes = (fn: (notes: NoteEvent[]) => NoteEvent[]) => {
    if (!track) return;
    setProject({
      ...project,
      tracks: project.tracks.map((t) =>
        t.id === track.id
          ? { ...t, clips: t.clips.map((c, i) => (i === 0 ? { ...c, notes: fn(c.notes) } : c)) }
          : t
      ),
    });
  };

  const copyNote = (noteId: string) => {
    const n = clip?.notes.find((x) => x.id === noteId);
    if (n) clipboard.current = [n];
    setMenu(null);
  };

  const deleteNote = (noteId: string) => {
    updateClipNotes((notes) => notes.filter((n) => n.id !== noteId));
    setMenu(null);
  };

  const pasteAt = (step: number) => {
    const src = clipboard.current;
    if (src.length === 0) { setMenu(null); return; }
    const baseStep = Math.min(...src.map((n) => n.step));
    updateClipNotes((notes) => [
      ...notes,
      ...src.map((n, i) => ({
        ...n,
        id: `note-${Date.now()}-${i}`,
        step: Math.min(TOTAL_STEPS - 1, Math.max(0, step + (n.step - baseStep))),
      })),
    ]);
    setMenu(null);
  };

  // Close the context menu on Escape.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <section className="piano-roll" aria-label="钢琴卷帘" style={instrumentVars(theme)}>
      {/* Toolbar */}
      <div className="piano-roll-toolbar">
        <div className="piano-roll-tabs">
          <span className="piano-roll-tab active">Piano Roll</span>
        </div>
        <div className="piano-roll-meta">
          <span className="label-cap">轨道</span>
          <strong style={{ color: 'var(--c)' }}>{track?.name ?? '—'}</strong>
        </div>
        <div className="piano-roll-snap">
          <span className="label-cap">Snap</span>
          <select defaultValue="1/8" aria-label="网格吸附">
            <option>1/4</option>
            <option>1/8</option>
            <option>1/16</option>
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="piano-roll-body">
        {isDrum ? (
          <>
            <div className="piano-left-rail" style={{ minHeight: drumGridHeight }}>
              <RollInspector track={track} activePads={activePads} togglePad={togglePad} handleCapture={handleCapture} />
              <div className="drum-labels" style={{ height: drumGridHeight }}>
                {DRUM_ROWS.map((d) => (
                  <div
                    key={d.id}
                    className="drum-label"
                    onClick={() => audioEngine.auditionStep([], [d.id])}
                    title={`试听 ${d.label}`}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Drum grid — click a cell to toggle a hit */}
            <div
              className="piano-grid drum-grid"
              ref={gridRef}
              style={{ height: drumGridHeight }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                toggleDrumAt(e);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, noteId: null, step: stepFromX(e.clientX) });
              }}
            >
              {/* Bar dividers */}
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="pr-barline" style={{ left: `${((i + 1) / 8) * 100}%` }} />
              ))}
              {/* Row separators */}
              {DRUM_ROWS.slice(1).map((_, i) => (
                <div key={i} className="drum-row-sep" style={{ bottom: (i + 1) * DRUM_ROW_H }} />
              ))}
              {/* Drum hits */}
              {clip?.drumHits.map((h) => {
                const ri = DRUM_ROWS.findIndex((d) => d.id === h.drum);
                if (ri < 0) return null;
                return (
                  <div
                    key={h.id}
                    className="pr-drum"
                    title={`${h.drum} · step ${h.step}`}
                    style={{
                      left: `${(h.step / TOTAL_STEPS) * 100}%`,
                      bottom: (DRUM_ROWS.length - 1 - ri) * DRUM_ROW_H + (DRUM_ROW_H - 12) / 2,
                    }}
                  />
                );
              })}
              {/* Playhead */}
              <div className="pr-playhead" style={{ left: `${playheadPct}%` }}>
                <div className="pr-playhead-head" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="piano-left-rail" style={{ minHeight: gridHeight }}>
              <RollInspector track={track} activePads={activePads} togglePad={togglePad} handleCapture={handleCapture} />
              <div className="piano-keys" style={{ height: gridHeight }}>
                {rowsTopDown.map((p) => (
                  <div
                    key={p.label}
                    className={`piano-key ${p.isBlack ? 'black' : 'white'}`}
                    onPointerDown={() => audioEngine.auditionNote(p.label)}
                    title={`试听 ${p.label}`}
                  >
                    <span className="piano-key-label">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note grid — drag to draw notes */}
            <div
              className="piano-grid"
              ref={gridRef}
              style={{ height: gridHeight }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                beginDraw(e);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) extendDraw(e);
              }}
              onPointerUp={commitDraw}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, noteId: null, step: stepFromX(e.clientX) });
              }}
            >
              {/* Beat-audition rail */}
              <div className="pr-audit-rail" aria-label="逐段试听">
                {Array.from({ length: 16 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className="pr-audit-cell"
                    title={`试听第 ${i + 1} 段`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => auditionBeat(i)}
                  />
                ))}
              </div>

              {/* Bar dividers */}
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="pr-barline" style={{ left: `${((i + 1) / 8) * 100}%` }} />
              ))}
              {/* In-scale row shading */}
              {rowsTopDown.map((p) => {
                const m = midiOf(p.label);
                if (m == null) return null;
                const pc = ((m % 12) + 12) % 12;
                const isRoot = pc === scaleSemis[0];
                if (!scaleSemis.includes(pc)) return null;
                return (
                  <div
                    key={`shade-${p.label}`}
                    className={`pr-row-shade ${isRoot ? 'pr-row-shade--root' : ''}`}
                    style={{ bottom: p.row * ROW_H, height: ROW_H }}
                  />
                );
              })}

              {/* Notes */}
              {clip?.notes.map((n) => {
                const row = pitchToRow(n.pitch);
                if (row < 0) return null;
                const left = (n.step / TOTAL_STEPS) * 100;
                const width = Math.max((n.durationSteps / TOTAL_STEPS) * 100, 1.2);
                return (
                  <div
                    key={n.id}
                    className="pr-note"
                    title={`${n.pitch} · step ${n.step}（左键试听 / 右键菜单）`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => audioEngine.auditionNote(n.pitch)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenu({ x: e.clientX, y: e.clientY, noteId: n.id, step: n.step });
                    }}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      bottom: row * ROW_H + 2,
                      height: ROW_H - 4,
                    }}
                  />
                );
              })}

              {/* Note being drawn (drag preview) */}
              {drawing && (() => {
                const r = pitchToRow(drawing.pitch);
                if (r < 0) return null;
                const start = Math.min(drawing.startStep, drawing.endStep);
                const dur = Math.abs(drawing.endStep - drawing.startStep) + 1;
                return (
                  <div
                    className="pr-note pr-note--drawing"
                    style={{
                      left: `${(start / TOTAL_STEPS) * 100}%`,
                      width: `${Math.max((dur / TOTAL_STEPS) * 100, 1.2)}%`,
                      bottom: r * ROW_H + 2,
                      height: ROW_H - 4,
                    }}
                  />
                );
              })()}

              {/* Playhead */}
              <div className="pr-playhead" style={{ left: `${playheadPct}%` }}>
                <div className="pr-playhead-head" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right-click context menu */}
      {menu && (
        <>
          <div
            className="ctx-backdrop"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setMenu(null); }}
          />
          <div
            className="ctx-menu"
            role="menu"
            style={{
              left: Math.min(menu.x, window.innerWidth - 184),
              top: Math.min(menu.y, window.innerHeight - 200),
            }}
          >
            {menu.noteId && (
              <button className="ctx-item" role="menuitem" onClick={() => copyNote(menu.noteId!)}>
                <span className="material-symbols-outlined">content_copy</span>
                复制
              </button>
            )}
            {clipboard.current.length > 0 && (
              <button className="ctx-item" role="menuitem" onClick={() => pasteAt(menu.step)}>
                <span className="material-symbols-outlined">content_paste</span>
                粘贴
              </button>
            )}
            {menu.noteId && (
              <button
                className="ctx-item danger"
                role="menuitem"
                onClick={() => deleteNote(menu.noteId!)}
              >
                <span className="material-symbols-outlined">delete</span>
                删除
              </button>
            )}
            {!menu.noteId && clipboard.current.length === 0 && (
              <span className="ctx-hint">先复制一个音符再粘贴</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RollInspector({ track, activePads, togglePad, handleCapture }: {
  track: Track | undefined;
  activePads: Set<string>;
  togglePad: (id: string) => void;
  handleCapture: () => void;
}) {
  if (!track) return null;
  const theme = INSTRUMENT_THEME[track.kind];
  return (
    <div className="roll-inspector" style={instrumentVars(theme)}>
      <div className="roll-inspector-card">
        <div className="roll-inspector-icon"><img src={theme.icon} alt="" draggable={false} /></div>
        <div className="roll-inspector-meta">
          <strong>{track.name}</strong>
          <span>{theme.en}</span>
        </div>
      </div>
      <div className="roll-inspector-section">
        <span className="label-cap">编配</span>
        <div className={`pad-grid ${track.kind === 'keys' ? 'pad-grid-8' : 'pad-grid-4'}`}>
          {PAD_DEFS[track.kind].map((p) => (
            <button
              key={p.id}
              className={`drum-pad ${activePads.has(p.id) ? 'active' : ''}`}
              style={{ backgroundColor: p.color, ['--cs' as any]: PAD_SHADOW[track.kind] }}
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
      </div>
    </div>
  );
}
