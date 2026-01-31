/**
 * Mock Backend Client Implementation
 *
 * Mock implementation for testing without Tauri backend.
 * Useful for:
 * - Unit tests
 * - Storybook stories
 * - Development without running Tauri
 */

import {
  BackendClient,
  Lesson,
  LessonMetadata,
  MidiChord,
  MidiDeviceInfo,
} from './backend-client.interface';

export class MockBackendClient implements BackendClient {
  private midiConnected = false;
  private chordCallbacks: Array<(chord: MidiChord) => void> = [];
  private noteOffCallbacks: Array<(midi: number) => void> = [];

  // Mock MIDI Devices
  private mockDevices: MidiDeviceInfo[] = [
    { id: '1', name: 'Mock Piano Keyboard', is_connected: false },
    { id: '2', name: 'Mock MIDI Controller', is_connected: false },
  ];

  // Mock Lessons
  private mockLessons: LessonMetadata[] = [
    {
      id: 'ode-to-joy',
      title: 'Ode to Joy',
      description: 'Beethoven - Simple melody',
      mode: 'study_right_hand_no_timing',
      duration_seconds: 30,
    },
    {
      id: 'c-major-scale',
      title: 'C Major Scale',
      description: 'Basic scale exercise',
      mode: 'study_two_hands_no_timing',
      duration_seconds: 15,
    },
  ];

  // MIDI Commands

  async listMidiDevices(): Promise<MidiDeviceInfo[]> {
    return Promise.resolve([...this.mockDevices]);
  }

  async startMidiListening(deviceId: string): Promise<void> {
    this.midiConnected = true;
    console.log(`[Mock] Started listening to device: ${deviceId}`);
    return Promise.resolve();
  }

  async stopMidiListening(): Promise<void> {
    this.midiConnected = false;
    console.log('[Mock] Stopped listening to MIDI');
    return Promise.resolve();
  }

  async isMidiConnected(): Promise<boolean> {
    return Promise.resolve(this.midiConnected);
  }

  // Lesson Commands

  async listLessons(): Promise<LessonMetadata[]> {
    return Promise.resolve([...this.mockLessons]);
  }

  async loadLesson(lessonId: string): Promise<Lesson> {
    const metadata = this.mockLessons.find((l) => l.id === lessonId);
    if (!metadata) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    // Return a mock lesson
    return Promise.resolve({
      title: metadata.title,
      description: metadata.description,
      mode: metadata.mode,
      tempo: 120,
      time_signature: '4/4',
      key_signature: 'C major',
      total_beats: 16,
      total_seconds: metadata.duration_seconds,
      measures: [
        {
          number: 1,
          notes: [
            { midi: 60, duration: 1.0, hand: 'right' },
            { midi: 62, duration: 1.0, hand: 'right' },
            { midi: 64, duration: 1.0, hand: 'right' },
            { midi: 65, duration: 1.0, hand: 'right' },
          ],
        },
      ],
    });
  }

  // Event Listeners

  onMidiChordDetected(callback: (chord: MidiChord) => void): () => void {
    this.chordCallbacks.push(callback);
    return () => {
      const index = this.chordCallbacks.indexOf(callback);
      if (index > -1) {
        this.chordCallbacks.splice(index, 1);
      }
    };
  }

  onMidiNoteOff(callback: (midi: number) => void): () => void {
    this.noteOffCallbacks.push(callback);
    return () => {
      const index = this.noteOffCallbacks.indexOf(callback);
      if (index > -1) {
        this.noteOffCallbacks.splice(index, 1);
      }
    };
  }

  // Test Helpers (only available in mock)

  /**
   * Simulate a MIDI chord being played (for testing)
   */
  simulateChord(notes: number[], hand: 'left' | 'right' | 'both' = 'right') {
    const chord: MidiChord = {
      notes,
      hand,
      velocity: 100,
      timestamp_ms: Date.now(),
    };
    this.chordCallbacks.forEach((cb) => cb(chord));
  }

  /**
   * Simulate a note-off event (for testing)
   */
  simulateNoteOff(midi: number) {
    this.noteOffCallbacks.forEach((cb) => cb(midi));
  }

  /**
   * Add a mock lesson (for testing)
   */
  addMockLesson(lesson: LessonMetadata) {
    this.mockLessons.push(lesson);
  }

  /**
   * Clear all mock data (for test cleanup)
   */
  reset() {
    this.midiConnected = false;
    this.chordCallbacks = [];
    this.noteOffCallbacks = [];
    this.mockLessons = [];
    this.mockDevices = [
      { id: '1', name: 'Mock Piano Keyboard', is_connected: false },
      { id: '2', name: 'Mock MIDI Controller', is_connected: false },
    ];
  }
}
