// Integration Tests - MIDI Services
//
// Tests the full flow of MIDI event processing

use piano_tauri_backend::services::{ChordGrouper, EventProcessor};
use std::sync::{Arc, Mutex};

#[path = "../fixtures/mod.rs"]
mod fixtures;
use fixtures::midi::*;

#[test]
fn test_chord_grouper_with_c_major() {
    let grouper = ChordGrouper::new(50);
    let events = old_chord_events(); // Old enough to group

    assert!(grouper.is_ready_to_group(&events));

    let chord = grouper.group_events(&events);
    assert_eq!(chord.notes, vec![60, 64, 67]);
    assert_eq!(chord.hand, "right");
}

#[test]
fn test_chord_grouper_left_hand() {
    let grouper = ChordGrouper::new(50);
    let events = left_hand_chord();

    let chord = grouper.group_events(&events);
    assert_eq!(chord.hand, "left");
}

#[test]
fn test_chord_grouper_two_hands() {
    let grouper = ChordGrouper::new(50);
    let events = two_hand_events();

    let chord = grouper.group_events(&events);
    assert_eq!(chord.hand, "both");
}

#[test]
fn test_chord_grouper_single_note() {
    let grouper = ChordGrouper::new(50);
    let events = vec![note_on(60, 100)];

    let chord = grouper.group_events(&events);
    assert_eq!(chord.notes.len(), 1);
    assert_eq!(chord.notes[0], 60);
}

#[test]
fn test_chord_grouper_varying_velocities() {
    let grouper = ChordGrouper::new(50);
    let events = varying_velocity_events();

    let chord = grouper.group_events(&events);
    // Average velocity: (50 + 80 + 110 + 127) / 4 = 91
    assert_eq!(chord.velocity, 91);
}

#[test]
fn test_separate_events() {
    let events = mixed_events();
    let (note_on, note_off) = ChordGrouper::separate_events(&events);

    assert_eq!(note_on.len(), 3);
    assert_eq!(note_off.len(), 3);
}

#[test]
fn test_event_processor_empty_buffer() {
    let processor = EventProcessor::new(50);
    let buffer = Arc::new(Mutex::new(Vec::new()));

    let results = processor.process_buffer(&buffer).unwrap();
    assert_eq!(results.len(), 1);
}

#[test]
fn test_event_processor_note_offs() {
    let processor = EventProcessor::new(50);
    let events = vec![note_off(60), note_off(64)];
    let buffer = Arc::new(Mutex::new(events));

    let results = processor.process_buffer(&buffer).unwrap();

    // Should have note-offs result
    let has_note_offs = results.iter().any(|r| {
        matches!(
            r,
            piano_tauri_backend::services::midi::ProcessResult::NoteOffsReady(_)
        )
    });
    assert!(has_note_offs);

    // Buffer should be cleared
    assert!(buffer.lock().unwrap().is_empty());
}

#[test]
fn test_event_processor_old_chord() {
    let processor = EventProcessor::new(50);
    let events = old_chord_events();
    let buffer = Arc::new(Mutex::new(events));

    let results = processor.process_buffer(&buffer).unwrap();

    // Should have chord ready
    let has_chord = results.iter().any(|r| {
        matches!(
            r,
            piano_tauri_backend::services::midi::ProcessResult::ChordReady(_)
        )
    });
    assert!(has_chord);

    // Buffer should be cleared
    assert!(buffer.lock().unwrap().is_empty());
}

#[test]
fn test_event_processor_recent_chord() {
    let processor = EventProcessor::new(50);
    let events = recent_chord_events();
    let buffer = Arc::new(Mutex::new(events));

    let results = processor.process_buffer(&buffer).unwrap();

    // Should be waiting for window
    let is_waiting = results.iter().any(|r| {
        matches!(
            r,
            piano_tauri_backend::services::midi::ProcessResult::WaitingForWindow
        )
    });
    assert!(is_waiting);

    // Buffer should NOT be cleared
    assert!(!buffer.lock().unwrap().is_empty());
}

#[test]
fn test_event_processor_mixed_events() {
    let processor = EventProcessor::new(50);
    let mut events = old_chord_events(); // Chords ready to process
    events.extend(vec![note_off(60), note_off(64)]); // Plus note-offs
    let buffer = Arc::new(Mutex::new(events));

    let results = processor.process_buffer(&buffer).unwrap();

    // Should have both chord and note-offs
    assert!(results.len() >= 2);
}

#[test]
fn test_chord_grouper_window_boundary() {
    let grouper = ChordGrouper::new(50);

    // Event exactly at 50ms boundary
    let events = vec![old_note_on(60, 100, 50)];
    assert!(grouper.is_ready_to_group(&events));

    // Event at 49ms (not ready yet)
    let events = vec![old_note_on(60, 100, 49)];
    assert!(!grouper.is_ready_to_group(&events));
}

#[test]
fn test_chord_grouper_empty_list() {
    let grouper = ChordGrouper::new(50);
    let events: Vec<_> = vec![];

    assert!(!grouper.is_ready_to_group(&events));
}

#[test]
fn test_c_scale_sequential_processing() {
    let processor = EventProcessor::new(50);
    let scale_events = c_scale_events();

    // Process each note individually
    for event in scale_events {
        let buffer = Arc::new(Mutex::new(vec![old_note_on(event.midi, 100, 100)]));
        let results = processor.process_buffer(&buffer).unwrap();

        // Each should produce a chord (single note chord)
        let has_chord = results.iter().any(|r| {
            matches!(
                r,
                piano_tauri_backend::services::midi::ProcessResult::ChordReady(_)
            )
        });
        assert!(has_chord);
    }
}
