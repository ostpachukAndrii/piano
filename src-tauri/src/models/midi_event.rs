// MIDI Event Model
// Raw MIDI input event from keyboard
// Used internally for chord grouping, then emitted to frontend as MidiChord

use serde::{Deserialize, Serialize};
use std::time::Instant;

/// Raw MIDI event from hardware
#[derive(Debug, Clone)]
pub struct MidiEvent {
    /// When the event occurred
    pub timestamp: Instant,
    /// MIDI note number (0-127)
    pub midi: u8,
    /// Velocity (0-127), 0 means note off
    pub velocity: u8,
    /// True for Note On, False for Note Off
    pub is_note_on: bool,
}

impl MidiEvent {
    /// Create a Note On event
    pub fn note_on(midi: u8, velocity: u8) -> Self {
        Self {
            timestamp: Instant::now(),
            midi,
            velocity,
            is_note_on: true,
        }
    }

    /// Create a Note Off event
    pub fn note_off(midi: u8) -> Self {
        Self {
            timestamp: Instant::now(),
            midi,
            velocity: 0,
            is_note_on: false,
        }
    }
}

/// A grouped chord (notes played within 50ms window)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MidiChord {
    /// MIDI note numbers in this chord
    pub notes: Vec<u8>,
    /// Which hand this belongs to ("left", "right", or "both")
    pub hand: String,
    /// Average velocity
    pub velocity: u8,
    /// Timestamp in milliseconds since MIDI listening started
    pub timestamp_ms: u64,
}

impl MidiChord {
    /// Create a new chord from note events
    pub fn from_events(events: &[MidiEvent], start_time: Instant) -> Self {
        let notes: Vec<u8> = events.iter().map(|e| e.midi).collect();
        let avg_velocity = if events.is_empty() {
            0
        } else {
            (events.iter().map(|e| e.velocity as u32).sum::<u32>() / events.len() as u32) as u8
        };

        // Determine hand based on split point (MIDI 60 = Middle C)
        let hand = Self::determine_hand(&notes);

        // Calculate timestamp
        let timestamp_ms = events
            .first()
            .map(|e| e.timestamp.duration_since(start_time).as_millis() as u64)
            .unwrap_or(0);

        Self {
            notes,
            hand,
            velocity: avg_velocity,
            timestamp_ms,
        }
    }

    /// Determine hand assignment based on note positions
    /// Split point from configuration (default: MIDI 60 = Middle C)
    /// - All notes < split_point → left hand
    /// - All notes >= split_point → right hand
    /// - Mixed → both hands
    fn determine_hand(notes: &[u8]) -> String {
        if notes.is_empty() {
            return "right".to_string();
        }

        let split_point = crate::config::get_config().midi.hand_split_point;
        let has_left = notes.iter().any(|&n| n < split_point);
        let has_right = notes.iter().any(|&n| n >= split_point);

        match (has_left, has_right) {
            (true, false) => "left".to_string(),
            (false, true) => "right".to_string(),
            (true, true) => "both".to_string(),
            (false, false) => "right".to_string(),
        }
    }
}

/// MIDI device info for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MidiDeviceInfo {
    /// Unique device ID (port index)
    pub id: String,
    /// Human-readable device name
    pub name: String,
    /// Whether this device is currently connected
    pub is_connected: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hand_determination_right() {
        let hand = MidiChord::determine_hand(&[60, 64, 67]); // C4, E4, G4
        assert_eq!(hand, "right");
    }

    #[test]
    fn test_hand_determination_left() {
        let hand = MidiChord::determine_hand(&[48, 52, 55]); // C3, E3, G3
        assert_eq!(hand, "left");
    }

    #[test]
    fn test_hand_determination_both() {
        let hand = MidiChord::determine_hand(&[48, 60]); // C3 (left) + C4 (right)
        assert_eq!(hand, "both");
    }
}
