import { Injectable, signal } from '@angular/core';

/**
 * Sound Service
 * Manages audio feedback for gameplay events
 * Uses Web Audio API for low-latency sound playback
 */
@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled = signal(true);
  private volume = signal(0.5);

  // Oscillator-based sounds (no files needed)
  private sounds = {
    perfectNote: this.createPerfectNoteSound.bind(this),
    goodNote: this.createGoodNoteSound.bind(this),
    wrongNote: this.createWrongNoteSound.bind(this),
    levelUp: this.createLevelUpSound.bind(this),
    achievement: this.createAchievementSound.bind(this),
    combo: this.createComboSound.bind(this)
  };

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', () => this.initAudio(), { once: true });
      document.addEventListener('keydown', () => this.initAudio(), { once: true });
    }
  }

  /**
   * Initialize Web Audio API
   */
  private initAudio(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      console.log('[Sound] Audio context initialized');
    }
  }

  /**
   * Play a sound effect
   */
  play(soundName: keyof typeof this.sounds): void {
    if (!this.enabled() || !this.audioContext) return;

    try {
      const soundFn = this.sounds[soundName];
      soundFn();
    } catch (error) {
      console.error('[Sound] Error playing sound:', soundName, error);
    }
  }

  /**
   * Perfect note sound - bright, uplifting chime
   */
  private createPerfectNoteSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    // Bell-like tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6

    // Quick fade out
    gain.gain.setValueAtTime(this.volume() * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Good note sound - pleasant but subtle
   */
  private createGoodNoteSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now); // E5

    gain.gain.setValueAtTime(this.volume() * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Wrong note sound - very subtle soft thud
   */
  private createWrongNoteSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    // Low, muffled tone - not annoying
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    // Low pass filter to make it soft
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    // Very quiet and short
    gain.gain.setValueAtTime(this.volume() * 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Level up sound - triumphant fanfare
   */
  private createLevelUpSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Three ascending notes
    const notes = [
      { freq: 523, time: 0 },      // C5
      { freq: 659, time: 0.1 },    // E5
      { freq: 784, time: 0.2 }     // G5
    ];

    notes.forEach(({ freq, time }) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(this.volume() * 0.4, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.3);

      osc.start(now + time);
      osc.stop(now + time + 0.3);
    });
  }

  /**
   * Achievement unlock sound - celebratory chord
   */
  private createAchievementSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Major chord
    const frequencies = [523, 659, 784]; // C-E-G

    frequencies.forEach(freq => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume() * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  /**
   * Combo sound - gentle chime (softer than before)
   */
  private createComboSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    // Gentle rising tone with soft sine wave
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

    // Quieter and shorter
    gain.gain.setValueAtTime(this.volume() * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(): void {
    this.enabled.set(!this.enabled());
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume.set(Math.max(0, Math.min(1, volume)));
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled();
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume();
  }
}
