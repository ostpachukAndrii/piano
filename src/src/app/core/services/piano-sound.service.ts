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

  // Piano harmonic structure (relative amplitudes)
  private readonly harmonics = [
    { ratio: 1, amplitude: 1.0 },      // Fundamental
    { ratio: 2, amplitude: 0.5 },      // 2nd harmonic
    { ratio: 3, amplitude: 0.25 },     // 3rd harmonic
    { ratio: 4, amplitude: 0.125 },    // 4th harmonic
    { ratio: 5, amplitude: 0.0625 },   // 5th harmonic
    { ratio: 6, amplitude: 0.03 },     // 6th harmonic
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

    // Create envelope gain node
    const envelopeGain = this.audioContext.createGain();
    envelopeGain.connect(this.masterGain);

    // Create oscillators for each harmonic
    const oscillators: OscillatorNode[] = [];

    this.harmonics.forEach(({ ratio, amplitude }) => {
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();

      // Use different wave types for different harmonics
      if (ratio === 1) {
        osc.type = 'sine';
      } else if (ratio <= 3) {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.value = frequency * ratio;

      // Scale amplitude based on harmonic and velocity
      // Reduced from 0.15 to 0.08 to prevent distortion/clipping
      oscGain.gain.value = amplitude * velocityScale * 0.08;

      osc.connect(oscGain);
      oscGain.connect(envelopeGain);

      osc.start(now);
      oscillators.push(osc);
    });

    // ADSR Envelope for piano-like sound
    // Attack: Very fast for piano (3-5ms) - prevents clicking
    // Decay: Medium (100-300ms)
    // Sustain: Lower than peak (0.3-0.5)
    // Release: Medium (200-500ms)

    const attackTime = 0.003;  // 3ms attack (very short to prevent clicks)
    const decayTime = 0.15;    // 150ms decay
    const sustainLevel = 0.4;  // 40% sustain
    const releaseTime = 0.3;   // 300ms release

    // Set initial value and apply envelope with smooth attack
    envelopeGain.gain.setValueAtTime(0.001, now);  // Start just above 0 to prevent pop
    envelopeGain.gain.linearRampToValueAtTime(1, now + attackTime);
    envelopeGain.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

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
