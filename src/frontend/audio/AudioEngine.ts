import * as Tone from 'tone';
import { ArrangementProject, DrumHit, NoteEvent } from '../../contracts';

export class AudioEngine {
  private isInitialized: boolean = false;
  private sequencer: Tone.Sequence | null = null;
  private drumSynths: Map<string, Tone.Player> = new Map();
  private synth: Tone.PolySynth | null = null;
  // Master gain bus — stopping mutes it for a hard cut (no release tail).
  private master: Tone.Gain | null = null;
  // Step callback fired from the Tone.Sequence loop so the UI playhead is driven
  // by the *same* audio clock (single source of truth for playback position).
  private onStepCb?: (step: number) => void;

  /** Set the master bus gain (hard-cut on stop, restore on play/audition). */
  private setMasterGain(value: number) {
    const now = Tone.now();
    this.master?.gain.cancelScheduledValues(now);
    this.master?.gain.setValueAtTime(value, now);
  }

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    // Master gain bus everything routes through, so stopping can hard-cut.
    this.master = new Tone.Gain(1).toDestination();

    // Initialize drum samples (using simple synths for MVP)
    this.initializeDrumSynths();

    // Initialize poly synth for pitched instruments
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
    }).connect(this.master);

    this.isInitialized = true;
  }

  private initializeDrumSynths() {
    if (this.drumSynths.size > 0) return;

    // For MVP, we use simple synths instead of samples
    const kickSynth = new Tone.MembraneSynth().connect(this.master!);
    const snareSynth = new Tone.NoiseSynth().connect(this.master!);
    const hihatSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    }).connect(this.master!);
    const clapSynth = new Tone.NoiseSynth().connect(this.master!);

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

    // Restore the master bus (stopSequence mutes it for the hard-cut).
    this.setMasterGain(1);

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

    // Tone.Sequence's start offset is seconds into the loop, so seek to the
    // playhead (red line) — passing the raw step number made it wrap to 0 and
    // always play from the start.
    const offsetSec = region
      ? (startStep - region.start) * stepDuration
      : startStep * stepDuration;
    this.sequencer.start(0, offsetSec);
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
        (synth as any).triggerAttackRelease('32n', time, 0.5);
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
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.seconds = 0;

    // Hard-cut: release sustaining voices and mute the master bus instantly so
    // stop is immediate (no release tail / fade-out). Bus is restored before
    // the next play/audition.
    this.synth?.releaseAll();
    this.setMasterGain(0);
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
    this.setMasterGain(1);
    this.synth?.triggerAttackRelease(pitch, '8n');
  }

  /** Audition all notes + drums at a moment (click a beat to hear it). */
  async auditionStep(pitches: string[], drums: string[]) {
    await this.initialize();
    this.setMasterGain(1);
    const time = Tone.now();
    pitches.forEach((p) => this.synth?.triggerAttackRelease(p, '8n', time));
    drums.forEach((d) => this.playDrumHit(d, time));
  }

  /** Play a short captured phrase from its beginning, preserving relative timing. */
  async auditionEvents(
    notes: NoteEvent[],
    drumHits: DrumHit[],
    tempo: number,
  ) {
    if (notes.length === 0 && drumHits.length === 0) return;

    await this.initialize();
    this.stopSequence();
    this.setMasterGain(1);
    Tone.Transport.bpm.value = tempo;

    const firstStep = Math.min(
      ...notes.map((note) => note.step),
      ...drumHits.map((hit) => hit.step),
    );
    const stepDuration = (60 / tempo) / 4;
    const startAt = Tone.now() + 0.04;

    notes.forEach((note) => {
      const time = startAt + (note.step - firstStep) * stepDuration;
      this.playNote(note.pitch, note.durationSteps * stepDuration, note.velocity, time);
    });
    drumHits.forEach((hit) => {
      const time = startAt + (hit.step - firstStep) * stepDuration;
      this.playDrumHit(hit.drum, time);
    });
  }

  dispose() {
    this.stopSequence();

    this.drumSynths.forEach(synth => synth.dispose());
    this.drumSynths.clear();

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    this.master?.dispose();
    this.master = null;

    Tone.Transport.cancel();
    this.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();
