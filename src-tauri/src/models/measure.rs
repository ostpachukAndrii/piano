use serde::{Deserialize, Serialize};

/// A measure (bar) containing notes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Measure {
    /// Measure number (starts at 1)
    pub number: u32,
    /// Notes and rests in this measure
    pub notes: Vec<Note>,
}

/// A note, chord, or rest
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Note {
    /// A single note
    Single {
        midi: u8,
        duration_beats: f32,
        #[serde(default = "default_hand")]
        hand: String, // "left" or "right"
        #[serde(default)]
        accidental: Option<String>, // "sharp", "flat", "natural"
    },
    /// Multiple notes sounding together (chord)
    Chord {
        midi_set: Vec<u8>,
        duration_beats: f32,
        #[serde(default = "default_hand")]
        hand: String,
        #[serde(default)]
        chord_name: Option<String>,
    },
    /// Silence/rest
    Rest { duration_beats: f32 },
}

fn default_hand() -> String {
    "right".to_string()
}

impl Note {
    /// Get the duration in beats for any note type
    pub fn duration_beats(&self) -> f32 {
        match self {
            Note::Single { duration_beats, .. } => *duration_beats,
            Note::Chord { duration_beats, .. } => *duration_beats,
            Note::Rest { duration_beats } => *duration_beats,
        }
    }

    /// Get the hand (left/right) if applicable
    pub fn hand(&self) -> Option<&str> {
        match self {
            Note::Single { hand, .. } => Some(hand),
            Note::Chord { hand, .. } => Some(hand),
            Note::Rest { .. } => None,
        }
    }

    /// Check if this is a rest
    pub fn is_rest(&self) -> bool {
        matches!(self, Note::Rest { .. })
    }

    /// Get MIDI notes (single note or chord members)
    pub fn midi_notes(&self) -> Vec<u8> {
        match self {
            Note::Single { midi, .. } => vec![*midi],
            Note::Chord { midi_set, .. } => midi_set.clone(),
            Note::Rest { .. } => vec![],
        }
    }
}

/// Global settings for a lesson
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalSettings {
    /// Tempo in BPM (beats per minute)
    pub tempo: u32,
    /// Time signature (e.g., "4/4", "3/4")
    pub time_signature: String,
    /// Key signature (e.g., "C major", "G major")
    pub key_signature: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_note_duration() {
        let note = Note::Single {
            midi: 60,
            duration_beats: 1.0,
            hand: "right".to_string(),
            accidental: None,
        };
        assert_eq!(note.duration_beats(), 1.0);
        assert!(!note.is_rest());
        assert_eq!(note.midi_notes(), vec![60]);
    }

    #[test]
    fn test_chord_duration() {
        let note = Note::Chord {
            midi_set: vec![60, 64, 67],
            duration_beats: 2.0,
            hand: "left".to_string(),
            chord_name: Some("C Major".to_string()),
        };
        assert_eq!(note.duration_beats(), 2.0);
        assert!(!note.is_rest());
        assert_eq!(note.midi_notes(), vec![60, 64, 67]);
        assert_eq!(note.hand(), Some("left"));
    }

    #[test]
    fn test_rest() {
        let note = Note::Rest {
            duration_beats: 1.0,
        };
        assert_eq!(note.duration_beats(), 1.0);
        assert!(note.is_rest());
        let empty_vec: Vec<u8> = vec![];
        assert_eq!(note.midi_notes(), empty_vec);
    }
}
