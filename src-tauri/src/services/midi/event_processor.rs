// Event Processor Service
// Single responsibility: Process MIDI events from the buffer and emit to frontend
//
// This service coordinates chord grouping and event emission
// It's designed to be called from a polling loop

use crate::models::{MidiChord, MidiEvent};
use crate::services::midi::ChordGrouper;
use std::sync::{Arc, Mutex};

/// Result of processing events from the buffer
#[derive(Debug, Clone)]
pub enum ProcessResult {
    /// No events to process
    NoEvents,
    /// Events present but not ready to group yet
    WaitingForWindow,
    /// Chord is ready to be emitted
    ChordReady(MidiChord),
    /// Note-off events to emit
    NoteOffsReady(Vec<u8>),
}

/// Service for processing MIDI event buffers
pub struct EventProcessor {
    grouper: ChordGrouper,
}

impl EventProcessor {
    /// Create a new event processor with specified chord window
    pub fn new(chord_window_ms: u64) -> Self {
        Self {
            grouper: ChordGrouper::new(chord_window_ms),
        }
    }

    /// Create an event processor using configuration
    pub fn from_config() -> Self {
        Self {
            grouper: ChordGrouper::from_config(),
        }
    }

    /// Process events from the shared buffer
    /// Returns what should be emitted to the frontend
    /// Clears the buffer if events were processed
    pub fn process_buffer(
        &self,
        event_buffer: &Arc<Mutex<Vec<MidiEvent>>>,
    ) -> Result<Vec<ProcessResult>, String> {
        let mut buffer = event_buffer
            .lock()
            .map_err(|_| "Failed to lock event buffer")?;

        if buffer.is_empty() {
            return Ok(vec![ProcessResult::NoEvents]);
        }

        let mut results = Vec::new();

        // Separate note-on and note-off events
        let (note_on_events, note_off_events) = ChordGrouper::separate_events(&buffer);

        // Emit note-off events immediately (no grouping needed)
        if !note_off_events.is_empty() {
            let note_offs: Vec<u8> = note_off_events.iter().map(|e| e.midi).collect();
            results.push(ProcessResult::NoteOffsReady(note_offs));
        }

        // Process note-on events with chord grouping
        if note_on_events.is_empty() {
            buffer.clear();
            return Ok(results);
        }

        // Check if oldest event is older than chord window
        if self.grouper.is_ready_to_group(&note_on_events) {
            // Group events into a chord
            let chord = self.grouper.group_events(&note_on_events);
            results.push(ProcessResult::ChordReady(chord));

            // Clear buffer after processing
            buffer.clear();
        } else {
            results.push(ProcessResult::WaitingForWindow);
        }

        Ok(results)
    }

    /// Get reference to the chord grouper
    pub fn grouper(&self) -> &ChordGrouper {
        &self.grouper
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_process_empty_buffer() {
        let processor = EventProcessor::new(50);
        let buffer = Arc::new(Mutex::new(Vec::new()));

        let results = processor.process_buffer(&buffer).unwrap();
        assert_eq!(results.len(), 1);
        matches!(results[0], ProcessResult::NoEvents);
    }

    #[test]
    fn test_process_note_offs() {
        let processor = EventProcessor::new(50);
        let events = vec![MidiEvent::note_off(60), MidiEvent::note_off(64)];
        let buffer = Arc::new(Mutex::new(events));

        let results = processor.process_buffer(&buffer).unwrap();
        assert_eq!(results.len(), 1);

        match &results[0] {
            ProcessResult::NoteOffsReady(notes) => {
                assert_eq!(notes.len(), 2);
                assert!(notes.contains(&60));
                assert!(notes.contains(&64));
            }
            _ => panic!("Expected NoteOffsReady"),
        }

        // Buffer should be cleared
        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_process_recent_note_on() {
        let processor = EventProcessor::new(50);
        let events = vec![MidiEvent::note_on(60, 100)];
        let buffer = Arc::new(Mutex::new(events));

        let results = processor.process_buffer(&buffer).unwrap();

        // Should be waiting for window since event is recent
        assert!(results
            .iter()
            .any(|r| matches!(r, ProcessResult::WaitingForWindow)));

        // Buffer should NOT be cleared
        assert!(!buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_process_old_note_on() {
        let processor = EventProcessor::new(50);
        let mut old_event = MidiEvent::note_on(60, 100);
        old_event.timestamp = std::time::Instant::now() - Duration::from_millis(100);
        let buffer = Arc::new(Mutex::new(vec![old_event]));

        let results = processor.process_buffer(&buffer).unwrap();

        // Should have a chord ready
        let has_chord = results
            .iter()
            .any(|r| matches!(r, ProcessResult::ChordReady(_)));
        assert!(has_chord);

        // Buffer should be cleared
        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_process_mixed_events() {
        let processor = EventProcessor::new(50);
        let mut old_note_on = MidiEvent::note_on(60, 100);
        old_note_on.timestamp = std::time::Instant::now() - Duration::from_millis(100);

        let events = vec![
            old_note_on,
            MidiEvent::note_off(64),
            MidiEvent::note_off(67),
        ];
        let buffer = Arc::new(Mutex::new(events));

        let results = processor.process_buffer(&buffer).unwrap();

        // Should have both note-offs and chord
        assert_eq!(results.len(), 2);

        let has_note_offs = results
            .iter()
            .any(|r| matches!(r, ProcessResult::NoteOffsReady(_)));
        let has_chord = results
            .iter()
            .any(|r| matches!(r, ProcessResult::ChordReady(_)));

        assert!(has_note_offs);
        assert!(has_chord);
    }
}
