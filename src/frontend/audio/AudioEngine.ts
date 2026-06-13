import * as Tone from 'tone';
import { ArrangementProject } from '../../contracts';

export class AudioEngine {
  private isInitialized: boolean = false;
  private sequencer: Tone.Sequence | null = null;
  private drumSynths: Map<string, Tone.Player> = new Map();
  private synth: Tone.PolySynth | null = null;
  // Step callback fired from the Tone.Sequence loop so the UI playhead is driven
  // by the *same* audio clock (single source of truth for playback position).
  private onStepCb?: (step: number) => void;

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    // Initialize drum samples (using simple synths for MVP)
    this.initializeDrumSynths();

    // Initialize poly synth for pitched instruments
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();

    this.isInitialized = true;
  }

  private initializeDrumSynths() {
    if (this.drumSynths.size > 0) return;

    // For MVP, we use simple synths instead of samples
    const kickSynth = new Tone.MembraneSynth().toDestination();
    const snareSynth = new Tone.NoiseSynth().toDestination();
    const hihatSynth = new Tone.MetalSynth().toDestination();
    const clapSynth = new Tone.NoiseSynth().toDestination();

    this.drumSynths.set('kick', kickSynth as any);
    this.drumSynths.set('snare', snareSynth as any);
    this.drumSynths.set('hihat', hihatSynth as any);
    this.drumSynths.set('clap', clapSynth as any);
  }

  playProject(
    project: ArrangementProject,
    currentStep: number,
    loopRegion?: { start: number; end: number } | null
  ) {
    if (!this.isInitialized) {
      this.initialize();
    }

    this.stopSequence();

    const totalSteps = project.bars * project.beatsPerBar * project.subdivision;
    const stepDuration = (60 / project.tempo) / project.subdivision;

    // When a loop region is set, restrict the Tone.Sequence to just those
    // steps — Tone.Sequence loops its events array natively, so the audio
    // (and the onStepCb playhead) loop exactly within [start, end] with zero
    // drift between sound and UI.
    const region =
      loopRegion && loopRegion.end > loopRegion.start
        ? { start: Math.max(0, loopRegion.start), end: Math.min(totalSteps - 1, loopRegion.end) }
        : null;
    const events = region
      ? Array.from({ length: region.end - region.start + 1 }, (_, i) => region.start + i)
      : Array.from({ length: totalSteps }, (_, i) => i);

    // Clamp the start offset into the region so playback never begins outside it.
    const startStep = region
      ? Math.max(region.start, Math.min(region.end, currentStep))
      : currentStep;

    // Create sequence for playback
    this.sequencer = new Tone.Sequence((time, step) => {
      project.tracks.forEach(track => {
        if (track.muted) return;

        track.clips.forEach(clip => {
          // Play drum hits
          clip.drumHits.forEach(hit => {
            if (hit.step === step) {
              this.playDrumHit(hit.drum, time);
            }
          });

          // Play notes
          clip.notes.forEach(note => {
            if (note.step === step) {
              this.playNote(note.pitch, note.durationSteps * stepDuration, note.velocity, time);
            }
          });
        });
      });

      // Drive the UI playhead from this audio-clock step.
      this.onStepCb?.(step);
    }, events, stepDuration);

    // Tone.start() only resumes the AudioContext; the Transport must actually
    // be running for a Tone.Sequence to advance — without it playback is silent.
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }

    this.sequencer.start(0, startStep);
  }

  private playDrumHit(drum: string, time: number) {
    const synth = this.drumSynths.get(drum);
    if (!synth) return;

    switch (drum) {
      case 'kick':
        (synth as any).triggerAttackRelease('C2', '8n', time);
        break;
      case 'snare':
        (synth as any).triggerAttackRelease('16n', time);
        break;
      case 'hihat':
        (synth as any).triggerAttackRelease('32n', time, 0.1);
        break;
      case 'clap':
        (synth as any).triggerAttackRelease('16n', time, 0.2);
        break;
    }
  }

  private playNote(pitch: string, duration: number, velocity: number, time: number) {
    if (!this.synth) return;

    this.synth.triggerAttackRelease(pitch, duration, time, velocity);
  }

  stopSequence() {
    if (this.sequencer) {
      this.sequencer.stop();
      this.sequencer.dispose();
      this.sequencer = null;
    }
  }

  setTempo(tempo: number) {
    Tone.Transport.bpm.value = tempo;
  }

  /** Subscribe to per-step position updates from the audio clock. */
  setOnStep(cb?: (step: number) => void) {
    this.onStepCb = cb;
  }

  /** Click-to-hear a single pitch. Ensures the audio context is started; safe
   * to call from a user gesture (pointerdown). */
  async auditionNote(pitch: string) {
    await this.initialize();
    this.synth?.triggerAttackRelease(pitch, '8n');
  }

  /** Audition all notes + drums at a moment (click a beat to hear it). */
  async auditionStep(pitches: string[], drums: string[]) {
    await this.initialize();
    const time = Tone.now();
    pitches.forEach((p) => this.synth?.triggerAttackRelease(p, '8n', time));
    drums.forEach((d) => this.playDrumHit(d, time));
  }

  dispose() {
    this.stopSequence();

    this.drumSynths.forEach(synth => synth.dispose());
    this.drumSynths.clear();

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    Tone.Transport.cancel();
    this.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();
