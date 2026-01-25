// Frontend Note Model - Matches backend Note struct
use serde::{Deserialize, Serialize};

/// A single note
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SingleNote {
    pub midi: u8,
    pub duration: f32, // duration in beats (1.0 = quarter, 2.0 = half, 4.0 = whole)
    pub hand: String,  // "left" or "right"
    pub accidental: Option<String>, // "sharp", "flat", "natural"
}

/// Multiple notes (chord)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ChordNote {
    pub midi: Vec<u8>,
    pub duration: f32,
    pub hand: String,
    pub chord: Option<String>,
}

/// A rest
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RestNote {
    pub duration: f32,
}

/// Any note type
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Note {
    Single(SingleNote),
    Chord(ChordNote),
    Rest(RestNote),
}

impl Note {
    pub fn duration(&self) -> f32 {
        match self {
            Note::Single(n) => n.duration,
            Note::Chord(n) => n.duration,
            Note::Rest(n) => n.duration,
        }
    }

    pub fn is_rest(&self) -> bool {
        matches!(self, Note::Rest(_))
    }

    pub fn midi_numbers(&self) -> Vec<u8> {
        match self {
            Note::Single(n) => vec![n.midi],
            Note::Chord(n) => n.midi.clone(),
            Note::Rest(_) => vec![],
        }
    }

    pub fn hand(&self) -> Option<&str> {
        match self {
            Note::Single(n) => Some(&n.hand),
            Note::Chord(n) => Some(&n.hand),
            Note::Rest(_) => None,
        }
    }
}
