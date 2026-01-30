import { Injectable, computed, inject, signal } from '@angular/core';
import { LessonDTO, MeasureDTO } from '../models/lesson.model';
import { NoteDTO, isChordNote, isRestNote, isSingleNote, SingleNoteDTO, ChordNoteDTO } from '../models/note.model';
import { PianoSoundService } from './piano-sound.service';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface PlaybackPosition {
  measureIndex: number;
  noteIndex: number;
  timeMs: number;
}

export interface NoteTimingInfo {
  measureIndex: number;
  noteIndex: number;
  startTimeMs: number;
  durationMs: number;
  midiNotes: number[];
  isRest: boolean;
}

/**
 * Playback Service
 * Manages lesson playback with moving cursor and piano sounds
 */
@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  private pianoSound = inject(PianoSoundService);

  // State
  private readonly _state = signal<PlaybackState>('stopped');
  private readonly _currentPosition = signal<PlaybackPosition>({ measureIndex: 0, noteIndex: 0, timeMs: 0 });
  private readonly _tempo = signal<number>(120); // BPM
  private readonly _lesson = signal<LessonDTO | null>(null);

  // Timing data computed from lesson
  private noteTimings: NoteTimingInfo[] = [];
  private totalDurationMs = 0;

  // Playback control
  private playbackStartTime = 0;
  private pausedAtTime = 0;
  private animationFrameId: number | null = null;

  // Public signals
  readonly state = this._state.asReadonly();
  readonly currentPosition = this._currentPosition.asReadonly();
  readonly tempo = this._tempo.asReadonly();

  // Computed signals
  readonly isPlaying = computed(() => this._state() === 'playing');
  readonly isPaused = computed(() => this._state() === 'paused');
  readonly isStopped = computed(() => this._state() === 'stopped');

  readonly progressPercent = computed(() => {
    if (this.totalDurationMs === 0) return 0;
    return Math.min(100, (this._currentPosition().timeMs / this.totalDurationMs) * 100);
  });

  /**
   * Load a lesson for playback
   */
  loadLesson(lesson: LessonDTO): void {
    this.stop();
    this._lesson.set(lesson);
    this._tempo.set(lesson.tempo);
    this.calculateNoteTimings(lesson);
    console.log('[Playback] Lesson loaded, total duration:', this.totalDurationMs, 'ms');
  }

  /**
   * Calculate timing for each note based on tempo
   */
  private calculateNoteTimings(lesson: LessonDTO): void {
    this.noteTimings = [];
    let currentTimeMs = 0;

    // Calculate milliseconds per beat
    const msPerBeat = (60 / lesson.tempo) * 1000;

    // Parse time signature (e.g., "4/4" -> 4 beats per measure)
    const [beatsPerMeasure] = lesson.time_signature.split('/').map(Number);

    // Calculate beat value (quarter note = 1, half = 2, etc.)
    const beatValue = 4; // Assuming quarter note gets the beat

    lesson.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((note, noteIndex) => {
        // Duration is already in beats (number)
        const durationBeats = note.duration;
        const durationMs = durationBeats * msPerBeat;

        const timing: NoteTimingInfo = {
          measureIndex,
          noteIndex,
          startTimeMs: currentTimeMs,
          durationMs,
          midiNotes: this.getMidiFromNote(note),
          isRest: isRestNote(note)
        };

        this.noteTimings.push(timing);
        currentTimeMs += durationMs;
      });
    });

    this.totalDurationMs = currentTimeMs;
  }

  /**
   * Get MIDI notes from a note DTO
   */
  private getMidiFromNote(note: NoteDTO): number[] {
    if (isRestNote(note)) return [];
    if (isSingleNote(note)) return [(note as SingleNoteDTO).midi];
    if (isChordNote(note)) return (note as ChordNoteDTO).midi;
    return [];
  }

  /**
   * Start or resume playback
   */
  play(): void {
    if (!this._lesson()) return;

    // Initialize piano sound
    this.pianoSound.initAudio();

    if (this._state() === 'paused') {
      // Resume from paused position
      this.playbackStartTime = performance.now() - this.pausedAtTime;
    } else {
      // Start from beginning
      this.playbackStartTime = performance.now();
      this._currentPosition.set({ measureIndex: 0, noteIndex: 0, timeMs: 0 });
    }

    this._state.set('playing');
    this.startPlaybackLoop();
    console.log('[Playback] Started playback');
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this._state() !== 'playing') return;

    this._state.set('paused');
    this.pausedAtTime = this._currentPosition().timeMs;
    this.stopPlaybackLoop();
    this.pianoSound.stopAll();
    console.log('[Playback] Paused at', this.pausedAtTime, 'ms');
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this._state.set('stopped');
    this.stopPlaybackLoop();
    this.pianoSound.stopAll();
    this._currentPosition.set({ measureIndex: 0, noteIndex: 0, timeMs: 0 });
    this.pausedAtTime = 0;
    console.log('[Playback] Stopped');
  }

  /**
   * Toggle play/pause
   */
  toggle(): void {
    if (this._state() === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to a specific position (by percentage)
   */
  seekTo(percent: number): void {
    const wasPlaying = this._state() === 'playing';
    if (wasPlaying) {
      this.pause();
    }

    const targetTime = (percent / 100) * this.totalDurationMs;
    this.pausedAtTime = targetTime;

    // Find the note at this time
    const noteIndex = this.noteTimings.findIndex(
      (timing, i) => timing.startTimeMs <= targetTime &&
        (i === this.noteTimings.length - 1 || this.noteTimings[i + 1].startTimeMs > targetTime)
    );

    if (noteIndex >= 0) {
      const timing = this.noteTimings[noteIndex];
      this._currentPosition.set({
        measureIndex: timing.measureIndex,
        noteIndex: timing.noteIndex,
        timeMs: targetTime
      });
    }

    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Set playback tempo
   */
  setTempo(bpm: number): void {
    const lesson = this._lesson();
    if (!lesson) return;

    const wasPlaying = this._state() === 'playing';
    const currentProgress = this.progressPercent();

    if (wasPlaying) {
      this.pause();
    }

    this._tempo.set(bpm);
    // Recalculate timings with new tempo
    this.calculateNoteTimings({ ...lesson, tempo: bpm });

    // Seek to equivalent position
    if (currentProgress > 0) {
      this.seekTo(currentProgress);
    }

    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Main playback loop
   */
  private startPlaybackLoop(): void {
    let lastNoteIndex = -1;

    const tick = () => {
      if (this._state() !== 'playing') return;

      const currentTimeMs = performance.now() - this.playbackStartTime;

      // Find current note
      const noteIndex = this.noteTimings.findIndex(
        (timing, i) => timing.startTimeMs <= currentTimeMs &&
          (i === this.noteTimings.length - 1 || this.noteTimings[i + 1].startTimeMs > currentTimeMs)
      );

      // Check if we moved to a new note
      if (noteIndex >= 0 && noteIndex !== lastNoteIndex) {
        const timing = this.noteTimings[noteIndex];

        // Update position
        this._currentPosition.set({
          measureIndex: timing.measureIndex,
          noteIndex: timing.noteIndex,
          timeMs: currentTimeMs
        });

        // Play the note if not a rest
        if (!timing.isRest && timing.midiNotes.length > 0) {
          // Stop previous notes
          this.pianoSound.stopAll();

          // Play new notes
          timing.midiNotes.forEach(midi => {
            this.pianoSound.playNote(midi, 100);
          });

          // Schedule note off
          setTimeout(() => {
            timing.midiNotes.forEach(midi => {
              this.pianoSound.stopNote(midi);
            });
          }, timing.durationMs * 0.9); // Release slightly before next note
        }

        lastNoteIndex = noteIndex;
      }

      // Check if playback is complete
      if (currentTimeMs >= this.totalDurationMs) {
        console.log('[Playback] Playback complete');
        this.stop();
        return;
      }

      // Update time position
      this._currentPosition.update(pos => ({ ...pos, timeMs: currentTimeMs }));

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Stop the playback loop
   */
  private stopPlaybackLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get total duration in formatted string
   */
  get totalDurationFormatted(): string {
    const totalSeconds = Math.floor(this.totalDurationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get current time in formatted string
   */
  get currentTimeFormatted(): string {
    const currentSeconds = Math.floor(this._currentPosition().timeMs / 1000);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
