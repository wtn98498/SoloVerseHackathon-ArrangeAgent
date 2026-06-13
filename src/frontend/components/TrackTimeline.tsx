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

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

  // Playhead is always present (常驻); currentStep persists when paused.
  const playheadPct = (playback.currentStep / (totalSteps - 1)) * 100;

  // Click / drag the ruler to scrub the playhead position (可调节).
  const scrubFromEvent = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const step = Math.round(ratio * (totalSteps - 1));
    setPlayback({ ...playback, currentStep: step });
  };

  /* ── Clip editing (copy / paste / delete) ── */
  const openClipMenu = (trackId: string, clip: Clip, x: number, y: number) => {
    handleTrackSelect(trackId); // follow the clip's track in the piano roll
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

  return (
    <>
      <div className="timeline-container" role="region" aria-label="编曲时间线">
        {/* Bar ruler — also the scrub surface */}
        <div className="bar-ruler">
          <div className="bar-ruler-gutter" />
          <div
            className="bar-ruler-track scrub-surface"
            ref={rulerRef}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              scrubFromEvent(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) scrubFromEvent(e.clientX);
            }}
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
              onSelect={() => handleTrackSelect(track.id)}
              isPlaying={playback.isPlaying}
              playheadPct={playheadPct}
              onClipContext={(clip, x, y) => openClipMenu(track.id, clip, x, y)}
            />
          ))}

          <div className="playhead-line" style={{ left: `calc(104px + ${playheadPct}% * ((100% - 104px) / 100%))` }} />
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
  onSelect: () => void;
  isPlaying: boolean;
  playheadPct: number;
  onClipContext: (clip: Clip, x: number, y: number) => void;
}

function TrackRow({ track, bars, totalSteps, isSelected, onSelect, isPlaying, playheadPct, onClipContext }: TrackRowProps) {
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
            onClipContext={onClipContext}
          />
        ))}

        {isPlaying && playheadPct >= 0 && (
          <div className="track-playhead" style={{ left: `${playheadPct}%` }} />
        )}
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
  onClipContext,
}: {
  clip: Clip;
  totalSteps: number;
  trackKind: string;
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
      className="midi-clip"
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
