import { Injectable, signal } from '@angular/core';

/**
 * Piano Sound Service
 * Synthesizes realistic piano sounds using Web Audio API
 * Uses multiple oscillators with harmonics and ADSR envelope
 */
@Injectable({
  providedIn: 'root'
})
export class PianoSoundService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNotes: Map<number, { oscillators: OscillatorNode[], gain: GainNode }> = new Map();

  // Settings
  private _enabled = signal(true);
  private _volume = signal(0.5);  // Reduced from 0.7 to prevent distortion

  readonly enabled = this._enabled.asReadonly();
  readonly volume = this._volume.asReadonly();

  // Piano harmonic structure with inharmonicity
  // Real pianos have slightly inharmonic partials (higher harmonics are sharper)
  // This creates a richer, more realistic piano timbre
  private readonly harmonics = [
    { ratio: 1.000, amplitude: 1.00, detune: 0 },     // Fundamental
    { ratio: 2.000, amplitude: 0.60, detune: 2 },     // 2nd harmonic (slightly sharp)
    { ratio: 3.000, amplitude: 0.35, detune: 4 },     // 3rd harmonic
    { ratio: 4.002, amplitude: 0.20, detune: 6 },     // 4th harmonic (inharmonic)
    { ratio: 5.004, amplitude: 0.12, detune: 8 },     // 5th harmonic (inharmonic)
    { ratio: 6.008, amplitude: 0.08, detune: 10 },    // 6th harmonic (inharmonic)
    { ratio: 7.012, amplitude: 0.05, detune: 12 },    // 7th harmonic (inharmonic)
    { ratio: 8.016, amplitude: 0.03, detune: 14 },    // 8th harmonic (inharmonic)
  ];

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      const initHandler = () => {
        this.initAudio();
        document.removeEventListener('click', initHandler);
        document.removeEventListener('keydown', initHandler);
      };
      document.addEventListener('click', initHandler);
      document.addEventListener('keydown', initHandler);
    }
  }

  /**
   * Initialize Web Audio API context
   */
  initAudio(): void {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = this._volume();

    console.log('[PianoSound] Audio context initialized');
  }

  /**
   * Convert MIDI note number to frequency (Hz)
   * A4 (MIDI 69) = 440 Hz
   */
  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Play a piano note
   * @param midi MIDI note number (21-108 for standard piano)
   * @param velocity Note velocity (0-127, default 100)
   * @param duration Duration in seconds (0 = sustained until noteOff)
   */
  playNote(midi: number, velocity: number = 100, duration: number = 0): void {
    if (!this._enabled() || !this.audioContext || !this.masterGain) {
      this.initAudio();
      if (!this.audioContext || !this.masterGain) return;
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Stop any existing note at this pitch (prevents clicking)
    // Use immediate stop for cleaner retrigger
    this.stopNoteImmediate(midi);

    const now = this.audioContext.currentTime;
    const frequency = this.midiToFrequency(midi);
    const velocityScale = velocity / 127;

    // Create low-pass filter for warmer tone (simulates piano soundboard resonance)
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    // Higher notes have brighter tone (higher cutoff)
    // Lower notes have mellower tone (lower cutoff)
    const baseCutoff = 2000 + (midi - 60) * 50; // Adjusts with pitch
    filter.frequency.value = Math.min(baseCutoff, 8000);
    filter.Q.value = 1.5;

    // Create envelope gain node
    const envelopeGain = this.audioContext.createGain();
    filter.connect(envelopeGain);
    envelopeGain.connect(this.masterGain);

    // Create oscillators for each harmonic
    const oscillators: OscillatorNode[] = [];

    this.harmonics.forEach(({ ratio, amplitude, detune }) => {
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();

      // All harmonics use sine waves for purity
      // The complexity comes from the number of harmonics and inharmonicity
      osc.type = 'sine';
      osc.frequency.value = frequency * ratio;

      // Add slight detuning for inharmonicity (cents)
      osc.detune.value = detune;

      // Scale amplitude based on harmonic and velocity
      // Higher harmonics decay faster (brightness decreases with time)
      const harmonicScale = ratio === 1 ? 1 : 1 / Math.sqrt(ratio);
      oscGain.gain.value = amplitude * velocityScale * harmonicScale * 0.12;

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      oscillators.push(osc);
    });

    // ADSR Envelope for realistic piano sound
    // Pianos have very fast attack, initial brightness spike, then gradual decay
    // Attack: 1-3ms (percussive strike)
    // Decay: Varies by register (lower notes decay slower)
    // Sustain: Long slow decay while key is held (real pianos sustain 5-15+ seconds)
    // Release: Damper hits string on key release (handled by stopNote)

    const attackTime = 0.002;  // 2ms attack (hammer strike)
    // Lower notes decay slower, higher notes decay faster
    const decayTime = 0.08 + (60 - midi) * 0.003;
    const sustainLevel = 0.6;  // Sustain level after initial decay

    // Sustain duration varies by register: lower notes ring longer
    // Bass (midi 36): ~12s, Middle C (midi 60): ~8s, High C (midi 84): ~4s
    const sustainDuration = Math.max(4, 12 - (midi - 36) * 0.12);
    const sustainFloor = 0.08; // Barely audible floor after full sustain

    // Piano envelope: instant attack, bright initial tone, then long sustain decay
    envelopeGain.gain.setValueAtTime(0, now);
    envelopeGain.gain.linearRampToValueAtTime(1.2, now + attackTime); // Initial brightness spike
    envelopeGain.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    // Long gradual decay while key is held (mimics string energy loss)
    envelopeGain.gain.exponentialRampToValueAtTime(sustainFloor, now + attackTime + decayTime + sustainDuration);

    // Store active note for later release
    this.activeNotes.set(midi, { oscillators, gain: envelopeGain });

    // If duration specified, auto-stop
    if (duration > 0) {
      setTimeout(() => this.stopNote(midi), duration * 1000);
    }
  }

  /**
   * Stop a playing note immediately (for retriggering - prevents clicks)
   */
  private stopNoteImmediate(midi: number): void {
    const note = this.activeNotes.get(midi);
    if (!note || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Very fast fade out to prevent clicking (5ms)
    note.gain.gain.cancelScheduledValues(now);
    note.gain.gain.setValueAtTime(note.gain.gain.value, now);
    note.gain.gain.linearRampToValueAtTime(0.001, now + 0.005);

    // Stop and cleanup
    setTimeout(() => {
      note.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Already stopped
        }
      });
      note.gain.disconnect();
    }, 10);

    this.activeNotes.delete(midi);
  }

  /**
   * Stop a playing note with release envelope
   */
  stopNote(midi: number): void {
    const note = this.activeNotes.get(midi);
    if (!note || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const releaseTime = 0.3;

    // Apply release envelope
    note.gain.gain.cancelScheduledValues(now);
    note.gain.gain.setValueAtTime(note.gain.gain.value, now);
    note.gain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    // Stop and cleanup after release
    setTimeout(() => {
      note.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Already stopped
        }
      });
      note.gain.disconnect();
    }, releaseTime * 1000 + 50);

    this.activeNotes.delete(midi);
  }

  /**
   * Play multiple notes simultaneously (chord)
   */
  playChord(midiNotes: number[], velocity: number = 100, duration: number = 0): void {
    midiNotes.forEach(midi => this.playNote(midi, velocity, duration));
  }

  /**
   * Stop multiple notes
   */
  stopChord(midiNotes: number[]): void {
    midiNotes.forEach(midi => this.stopNote(midi));
  }

  /**
   * Stop all playing notes
   */
  stopAll(): void {
    this.activeNotes.forEach((_, midi) => this.stopNote(midi));
    this.activeNotes.clear();
  }

  /**
   * Play a note for a specific duration (for playback)
   */
  async playNoteTimed(midi: number, durationMs: number, velocity: number = 100): Promise<void> {
    this.playNote(midi, velocity);

    return new Promise(resolve => {
      setTimeout(() => {
        this.stopNote(midi);
        resolve();
      }, durationMs);
    });
  }

  /**
   * Play a chord for a specific duration (for playback)
   */
  async playChordTimed(midiNotes: number[], durationMs: number, velocity: number = 100): Promise<void> {
    midiNotes.forEach(midi => this.playNote(midi, velocity));

    return new Promise(resolve => {
      setTimeout(() => {
        midiNotes.forEach(midi => this.stopNote(midi));
        resolve();
      }, durationMs);
    });
  }

  /**
   * Toggle sound on/off
   */
  toggle(): void {
    this._enabled.set(!this._enabled());
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this._volume.set(clamped);

    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }
  }

  /**
   * Get note name for display
   */
  getNoteNameFromMidi(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}${octave}`;
  }
}
