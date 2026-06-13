import { useRef, useMemo } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { INSTRUMENT_THEME, instrumentVars } from '../theme';
import { maxOctaveOf } from '../utils/note';
import { audioEngine } from '../audio/AudioEngine';
import type { ArrangementProject, Track } from '../../contracts';

/* ── Chromatic pitch range shown in the roll. Lower bound is fixed at C2 so the
   fixed-pixel drum lanes never overflow; the upper octave expands dynamically
   when a clip contains notes above B4, so agent-generated high notes are never
   clipped. ── */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_OCT = 2;

interface PitchRow { label: string; isBlack: boolean; row: number; }

const ROW_H = 18;
const TOTAL_STEPS = 128;

// Normalize the legacy alias C² → C5 used in some fixtures / agent output.
const aliasPitch = (pitch: string) => (pitch === 'C²' ? 'C5' : pitch);

export function PianoRoll({ project }: { project: ArrangementProject }) {
  const { playback, setPlayback, ui } = useEditor();
  const gridRef = useRef<HTMLDivElement>(null);

  const track: Track | undefined =
    project.tracks.find((t) => t.id === ui.selectedTrackId) ?? project.tracks[0];

  const theme = track ? INSTRUMENT_THEME[track.kind] : INSTRUMENT_THEME.keys;
  const clip = track?.clips[0];

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

  // Click / drag the grid to scrub the playhead position.
  const scrubFromEvent = (clientX: number) => {
    const el = gridRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const step = Math.round(ratio * (TOTAL_STEPS - 1));
    setPlayback({ ...playback, currentStep: step });
  };

  const playheadPct = (playback.currentStep / (TOTAL_STEPS - 1)) * 100;

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

        {/* Note grid (also the scrub surface) */}
        <div
          className="piano-grid"
          ref={gridRef}
          style={{ height: gridHeight }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            scrubFromEvent(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) scrubFromEvent(e.clientX);
          }}
        >
          {/* Bar dividers */}
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="pr-barline" style={{ left: `${((i + 1) / 8) * 100}%` }} />
          ))}
          {/* Octave C-row shading */}
          {rowsTopDown.map((p) =>
            p.label.startsWith('C') && !p.isBlack ? (
              <div
                key={`shade-${p.label}`}
                className="pr-row-shade"
                style={{ bottom: p.row * ROW_H, height: ROW_H }}
              />
            ) : null
          )}

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
                title={`${n.pitch} · step ${n.step}（点击试听）`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => audioEngine.auditionNote(n.pitch)}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  bottom: row * ROW_H + 2,
                  height: ROW_H - 4,
                }}
              />
            );
          })}

          {/* Drum hits rendered as dots */}
          {clip?.drumHits.map((h) => {
            const left = (h.step / TOTAL_STEPS) * 100;
            const row =
              h.drum === 'kick' ? 2 : h.drum === 'snare' ? 14 : h.drum === 'hihat' ? 26 : 32;
            return (
              <div
                key={h.id}
                className="pr-drum"
                title={`${h.drum} · step ${h.step}`}
                style={{ left: `${left}%`, bottom: row * ROW_H + 3 }}
              />
            );
          })}

          {/* Persistent playhead */}
          <div className="pr-playhead" style={{ left: `${playheadPct}%` }}>
            <div className="pr-playhead-head" />
          </div>
        </div>
      </div>
    </section>
  );
}
