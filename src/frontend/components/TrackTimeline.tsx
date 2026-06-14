import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrangementProject, Clip } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { midiOf, aliasPitch } from '../utils/note';
import { AddInstrumentModal } from './AddInstrumentModal';
import { audioEngine } from '../audio/AudioEngine';

interface TrackTimelineProps {
  project: ArrangementProject;
}

interface ClipMenu { x: number; y: number; trackId: string; clipId: string; }

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, setPlayback, ui, setUi, setProject } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;
  const rulerRef = useRef<HTMLDivElement>(null);
  const clipClipboard = useRef<Clip | null>(null);
  const [menu, setMenu] = useState<ClipMenu | null>(null);

  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const loopDrag = useRef<{ startStep: number; moved: boolean } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [pressingTrackId, setPressingTrackId] = useState<string | null>(null);

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

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

  const stepFromRulerX = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.min(totalSteps - 1, Math.max(0, Math.floor(ratio * totalSteps)));
  };
  const scrubToStep = (step: number) => {
    const nextPlayback = { ...playback, currentStep: step };
    setPlayback(nextPlayback);
    if (playback.isPlaying) {
      audioEngine.playProject(
        project,
        step,
        playback.loop ? { start: playback.loopStart, end: playback.loopEnd } : null
      );
    }
  };
  const scrubFromX = (clientX: number) => scrubToStep(stepFromRulerX(clientX));

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
    if (!d.moved) { setDraft(null); scrubToStep(d.startStep); return; }
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

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const loopRegion = draft ?? (playback.loop ? { start: playback.loopStart, end: playback.loopEnd } : null);
  const GUTTER = 260;
  const laneLeft = (step: number) => `calc(${GUTTER}px + ${step}/${totalSteps} * (100% - ${GUTTER}px))`;
  const laneWidth = (start: number, end: number) => `calc(${end - start + 1}/${totalSteps} * (100% - ${GUTTER}px))`;

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
            const isSelected = ui.selectedTrackId === track.id;
            const isPressing = pressingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={`track-row ${isSelected ? 'selected' : ''}`}
                style={instrumentVars(theme)}
              >
                {/* Instrument card = left header (aligned 1:1 with its lane) */}
                <div
                  className={`track-card ${track.muted ? 'muted' : ''} ${isSelected ? 'is-selected' : ''} ${isPressing ? 'is-pressing' : ''}`}
                  onPointerDown={() => setPressingTrackId(track.id)}
                  onPointerUp={() => { setPressingTrackId(null); handleTrackSelect(track.id); }}
                  onPointerLeave={() => setPressingTrackId(null)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  title="点击选择并打开下方控制器"
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
                    onPointerUp={(e) => e.stopPropagation()}
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
                    onPointerUp={(e) => e.stopPropagation()}
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

          <div className="playhead-line" style={{ left: laneLeft(playback.currentStep) }}>
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

const TL_MIN_MIDI = midiOf('C0') ?? 12;
const TL_MAX_MIDI = midiOf('B8') ?? 119;
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
