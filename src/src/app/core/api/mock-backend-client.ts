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
  BluetoothDeviceInfo,
  BluetoothStatus,
  Lesson,
  LessonMetadata,
  MidiChord,
  MidiDeviceInfo,
} from './backend-client.interface';

export class MockBackendClient implements BackendClient {
  private midiConnected = false;
  private bluetoothConnected = false;
  private bluetoothStatus: BluetoothStatus = 'Disconnected';
  private chordCallbacks: Array<(chord: MidiChord) => void> = [];
  private noteOffCallbacks: Array<(midi: number) => void> = [];
  private bluetoothStatusCallbacks: Array<(status: BluetoothStatus) => void> = [];

  // Mock MIDI Devices
  private mockDevices: MidiDeviceInfo[] = [
    { id: '1', name: 'Mock Piano Keyboard', is_connected: false },
    { id: '2', name: 'Mock MIDI Controller', is_connected: false },
  ];

  // Mock Bluetooth Devices
  private mockBluetoothDevices: BluetoothDeviceInfo[] = [
    { id: 'bt-1', name: 'Mock Bluetooth Piano', is_midi_device: true, rssi: -50 },
    { id: 'bt-2', name: 'Mock BT Headphones', is_midi_device: false, rssi: -65 },
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
    // Validate device ID exists in mock devices
    const device = this.mockDevices.find(d => d.id === deviceId);
    if (!device) {
      return Promise.reject(new Error(`Device not found: ${deviceId}`));
    }
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

  // Bluetooth MIDI Commands

  async initBluetooth(): Promise<void> {
    console.log('[Mock] Bluetooth initialized');
    return Promise.resolve();
  }

  async scanBluetoothDevices(timeoutSecs?: number): Promise<BluetoothDeviceInfo[]> {
    console.log(`[Mock] Scanning Bluetooth devices for ${timeoutSecs ?? 5} seconds`);
    this.bluetoothStatus = 'Scanning';
    this.bluetoothStatusCallbacks.forEach(cb => cb(this.bluetoothStatus));

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 500));

    this.bluetoothStatus = 'Disconnected';
    this.bluetoothStatusCallbacks.forEach(cb => cb(this.bluetoothStatus));

    return Promise.resolve([...this.mockBluetoothDevices]);
  }

  async connectBluetoothMidi(deviceId: string): Promise<void> {
    const device = this.mockBluetoothDevices.find(d => d.id === deviceId);
    if (!device) {
      return Promise.reject(new Error(`Bluetooth device not found: ${deviceId}`));
    }
    if (!device.is_midi_device) {
      return Promise.reject(new Error(`Device ${deviceId} is not a MIDI device`));
    }

    this.bluetoothStatus = 'Connecting';
    this.bluetoothStatusCallbacks.forEach(cb => cb(this.bluetoothStatus));

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 300));

    this.bluetoothConnected = true;
    this.bluetoothStatus = 'Connected';
    this.bluetoothStatusCallbacks.forEach(cb => cb(this.bluetoothStatus));

    console.log(`[Mock] Connected to Bluetooth device: ${deviceId}`);
    return Promise.resolve();
  }

  async disconnectBluetooth(): Promise<void> {
    this.bluetoothConnected = false;
    this.bluetoothStatus = 'Disconnected';
    this.bluetoothStatusCallbacks.forEach(cb => cb(this.bluetoothStatus));
    console.log('[Mock] Disconnected from Bluetooth');
    return Promise.resolve();
  }

  async getBluetoothStatus(): Promise<BluetoothStatus> {
    return Promise.resolve(this.bluetoothStatus);
  }

  async isBluetoothConnected(): Promise<boolean> {
    return Promise.resolve(this.bluetoothConnected);
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

  onBluetoothStatusChanged(callback: (status: BluetoothStatus) => void): () => void {
    this.bluetoothStatusCallbacks.push(callback);
    return () => {
      const index = this.bluetoothStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.bluetoothStatusCallbacks.splice(index, 1);
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
    this.bluetoothConnected = false;
    this.bluetoothStatus = 'Disconnected';
    this.chordCallbacks = [];
    this.noteOffCallbacks = [];
    this.bluetoothStatusCallbacks = [];
    this.mockLessons = [];
    this.mockDevices = [
      { id: '1', name: 'Mock Piano Keyboard', is_connected: false },
      { id: '2', name: 'Mock MIDI Controller', is_connected: false },
    ];
    this.mockBluetoothDevices = [
      { id: 'bt-1', name: 'Mock Bluetooth Piano', is_midi_device: true, rssi: -50 },
      { id: 'bt-2', name: 'Mock BT Headphones', is_midi_device: false, rssi: -65 },
    ];
  }
}
