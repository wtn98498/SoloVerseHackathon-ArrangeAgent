import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrangementProject, Track, Clip } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { midiOf, aliasPitch } from '../utils/note';

interface TrackTimelineProps {
  project: ArrangementProject;
}

interface ClipMenu {
  x: number;
  y: number;
  trackId: string;
  clipId: string;
}

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, setPlayback, ui, setUi, setProject } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;
  const rulerRef = useRef<HTMLDivElement>(null);
  const clipClipboard = useRef<Clip | null>(null);
  const [menu, setMenu] = useState<ClipMenu | null>(null);

  // Live loop-region drag (local only → no engine restart storm while dragging).
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const loopDrag = useRef<{ startStep: number; moved: boolean } | null>(null);

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

  // Toggle whether a region plays (mutes the track → audio engine skips it).
  const toggleMute = (trackId: string) => {
    setProject({
      ...project,
      tracks: project.tracks.map((t) =>
        t.id !== trackId ? t : { ...t, muted: !t.muted }
      ),
    });
  };

  // Playhead is always present (常驻); currentStep persists when paused.
  const playheadPct = (playback.currentStep / (totalSteps - 1)) * 100;

  const stepFromRulerX = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (totalSteps - 1));
  };

  // Scrub the playhead (used by the draggable playhead grip).
  const scrubFromX = (clientX: number) => {
    setPlayback({ ...playback, currentStep: stepFromRulerX(clientX) });
  };

  /* ── Ruler drag = select loop region (yellow); plain click = scrub ── */
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
    if (!d.moved) {
      setDraft(null);
      setPlayback({ ...playback, currentStep: d.startStep });
      return;
    }
    const end = stepFromRulerX(e.clientX);
    setDraft(null);
    setPlayback({
      ...playback,
      loop: true,
      loopStart: Math.min(d.startStep, end),
      loopEnd: Math.max(d.startStep, end),
    });
  };

  /* ── Clip editing (copy / paste / delete) ── */
  const openClipMenu = (trackId: string, clip: Clip, x: number, y: number) => {
    handleTrackSelect(trackId);
    setMenu({ x, y, trackId, clipId: clip.id });
  };

  const findClip = () => {
    const t = project.tracks.find((tr) => tr.id === menu?.trackId);
    return t?.clips.find((c) => c.id === menu?.clipId) ?? null;
  };

  const copyClip = () => {
    const c = findClip();
    if (c) clipClipboard.current = c;
    setMenu(null);
  };

  const pasteIntoClip = () => {
    if (!menu) return;
    const src = clipClipboard.current;
    if (!src) { setMenu(null); return; }
    const stamp = Date.now();
    setProject({
      ...project,
      tracks: project.tracks.map((t) =>
        t.id !== menu.trackId ? t : {
          ...t,
          clips: t.clips.map((c) =>
            c.id !== menu.clipId ? c : {
              ...c,
              notes: src.notes.map((n, i) => ({ ...n, id: `note-${stamp}-${i}` })),
              drumHits: src.drumHits.map((h, i) => ({ ...h, id: `hit-${stamp}-${i}` })),
            }
          ),
        }
      ),
    });
    setMenu(null);
  };

  const deleteClip = () => {
    if (!menu) return;
    setProject({
      ...project,
      tracks: project.tracks.map((t) =>
        t.id !== menu.trackId ? t : { ...t, clips: t.clips.filter((c) => c.id !== menu.clipId) }
      ),
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
  const laneLeft = (step: number) => `calc(104px + ${step}/${totalSteps} * (100% - 104px))`;
  const laneWidth = (start: number, end: number) =>
    `calc(${end - start + 1}/${totalSteps} * (100% - 104px))`;

  return (
    <>
      <div className="timeline-container" role="region" aria-label="编曲时间线">
        {/* Loop region highlight — one continuous band spanning ruler + lanes */}
        {loopRegion && (
          <div
            className="loop-band"
            style={{ left: laneLeft(loopRegion.start), width: laneWidth(loopRegion.start, loopRegion.end) }}
          />
        )}

        {/* Bar ruler — drag to select the loop region; click to scrub */}
        <div className="bar-ruler">
          <div className="bar-ruler-gutter" />
          <div
            className="bar-ruler-track scrub-surface"
            ref={rulerRef}
            onPointerDown={onRulerPointerDown}
            onPointerMove={onRulerPointerMove}
            onPointerUp={onRulerPointerUp}
          >
            {Array.from({ length: project.bars }, (_, i) => (
              <div key={i} className="bar-ruler-cell">
                <span className="bar-ruler-label">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tracks-container">

          {project.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              bars={project.bars}
              totalSteps={totalSteps}
              isSelected={ui.selectedTrackId === track.id}
              muted={track.muted}
              onSelect={() => handleTrackSelect(track.id)}
              onToggleMute={() => toggleMute(track.id)}
              onClipContext={(clip, x, y) => openClipMenu(track.id, clip, x, y)}
            />
          ))}

          {/* Persistent playhead with a draggable red grip on top */}
          <div className="playhead-line" style={{ left: `calc(104px + ${playheadPct}% * ((100% - 104px) / 100%))` }}>
            <div
              className="playhead-grip"
              title="拖动定位播放指针"
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                scrubFromX(e.clientX);
              }}
              onPointerMove={(e) => { if (e.buttons === 1) scrubFromX(e.clientX); }}
            />
          </div>
        </div>
      </div>

      {/* Right-click context menu (timeline clips) */}
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
              left: Math.min(menu.x, window.innerWidth - 200),
              top: Math.min(menu.y, window.innerHeight - 200),
            }}
          >
            <button className="ctx-item" role="menuitem" onClick={copyClip}>
              <span className="material-symbols-outlined">content_copy</span>
              复制片段
            </button>
            {clipClipboard.current && (
              <button className="ctx-item" role="menuitem" onClick={pasteIntoClip}>
                <span className="material-symbols-outlined">content_paste</span>
                粘贴到该轨
              </button>
            )}
            <button className="ctx-item danger" role="menuitem" onClick={deleteClip}>
              <span className="material-symbols-outlined">delete</span>
              删除片段
            </button>
          </div>
        </>
      )}
    </>
  );
}

