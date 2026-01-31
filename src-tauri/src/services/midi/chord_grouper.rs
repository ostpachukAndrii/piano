// Chord Grouper Service
// Single responsibility: Group MIDI note events into chords based on timing
//
// This service is testable and independent of Tauri framework
// It implements the chord grouping algorithm that was previously embedded
// in the MIDI command handler

use crate::models::{MidiChord, MidiEvent};
use std::time::{Duration, Instant};

/// Service for grouping MIDI events into chords
#[derive(Debug, Clone)]
pub struct ChordGrouper {
    /// Window duration for grouping notes into a chord (milliseconds)
    chord_window_ms: u64,
    /// Start time for timestamp calculations
    start_time: Instant,
}

impl ChordGrouper {
    /// Create a new chord grouper with specified window
    pub fn new(chord_window_ms: u64) -> Self {
        Self {
            chord_window_ms,
            start_time: Instant::now(),
        }
    }

    /// Create a chord grouper using configuration
    pub fn from_config() -> Self {
        let config = crate::config::get_config();
        Self::new(config.midi.chord_grouping_ms)
    }

    /// Check if a buffer of events is ready to be grouped into a chord
    /// Events are ready when the oldest event is older than the chord window
    pub fn is_ready_to_group(&self, events: &[MidiEvent]) -> bool {
        if events.is_empty() {
            return false;
        }

        let oldest = events
            .first()
            .map(|e| e.timestamp)
            .unwrap_or_else(Instant::now);

        oldest.elapsed() >= Duration::from_millis(self.chord_window_ms)
    }

    /// Group a buffer of note-on events into a chord
    /// Returns a MidiChord with all notes that occurred within the time window
    pub fn group_events(&self, events: &[MidiEvent]) -> MidiChord {
        MidiChord::from_events(events, self.start_time)
    }

    /// Separate note-on and note-off events from a buffer
    /// Returns (note_on_events, note_off_events)
    pub fn separate_events(events: &[MidiEvent]) -> (Vec<MidiEvent>, Vec<MidiEvent>) {
        let note_on_events: Vec<_> = events.iter().filter(|e| e.is_note_on).cloned().collect();
        let note_off_events: Vec<_> = events.iter().filter(|e| !e.is_note_on).cloned().collect();
        (note_on_events, note_off_events)
    }

    /// Get the chord window duration
    pub fn chord_window(&self) -> Duration {
        Duration::from_millis(self.chord_window_ms)
    }

    /// Reset the start time (used when restarting MIDI listening)
    pub fn reset_start_time(&mut self) {
        self.start_time = Instant::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_chord_grouper() {
        let grouper = ChordGrouper::new(50);
        assert_eq!(grouper.chord_window(), Duration::from_millis(50));
    }

    #[test]
    fn test_is_ready_to_group_empty() {
        let grouper = ChordGrouper::new(50);
        let events: Vec<MidiEvent> = vec![];
        assert!(!grouper.is_ready_to_group(&events));
    }

    #[test]
    fn test_is_ready_to_group_recent_event() {
        let grouper = ChordGrouper::new(50);
        let events = vec![MidiEvent::note_on(60, 100)];
        // Event just created, should not be ready
        assert!(!grouper.is_ready_to_group(&events));
    }

    #[test]
    fn test_is_ready_to_group_old_event() {
        let grouper = ChordGrouper::new(50);
        let mut old_event = MidiEvent::note_on(60, 100);
        // Simulate old timestamp by manually creating an old event
        old_event.timestamp = Instant::now() - Duration::from_millis(100);
        let events = vec![old_event];
        // Event is 100ms old, should be ready (window is 50ms)
        assert!(grouper.is_ready_to_group(&events));
    }

    #[test]
    fn test_separate_events() {
        let events = vec![
            MidiEvent::note_on(60, 100),
            MidiEvent::note_on(64, 100),
            MidiEvent::note_off(60),
            MidiEvent::note_on(67, 100),
            MidiEvent::note_off(64),
        ];

        let (note_on, note_off) = ChordGrouper::separate_events(&events);
        assert_eq!(note_on.len(), 3);
        assert_eq!(note_off.len(), 2);
    }

    #[test]
    fn test_group_events_single_note() {
        let grouper = ChordGrouper::new(50);
        let events = vec![MidiEvent::note_on(60, 100)];
        let chord = grouper.group_events(&events);

        assert_eq!(chord.notes, vec![60]);
        assert_eq!(chord.velocity, 100);
    }

    #[test]
    fn test_group_events_chord() {
        let grouper = ChordGrouper::new(50);
        let events = vec![
            MidiEvent::note_on(60, 100),
            MidiEvent::note_on(64, 100),
            MidiEvent::note_on(67, 100),
        ];
        let chord = grouper.group_events(&events);

        assert_eq!(chord.notes, vec![60, 64, 67]);
        assert_eq!(chord.hand, "right"); // All notes >= 60
        assert_eq!(chord.velocity, 100);
    }

    #[test]
    fn test_group_events_different_velocities() {
        let grouper = ChordGrouper::new(50);
        let events = vec![
            MidiEvent::note_on(60, 80),
            MidiEvent::note_on(64, 100),
            MidiEvent::note_on(67, 120),
        ];
        let chord = grouper.group_events(&events);

        // Average velocity: (80 + 100 + 120) / 3 = 100
        assert_eq!(chord.velocity, 100);
    }
}
