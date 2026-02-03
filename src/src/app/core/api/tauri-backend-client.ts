/**
 * Tauri Backend Client Implementation
 *
 * Production implementation of BackendClient using Tauri commands.
 * This is the only file that should import from '@tauri-apps/api'
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  BackendClient,
  BackendClientError,
  Lesson,
  LessonMetadata,
  MidiChord,
  MidiDeviceInfo,
} from './backend-client.interface';

export class TauriBackendClient implements BackendClient {
  // MIDI Commands

  async listMidiDevices(): Promise<MidiDeviceInfo[]> {
    try {
      return await invoke<MidiDeviceInfo[]>('get_midi_devices');
    } catch (error) {
      throw new BackendClientError(
        'Failed to list MIDI devices',
        'MIDI_LIST_FAILED',
        error
      );
    }
  }

  async startMidiListening(deviceId: string): Promise<void> {
    try {
      // Tauri 2.0 uses camelCase in JS and converts to snake_case for Rust
      await invoke('start_midi_listening', { deviceId });
    } catch (error) {
      // Log the actual backend error for debugging
      console.error('[TauriBackendClient] MIDI start error:', error);
      throw new BackendClientError(
        `Failed to start MIDI listening: ${error}`,
        'MIDI_START_FAILED',
        error
      );
    }
  }

  async stopMidiListening(): Promise<void> {
    try {
      await invoke('stop_midi_listening');
    } catch (error) {
      throw new BackendClientError(
        'Failed to stop MIDI listening',
        'MIDI_STOP_FAILED',
        error
      );
    }
  }

  async isMidiConnected(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_midi_connected');
    } catch (error) {
      throw new BackendClientError(
        'Failed to check MIDI connection',
        'MIDI_CHECK_FAILED',
        error
      );
    }
  }

  // Lesson Commands

  async listLessons(): Promise<LessonMetadata[]> {
    try {
      return await invoke<LessonMetadata[]>('list_lessons');
    } catch (error) {
      throw new BackendClientError(
        'Failed to list lessons',
        'LESSON_LIST_FAILED',
        error
      );
    }
  }

  async loadLesson(lessonId: string): Promise<Lesson> {
    try {
      // Tauri 2.0 uses camelCase in JS and converts to snake_case for Rust
      return await invoke<Lesson>('load_lesson', { lessonId });
    } catch (error) {
      console.error('[TauriBackendClient] Lesson load error:', error);
      throw new BackendClientError(
        `Failed to load lesson: ${lessonId}: ${error}`,
        'LESSON_LOAD_FAILED',
        error
      );
    }
  }

  // Event Listeners

  onMidiChordDetected(callback: (chord: MidiChord) => void): () => void {
    let unlisten: UnlistenFn | undefined;

    // Set up the listener
    listen<MidiChord>('midi_chord_detected', (event) => {
      callback(event.payload);
    })
      .then((unlistenFn) => {
        unlisten = unlistenFn;
      })
      .catch((error) => {
        console.error('Failed to setup MIDI chord listener:', error);
      });

    // Return cleanup function
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }

  onMidiNoteOff(callback: (midi: number) => void): () => void {
    let unlisten: UnlistenFn | undefined;

    // Set up the listener
    listen<number>('midi_note_off', (event) => {
      callback(event.payload);
    })
      .then((unlistenFn) => {
        unlisten = unlistenFn;
      })
      .catch((error) => {
        console.error('Failed to setup MIDI note-off listener:', error);
      });

    // Return cleanup function
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }
}
