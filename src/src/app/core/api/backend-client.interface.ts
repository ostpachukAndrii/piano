/**
 * Backend Client Interface
 *
 * Abstract interface for communicating with the backend.
 * This allows us to:
 * - Mock the backend for testing
 * - Switch between Tauri and other backends
 * - Decouple services from Tauri-specific code
 */

import { InjectionToken } from '@angular/core';

export interface MidiDeviceInfo {
  id: string;
  name: string;
  is_connected: boolean;
}

export interface MidiChord {
  notes: number[];
  hand: string;
  velocity: number;
  timestamp_ms: number;
}

export interface LessonMetadata {
  id: string;
  title: string;
  description?: string;
  mode: LessonMode;
  duration_seconds: number;
}

export interface Lesson {
  title: string;
  description?: string;
  mode: LessonMode;
  tempo: number;
  time_signature: string;
  key_signature: string;
  total_beats: number;
  total_seconds: number;
  measures: Measure[];
}

export interface Measure {
  number: number;
  notes: Note[];
}

export type Note = SingleNote | ChordNote | RestNote;

export interface SingleNote {
  midi: number;
  duration: number;
  hand: string;
  accidental?: string;
}

export interface ChordNote {
  midi: number[];
  duration: number;
  hand: string;
  chord?: string;
}

export interface RestNote {
  duration: number;
}

export type LessonMode =
  | 'study_left_hand_no_timing'
  | 'study_right_hand_no_timing'
  | 'study_two_hands_no_timing'
  | 'play_left_hand_timing'
  | 'play_right_hand_timing'
  | 'play_two_hands_timing';

/**
 * Backend Client Interface
 * All backend communication should go through this interface
 */
export interface BackendClient {
  // MIDI Commands
  listMidiDevices(): Promise<MidiDeviceInfo[]>;
  startMidiListening(deviceId: string): Promise<void>;
  stopMidiListening(): Promise<void>;
  isMidiConnected(): Promise<boolean>;

  // Lesson Commands
  listLessons(): Promise<LessonMetadata[]>;
  loadLesson(lessonId: string): Promise<Lesson>;

  // Event Listeners (returns cleanup function)
  onMidiChordDetected(callback: (chord: MidiChord) => void): () => void;
  onMidiNoteOff(callback: (midi: number) => void): () => void;
}

/**
 * Injection Token for BackendClient
 * Use this token for dependency injection instead of the interface
 */
export const BACKEND_CLIENT = new InjectionToken<BackendClient>('BackendClient');

/**
 * Backend Client Error
 * Standardized error type for backend operations
 */
export class BackendClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BackendClientError';
  }
}
