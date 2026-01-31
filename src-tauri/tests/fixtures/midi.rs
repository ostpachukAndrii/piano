// MIDI Test Fixtures
//
// Reusable MIDI event data for testing

use piano_tauri_backend::models::MidiEvent;
use std::time::{Duration, Instant};

/// Create a note-on event
pub fn note_on(midi: u8, velocity: u8) -> MidiEvent {
    MidiEvent {
        timestamp: Instant::now(),
        midi,
        velocity,
        is_note_on: true,
    }
}

/// Create a note-off event
pub fn note_off(midi: u8) -> MidiEvent {
    MidiEvent {
        timestamp: Instant::now(),
        midi,
        velocity: 0,
        is_note_on: false,
    }
}

/// Create an old note-on event (for testing timeout)
pub fn old_note_on(midi: u8, velocity: u8, age_ms: u64) -> MidiEvent {
    MidiEvent {
        timestamp: Instant::now() - Duration::from_millis(age_ms),
        midi,
        velocity,
        is_note_on: true,
    }
}

/// C major chord (60, 64, 67)
pub fn c_major_chord() -> Vec<MidiEvent> {
    vec![note_on(60, 100), note_on(64, 100), note_on(67, 100)]
}

/// F major chord (65, 69, 72)
pub fn f_major_chord() -> Vec<MidiEvent> {
    vec![note_on(65, 100), note_on(69, 100), note_on(72, 100)]
}

/// G major chord (67, 71, 74)
pub fn g_major_chord() -> Vec<MidiEvent> {
    vec![note_on(67, 100), note_on(71, 100), note_on(74, 100)]
}

/// C scale as individual note events
pub fn c_scale_events() -> Vec<MidiEvent> {
    vec![
        note_on(60, 100), // C
        note_on(62, 100), // D
        note_on(64, 100), // E
        note_on(65, 100), // F
        note_on(67, 100), // G
        note_on(69, 100), // A
        note_on(71, 100), // B
        note_on(72, 100), // C
    ]
}

/// Mixed note-on and note-off events
pub fn mixed_events() -> Vec<MidiEvent> {
    vec![
        note_on(60, 100),
        note_on(64, 100),
        note_off(60),
        note_on(67, 100),
        note_off(64),
        note_off(67),
    ]
}

/// Events with varying velocities
pub fn varying_velocity_events() -> Vec<MidiEvent> {
    vec![
        note_on(60, 50),   // Piano
        note_on(62, 80),   // Mezzo-forte
        note_on(64, 110),  // Forte
        note_on(65, 127),  // Fortissimo
    ]
}

/// Left hand chord (bass clef)
pub fn left_hand_chord() -> Vec<MidiEvent> {
    vec![
        note_on(36, 100), // C2
        note_on(40, 100), // E2
        note_on(43, 100), // G2
    ]
}

/// Right hand chord (treble clef)
pub fn right_hand_chord() -> Vec<MidiEvent> {
    vec![
        note_on(60, 100), // C4
        note_on(64, 100), // E4
        note_on(67, 100), // G4
    ]
}

/// Both hands playing different notes
pub fn two_hand_events() -> Vec<MidiEvent> {
    vec![
        note_on(48, 100), // C3 (left)
        note_on(60, 100), // C4 (right)
        note_on(52, 100), // E3 (left)
        note_on(64, 100), // E4 (right)
    ]
}

/// Old events that should trigger chord grouping
pub fn old_chord_events() -> Vec<MidiEvent> {
    vec![
        old_note_on(60, 100, 100),
        old_note_on(64, 100, 95),
        old_note_on(67, 100, 90),
    ]
}

/// Recent events that should NOT trigger grouping yet
pub fn recent_chord_events() -> Vec<MidiEvent> {
    vec![
        old_note_on(60, 100, 10),
        old_note_on(64, 100, 5),
        note_on(67, 100),
    ]
}
