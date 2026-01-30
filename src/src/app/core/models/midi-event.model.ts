/**
 * MIDI event models for real-time keyboard input
 */

export interface MidiNoteOn {
    type: 'note_on';
    note: number;
    velocity: number;
    timestamp: number;
}

export interface MidiNoteOff {
    type: 'note_off';
    note: number;
    timestamp: number;
}

export interface MidiControlChange {
    type: 'control_change';
    controller: number;
    value: number;
    timestamp: number;
}

export type MidiEvent = MidiNoteOn | MidiNoteOff | MidiControlChange;

/**
 * A chord detected from MIDI input (grouped notes within 50ms window)
 * Matches Rust: src-tauri/src/models/midi_event.rs::MidiChord
 */
export interface MidiChord {
    notes: number[];       // MIDI note numbers in this chord
    hand: string;          // "left", "right", or "both"
    velocity: number;      // Average velocity
    timestamp_ms: number;  // Timestamp since MIDI listening started
}

export interface MidiDevice {
    id: string;
    name: string;
    is_connected: boolean;
}

/**
 * MIDI state for tracking active notes
 */
export interface MidiState {
    devices: MidiDevice[];
    selectedDevice: MidiDevice | null;
    activeNotes: Set<number>;
    connected: boolean;
}

/**
 * Convert MIDI note number to note name
 */
export function midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteName = noteNames[midi % 12];
    return `${noteName}${octave}`;
}