/* ── Track Row ── */
interface TrackRowProps {
  track: Track;
  bars: number;
  totalSteps: number;
  isSelected: boolean;
  muted: boolean;
  onSelect: () => void;
  onToggleMute: () => void;
  onClipContext: (clip: Clip, x: number, y: number) => void;
}

function TrackRow({ track, bars, totalSteps, isSelected, muted, onSelect, onToggleMute, onClipContext }: TrackRowProps) {
  const theme = INSTRUMENT_THEME[track.kind];

  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${track.name} 音轨`}
      style={instrumentVars(theme)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className="track-info">
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{theme.en}</div>
        {track.muted && <span className="muted-badge">MUTE</span>}
      </div>

      <div className="track-lane">
        {/* Bar grid lines */}
        {Array.from({ length: bars - 1 }, (_, i) => (
          <div
            key={i}
            className="bar-gridline"
            style={{ left: `${((i + 1) / bars) * 100}%` }}
          />
        ))}

        {track.clips.map(clip => (
          <MIDIClip
            key={clip.id}
            clip={clip}
            totalSteps={totalSteps}
            trackKind={track.kind}
            muted={muted}
            onToggleMute={onToggleMute}
            onClipContext={onClipContext}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MIDI Clip – renders note blocks & drum hits
   Kinetic Play piano-roll: colored blocks with
   chunky border + note rectangles by time (x) and pitch (y)
   ═══════════════════════════════════════ */
function MIDIClip({
  clip,
  totalSteps,
  trackKind,
  muted,
  onToggleMute,
  onClipContext,
}: {
  clip: Clip;
  totalSteps: number;
  trackKind: string;
  muted: boolean;
  onToggleMute: () => void;
  onClipContext: (clip: Clip, x: number, y: number) => void;
}) {
  const leftPct = (clip.barStart / 8) * 100;
  const widthPct = (clip.barLength / 8) * 100;

  const { noteBlocks, drumMarks } = useMemo(() => {
    const notes = clip.notes.map(n => {
      const xPct = (n.step / totalSteps) * 100;
      const wPct = Math.max((n.durationSteps / totalSteps) * 100, 0.8);
      const yPct = pitchToY(n.pitch);
      return { x: xPct, w: wPct, y: yPct, key: n.id };
    });

    const drums = clip.drumHits.map(h => {
      const xPct = (h.step / totalSteps) * 100;
      const yPct = drumToY(h.drum);
      const size = Math.max(4, h.velocity * 7);
      return { x: xPct, y: yPct, size, key: h.id };
    });

    return { noteBlocks: notes, drumMarks: drums };
  }, [clip.notes, clip.drumHits, totalSteps]);

  return (
    <div
      className={`midi-clip ${muted ? 'muted' : ''}`}
      title="右键：复制 / 粘贴 / 删除"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClipContext(clip, e.clientX, e.clientY);
      }}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
    >
      {/* Play / mute toggle for this region */}
      <button
        type="button"
        className={`clip-toggle ${muted ? 'off' : 'on'}`}
        title={muted ? '已静音 · 点击启用播放' : '播放中 · 点击静音'}
        aria-pressed={!muted}
        aria-label={muted ? '启用该片段' : '静音该片段'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
      >
        <span className="clip-toggle-knob" />
        <span className="clip-toggle-label">{muted ? 'OFF' : 'ON'}</span>
      </button>

      {/* Note blocks for melodic instruments */}
      {trackKind !== 'drums' && noteBlocks.map(n => (
        <div
          key={n.key}
          className="note-block"
          style={{
            left: `${n.x}%`,
            width: `${n.w}%`,
            bottom: `${n.y}%`,
          }}
        />
      ))}

      {/* Drum hit marks */}
      {trackKind === 'drums' && drumMarks.map(d => (
        <div
          key={d.key}
          className="drum-mark"
          style={{
            left: `calc(${d.x}% - ${d.size / 2}px)`,
            bottom: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: '3px',
          }}
        />
      ))}
    </div>
  );
}

/* ── Pitch → vertical position mapping. Shares the chromatic scale with
   PianoRoll via utils/note.ts so accidentals map correctly and both roll
   views speak the same pitch language. Fixed C2–C5 staff. ── */
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
    case 'kick':  return 15;
    case 'snare': return 35;
    case 'hihat': return 60;
    case 'clap':  return 80;
    default:      return 50;
  }
}
