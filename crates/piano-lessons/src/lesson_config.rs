//! Lesson configuration
//!
//! Data structure for lesson configuration as loaded from YAML files.

use serde::{Deserialize, Serialize};

/// Parse hand specification from string
fn parse_hand(hand_str: Option<&str>) -> Option<piano_domain::Hand> {
    hand_str.and_then(|s| match s.to_lowercase().as_str() {
        "left" | "l" | "lh" => Some(piano_domain::Hand::Left),
        "right" | "r" | "rh" => Some(piano_domain::Hand::Right),
        "both" | "b" => Some(piano_domain::Hand::Both),
        _ => None,
    })
}

/// Lesson configuration loaded from YAML files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LessonConfig {
    /// Lesson name
    pub name: String,
    /// Lesson description
    pub description: String,

    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub composer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub difficulty: Option<String>, // "beginner", "intermediate", "advanced"

    /// Musical metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tempo: Option<u16>, // BPM (beats per minute)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_signature: Option<String>, // "4/4", "3/4", etc.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_signature: Option<String>, // "C major", "G major", etc.

    /// Lesson content: either simple notes (backward compat) or measures
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub notes: Vec<u8>, // Backward compatibility: simple pitch numbers
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub measures: Vec<Measure>, // New format with measures
}

/// A musical measure containing multiple note events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Measure {
    pub number: u32,
    pub notes: Vec<NoteEvent>,
}

/// A note event - can be a single note, chord, chord reference, or rest
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NoteEvent {
    /// Single note with pitch and duration
    SingleNote {
        pitch: u8,
        duration: f32,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        dynamic: Option<String>, // "forte", "piano", "mezzo-forte"
    },
    /// Chord reference - references a chord from the top-level chords array
    ChordReference {
        chord: String, // Name of the chord to reference
        duration: f32,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        dynamic: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        hand: Option<String>, // "left", "right", "both"
    },
    /// Chord - multiple pitches played together (inline definition)
    Chord {
        pitches: Vec<u8>,
        name: String, // "C major", "F minor", etc.
        duration: f32,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        dynamic: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        hand: Option<String>, // "left", "right", "both"
    },
    /// Rest - silence
    Rest { rest: bool, duration: f32 },
}

impl LessonConfig {
    /// Create a new lesson configuration (simple format)
    pub fn new(name: String, description: String, notes: Vec<u8>) -> Self {
        LessonConfig {
            name,
            description,
            composer: None,
            difficulty: None,
            tempo: None,
            time_signature: None,
            key_signature: None,
            notes,
            measures: Vec::new(),
        }
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.name.is_empty() {
            return Err("Lesson name cannot be empty".to_string());
        }
        // Accept either old format (notes) or new format (measures)
        if self.notes.is_empty() && self.measures.is_empty() {
            return Err("Lesson must have at least one note or measure".to_string());
        }
        Ok(())
    }

    /// Get all note events from either format, preserving chord information
    pub fn get_all_note_events(&self) -> Vec<piano_domain::NoteEvent> {
        if !self.notes.is_empty() {
            // Backward compatibility: convert simple notes to NoteEvent::Single
            return self
                .notes
                .iter()
                .map(|&pitch| piano_domain::NoteEvent::single(pitch))
                .collect();
        }

        // Calculate duration converter: beats to milliseconds
        // Formula: ms = (beats / BPM) * 60000
        let tempo_bpm = self.tempo.unwrap_or(120) as f32; // Default to 120 BPM
        let beats_to_ms = |beats: f32| -> u64 {
            ((beats / tempo_bpm) * 60000.0) as u64
        };

        let mut events = Vec::new();
        for measure in &self.measures {
            for event in &measure.notes {
                match event {
                    NoteEvent::SingleNote { pitch, duration, .. } => {
                        let duration_ms = beats_to_ms(*duration);
                        events.push(piano_domain::NoteEvent::single_with_duration(*pitch, duration_ms));
                    }
                    NoteEvent::ChordReference { chord: chord_name, hand, duration, .. } => {
                        // Look up the chord from the standard library
                        if let Some(chord) = crate::chords::get_chord(chord_name) {
                            let hand_value = parse_hand(hand.as_deref());
                            let duration_ms = beats_to_ms(*duration);

                            if let Some(h) = hand_value {
                                events.push(piano_domain::NoteEvent::chord_with_hand_and_duration(
                                    chord.pitches.to_vec(),
                                    Some(chord.name.to_string()),
                                    h,
                                    duration_ms,
                                ));
                            } else {
                                events.push(piano_domain::NoteEvent::chord_with_duration(
                                    chord.pitches.to_vec(),
                                    Some(chord.name.to_string()),
                                    duration_ms,
                                ));
                            }
                        } else {
                            // Chord not found - could log a warning or skip
                            eprintln!("Warning: Chord '{}' not found in standard chord library", chord_name);
                        }
                    }
                    NoteEvent::Chord {
                        pitches: chord_pitches,
                        name,
                        hand,
                        duration,
                        ..
                    } => {
                        let hand_value = parse_hand(hand.as_deref());
                        let duration_ms = beats_to_ms(*duration);

                        if let Some(h) = hand_value {
                            events.push(piano_domain::NoteEvent::chord_with_hand_and_duration(
                                chord_pitches.clone(),
                                Some(name.clone()),
                                h,
                                duration_ms,
                            ));
                        } else {
                            events.push(piano_domain::NoteEvent::chord_with_duration(
                                chord_pitches.clone(),
                                Some(name.clone()),
                                duration_ms,
                            ));
                        }
                    }
                    NoteEvent::Rest { .. } => {} // Skip rests for now
                }
            }
        }
        events
    }

    /// Get all note pitches from either format (deprecated - use get_all_note_events)
    /// For new format with chords: extracts only the FIRST pitch from each event
    /// (Chords require special handling - not suitable for simple progression)
    pub fn get_all_pitches(&self) -> Vec<u8> {
        if !self.notes.is_empty() {
            return self.notes.clone();
        }

        let mut pitches = Vec::new();
        for measure in &self.measures {
            for event in &measure.notes {
                match event {
                    NoteEvent::SingleNote { pitch, .. } => pitches.push(*pitch),
                    NoteEvent::ChordReference { chord: chord_name, .. } => {
                        // Look up the chord from the standard library and take the first pitch
                        if let Some(chord) = crate::chords::get_chord(chord_name) {
                            if let Some(&first) = chord.pitches.first() {
                                pitches.push(first);
                            }
                        }
                    }
                    NoteEvent::Chord {
                        pitches: chord_pitches,
                        ..
                    } => {
                        // For chords, we take only the root note (first pitch)
                        // Chords should be handled specially in the UI/game loop
                        if let Some(&first) = chord_pitches.first() {
                            pitches.push(first);
                        }
                    }
                    NoteEvent::Rest { .. } => {} // Rests don't add notes
                }
            }
        }
        pitches
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_config() {
        let config = LessonConfig::new(
            "Test".to_string(),
            "A test lesson".to_string(),
            vec![60, 62, 64],
        );
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_invalid_empty_name() {
        let config = LessonConfig::new(
            "".to_string(),
            "A test lesson".to_string(),
            vec![60, 62, 64],
        );
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_invalid_empty_notes() {
        let config = LessonConfig::new("Test".to_string(), "A test lesson".to_string(), vec![]);
        assert!(config.validate().is_err());
    }
}
