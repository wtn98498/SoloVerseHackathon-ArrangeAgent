import { useMemo } from 'react';
import { ArrangementProject, Track, Clip, NoteEvent, DrumHit } from '../../contracts';
import { useEditor } from '../contexts/EditorContext';

interface TrackTimelineProps {
  project: ArrangementProject;
}

export function TrackTimeline({ project }: TrackTimelineProps) {
  const { playback, ui, setUi } = useEditor();
  const totalSteps = project.bars * project.beatsPerBar * project.subdivision;

  const handleTrackSelect = (trackId: string) => {
    setUi({ ...ui, selectedTrackId: trackId });
  };

  const playheadPct = playback.isPlaying
    ? (playback.currentStep / totalSteps) * 100
    : -1;

  return (
    <div className="timeline-container" role="region" aria-label="编曲时间线">
      <div className="timeline-header">
        <h3>编曲</h3>
        <div className="timeline-info">
          <span>{project.bars} 小节</span>
          <span aria-hidden="true">·</span>
          <span>{totalSteps} 步</span>
        </div>
      </div>

      {/* Bar ruler */}
      <div className="bar-ruler">
        <div className="bar-ruler-gutter" />
        <div className="bar-ruler-track">
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
            isSelected={ui.selectedTrackId === track.id}
            onSelect={() => handleTrackSelect(track.id)}
            isPlaying={playback.isPlaying}
            playheadPct={playheadPct}
          />
        ))}

        {playheadPct >= 0 && (
          <div className="playhead-line" style={{ left: `calc(96px + ${playheadPct}% * ((100% - 96px) / 100%))` }} />
        )}
      </div>
    </div>
  );
}

/* ── Track Row ── */
interface TrackRowProps {
  track: Track;
  bars: number;
  isSelected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  playheadPct: number;
}

function TrackRow({ track, bars, isSelected, onSelect, isPlaying, playheadPct }: TrackRowProps) {
  return (
    <div
      className={`track-row ${isSelected ? 'selected' : ''} ${track.muted ? 'muted' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${track.name} 音轨`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className="track-info" style={{ borderColor: track.color }}>
        <div className="track-name">{track.name}</div>
        <div className="track-kind">{track.kind}</div>
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
          <ClipBlock key={clip.id} clip={clip} trackColor={track.color} trackKind={track.kind} />
        ))}

        {isPlaying && playheadPct >= 0 && (
          <div className="track-playhead" style={{ left: `${playheadPct}%` }} />
        )}
      </div>
    </div>
  );
}

/* ── Clip with real waveform ── */
function ClipBlock({ clip, trackColor, trackKind }: { clip: Clip; trackColor: string; trackKind: string }) {
  const leftPct = (clip.barStart / 8) * 100;
  const widthPct = (clip.barLength / 8) * 100;

  return (
    <div
      className="clip"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
    >
      <WaveformSVG
        color={trackColor}
        notes={clip.notes}
        drumHits={clip.drumHits}
        barLength={clip.barLength}
        trackKind={trackKind}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   Real Waveform Generator
   ═══════════════════════════════════════

   Generates a realistic audio waveform SVG path from musical event data.

   Algorithm:
   1. Build an amplitude envelope from note/drum events
   2. Multiply by pseudo-random carrier to simulate high-frequency audio detail
   3. Render as a filled SVG <path> between upper and lower envelopes
   4. The result looks like a real oscilloscope / DAW waveform
*/
function WaveformSVG({
  color,
  notes,
  drumHits,
  barLength,
  trackKind,
}: {
  color: string;
  notes: NoteEvent[];
  drumHits: DrumHit[];
  barLength: number;
  trackKind: string;
}) {
  const totalSteps = barLength * 4 * 4; // 16 steps/bar × 4 subdivisions

  // High-res sample count: enough points for a smooth waveform
  const SAMPLES = 256;

  const pathData = useMemo(() => {
    // ── Step 1: Amplitude envelope from events ──
    const envelope = new Float32Array(SAMPLES);

    // Map notes → envelope amplitude
    for (const n of notes) {
      const startSample = Math.floor((n.step / totalSteps) * SAMPLES);
      const endSample = Math.floor(((n.step + n.durationSteps) / totalSteps) * SAMPLES);
      const attackLen = Math.max(2, Math.floor(SAMPLES * 0.005));
      const releaseLen = Math.max(3, Math.floor(SAMPLES * 0.015));

      for (let s = startSample; s < endSample && s < SAMPLES; s++) {
        // Attack ramp up
        let env = n.velocity;
        if (s - startSample < attackLen) {
          env *= (s - startSample) / attackLen;
        }
        // Release ramp down at the tail
        if (endSample - s < releaseLen) {
          env *= (endSample - s) / releaseLen;
        }
        envelope[s] = Math.max(envelope[s], env);
      }
    }

    // Map drums → sharp transients
    for (const h of drumHits) {
      const center = Math.floor((h.step / totalSteps) * SAMPLES);
      const decayLen = trackKind === 'drums' ? 8 : 5; // drums ring longer
      for (let j = 0; j < decayLen; j++) {
        const idx = center + j;
        if (idx >= 0 && idx < SAMPLES) {
          const decay = Math.exp(-j * 0.4) * h.velocity;
          envelope[idx] = Math.max(envelope[idx], decay);
        }
      }
    }

    // ── Step 2: Pseudo-random carrier for audio texture ──
    // Deterministic hash so waveform is stable across renders
    const hash = (i: number) => {
      let x = Math.sin(i * 127.1 + trackKind.charCodeAt(0) * 311.7) * 43758.5453;
      return x - Math.floor(x); // 0..1
    };

    // Carrier frequency varies by instrument type
    const carrierFreq = trackKind === 'keys' ? 0.45
      : trackKind === 'drums' ? 0.35
      : trackKind === 'bass' ? 0.25
      : 0.3;

    // ── Step 3: Build upper & lower waveform paths ──
    const mid = 50; // SVG center line (viewBox 0..100)
    const maxAmp = 42; // max pixels of amplitude

    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];

    for (let i = 0; i < SAMPLES; i++) {
      const x = (i / (SAMPLES - 1)) * 1000; // viewBox width 1000

      // Carrier: smooth-ish pseudo-random oscillation
      const carrier = Math.sin(i * carrierFreq) * 0.5
        + hash(i) * 0.3
        + hash(i + 999) * 0.2;

      // Amplitude = envelope × carrier
      const amp = envelope[i] * carrier;
      const y = amp * maxAmp;

      // Upper path goes UP from midline, lower goes DOWN (symmetric)
      upperPoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(mid - y).toFixed(2)}`);
      lowerPoints.push(`L${x.toFixed(1)},${(mid + y).toFixed(2)}`);
    }

    // Close the shape: upper path → reverse lower path → close
    const closedPath = upperPoints.join(' ')
      + ' '
      + lowerPoints.reverse().join(' ')
      + ' Z';

    return closedPath;
  }, [notes, drumHits, totalSteps, trackKind]);

  const hasEvents = notes.length > 0 || drumHits.length > 0;

  return (
    <svg
      className="clip-waveform"
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Center line */}
      <line x1="0" y1="50" x2="1000" y2="50" stroke={color} strokeWidth="0.5" opacity="0.15" />

      {/* Waveform fill */}
      {hasEvents && (
        <path
          d={pathData}
          fill={color}
          opacity="0.55"
        />
      )}

      {/* Waveform stroke for definition */}
      {hasEvents && (
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.25"
        />
      )}
    </svg>
  );
}
