import { useRef, useMemo, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { maxOctaveOf, aliasPitch, midiOf, scaleSemitones } from '../utils/note';
import { audioEngine } from '../audio/AudioEngine';
import type { ArrangementProject, Track, NoteEvent, DrumHit } from '../../contracts';

/* ── Chromatic pitch range shown in the roll. Lower bound is fixed at C2 so the
   fixed-pixel drum lanes never overflow; the upper octave expands dynamically
   when a clip contains notes above B4, so agent-generated high notes are never
   clipped. ── */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_OCT = 2;

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

interface CtxMenu {
  x: number;
  y: number;
  noteId: string | null; // null → opened on empty grid (paste only)
  step: number;
}

export function PianoRoll({ project }: { project: ArrangementProject }) {
  const { playback, ui, setProject } = useEditor();
  const gridRef = useRef<HTMLDivElement>(null);
  const clipboard = useRef<NoteEvent[]>([]);
  const [menu, setMenu] = useState<CtxMenu | null>(null);
  const [drawing, setDrawing] = useState<{ pitch: string; startStep: number; endStep: number } | null>(null);
  const drawingRef = useRef<{ pitch: string; startStep: number; endStep: number } | null>(null);

  const track: Track | undefined =
    project.tracks.find((t) => t.id === ui.selectedTrackId) ?? project.tracks[0];

  const theme = track ? INSTRUMENT_THEME[track.kind] : INSTRUMENT_THEME.keys;
  const clip = track?.clips[0];
  const isDrum = track?.kind === 'drums';

  // In-scale row highlighting (defaults to C major when the project has none).
  const scale = project.scale ?? { root: 'C', type: 'major' as const };
  const scaleSemis = scaleSemitones(scale.root, scale.type);

  // Dynamic upper octave: at least B4 (matches the old fixed range → zero
  // regression for the C2–G4 fixture); expand by one octave above any higher
  // note so nothing gets clipped.
  const maxOct = Math.max(
    4,
    maxOctaveOf((clip?.notes ?? []).map((n) => aliasPitch(n.pitch))) + 1
  );

  // Built bottom→top so row 0 = lowest pitch (C2).
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
    return Math.round(ratio * (TOTAL_STEPS - 1));
  };

  const playheadPct = (playback.currentStep / (TOTAL_STEPS - 1)) * 100;

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

  const snap = (step: number) => Math.min(TOTAL_STEPS - 1, Math.max(0, Math.round(step / 2) * 2));

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
            {/* Drum lane labels (kick / snare / hihat / clap) */}
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
            {/* Vertical keyboard */}
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
