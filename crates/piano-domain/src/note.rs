//! Note value object
//!
//! Represents a single musical note with MIDI number and optional name.

use serde::{Deserialize, Serialize};

/// Hand specification for playing notes/chords
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Hand {
    /// Left hand (typically lower notes, bass clef)
    Left,
    /// Right hand (typically higher notes, treble clef)
    Right,
    /// Both hands together
    Both,
}

impl Hand {
    pub fn display_name(&self) -> &'static str {
        match self {
            Hand::Left => "LH",
            Hand::Right => "RH",
            Hand::Both => "Both",
        }
    }
}

/// A musical note identified by its MIDI number (0-127)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Note {
    /// MIDI note number (0-127), where 60 = C4 (Middle C)
    pub midi_number: u8,
}

/// A musical event that can be either a single note or a chord
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NoteEvent {
    /// A single note
    Single {
        note: Note,
        /// Expected duration in milliseconds (None = no duration requirement)
        duration_ms: Option<u64>,
    },
    /// A chord consisting of multiple notes
    Chord {
        notes: Vec<Note>,
        name: Option<String>,
        hand: Option<Hand>,
        /// Expected duration in milliseconds (None = no duration requirement)
        duration_ms: Option<u64>,
    },
}

impl NoteEvent {
    /// Create a single note event
    pub fn single(midi_number: u8) -> Self {
        NoteEvent::Single {
            note: Note::new(midi_number),
            duration_ms: None,
        }
    }

    /// Create a single note event with duration
    pub fn single_with_duration(midi_number: u8, duration_ms: u64) -> Self {
        NoteEvent::Single {
            note: Note::new(midi_number),
            duration_ms: Some(duration_ms),
        }
    }

    /// Create a chord event from MIDI numbers
    pub fn chord(midi_numbers: Vec<u8>, name: Option<String>) -> Self {
        NoteEvent::Chord {
            notes: midi_numbers.into_iter().map(Note::new).collect(),
            name,
            hand: None,
            duration_ms: None,
        }
    }

    /// Create a chord event with hand specification
    pub fn chord_with_hand(midi_numbers: Vec<u8>, name: Option<String>, hand: Hand) -> Self {
        NoteEvent::Chord {
            notes: midi_numbers.into_iter().map(Note::new).collect(),
            name,
            hand: Some(hand),
            duration_ms: None,
        }
    }

    /// Create a chord event with duration
    pub fn chord_with_duration(midi_numbers: Vec<u8>, name: Option<String>, duration_ms: u64) -> Self {
        NoteEvent::Chord {
            notes: midi_numbers.into_iter().map(Note::new).collect(),
            name,
            hand: None,
            duration_ms: Some(duration_ms),
        }
    }

    /// Create a chord event with hand and duration
    pub fn chord_with_hand_and_duration(
        midi_numbers: Vec<u8>,
        name: Option<String>,
        hand: Hand,
        duration_ms: u64,
    ) -> Self {
        NoteEvent::Chord {
            notes: midi_numbers.into_iter().map(Note::new).collect(),
            name,
            hand: Some(hand),
            duration_ms: Some(duration_ms),
        }
    }

    /// Get the expected duration in milliseconds
    pub fn duration_ms(&self) -> Option<u64> {
        match self {
            NoteEvent::Single { duration_ms, .. } => *duration_ms,
            NoteEvent::Chord { duration_ms, .. } => *duration_ms,
        }
    }

    /// Get the hand specification for this event
    pub fn hand(&self) -> Option<Hand> {
        match self {
            NoteEvent::Single { .. } => None,
            NoteEvent::Chord { hand, .. } => *hand,
        }
    }

    /// Check if this event is a chord
    pub fn is_chord(&self) -> bool {
        matches!(self, NoteEvent::Chord { .. })
    }

    /// Get all notes in this event (single note returns vec of one)
    pub fn notes(&self) -> Vec<Note> {
        match self {
            NoteEvent::Single { note, .. } => vec![*note],
            NoteEvent::Chord { notes, .. } => notes.clone(),
        }
    }

    /// Get the MIDI numbers for all notes in this event
    pub fn midi_numbers(&self) -> Vec<u8> {
        self.notes().iter().map(|n| n.midi_number).collect()
    }

    /// Get the display name for this event
    pub fn display_name(&self) -> String {
        match self {
            NoteEvent::Single { note, duration_ms } => {
                let duration_suffix = if let Some(dur) = duration_ms {
                    format!(" ({}ms)", dur)
                } else {
                    String::new()
                };
                format!("{}{}{}", note.western_name(), note.octave(), duration_suffix)
            }
            NoteEvent::Chord { notes, name, hand, duration_ms } => {
                let hand_prefix = if let Some(h) = hand {
                    format!("[{}] ", h.display_name())
                } else {
                    String::new()
                };

                let duration_suffix = if let Some(dur) = duration_ms {
                    format!(" ({}ms)", dur)
                } else {
                    String::new()
                };

                if let Some(chord_name) = name {
                    format!("{}{}{}", hand_prefix, chord_name, duration_suffix)
                } else {
                    // Generate a name from the notes
                    let note_names: Vec<String> = notes
                        .iter()
                        .map(|n| format!("{}{}", n.western_name(), n.octave()))
                        .collect();
                    format!("{}Chord [{}]{}", hand_prefix, note_names.join(", "), duration_suffix)
                }
            }
        }
    }

    /// Get a detailed display name with note descriptions
    /// For chords, this shows the chord name followed by the individual notes
    pub fn display_name_detailed(&self, note_name: &crate::NoteName) -> String {
        match self {
            NoteEvent::Single { note, duration_ms } => {
                let name = note_name.note_name(note.midi_number % 12);
                let duration_suffix = if let Some(dur) = duration_ms {
                    format!(" ({}ms)", dur)
                } else {
                    String::new()
                };
                format!("{}{}{}", name, note.octave(), duration_suffix)
            }
            NoteEvent::Chord { notes, name: chord_name, hand, duration_ms } => {
                let note_names: Vec<String> = notes
                    .iter()
                    .map(|n| {
                        let name = note_name.note_name(n.midi_number % 12);
                        format!("{}", name)
                    })
                    .collect();

                let hand_prefix = if let Some(h) = hand {
                    format!("[{}] ", h.display_name())
                } else {
                    String::new()
                };

                let duration_suffix = if let Some(dur) = duration_ms {
                    format!(" ({}ms)", dur)
                } else {
                    String::new()
                };

                if let Some(chord_name) = chord_name {
                    format!("{}{} [{}]{}", hand_prefix, chord_name, note_names.join("-"), duration_suffix)
                } else {
                    format!("{}Chord [{}]{}", hand_prefix, note_names.join("-"), duration_suffix)
                }
            }
        }
    }
}

impl Note {
    /// Create a new note from a MIDI number
    pub fn new(midi_number: u8) -> Self {
        Note { midi_number }
    }

    /// Get the note name in Western notation (C, D, E, F, G, A, B)
    pub fn western_name(&self) -> &'static str {
        const NOTES: &[&str] = &[
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
        ];
        NOTES[(self.midi_number % 12) as usize]
    }

    /// Get the note name in Solfege notation (Do, Re, Mi, Fa, Sol, La, Ti)
    pub fn solfege_name(&self) -> &'static str {
        const NOTES: &[&str] = &[
            "Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Ti",
        ];
        NOTES[(self.midi_number % 12) as usize]
    }

    /// Get the octave number (C4 = octave 4)
    pub fn octave(&self) -> u8 {
        self.midi_number / 12
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_middle_c() {
        let note = Note::new(60);
        assert_eq!(note.western_name(), "C");
        assert_eq!(note.solfege_name(), "Do");
        assert_eq!(note.octave(), 5);
    }

    #[test]
    fn test_note_names() {
        let note_d = Note::new(62);
        assert_eq!(note_d.western_name(), "D");
        assert_eq!(note_d.solfege_name(), "Re");
    }

    #[test]
    fn test_single_note_event() {
        let event = NoteEvent::single(60);
        assert!(!event.is_chord());
        assert_eq!(event.midi_numbers(), vec![60]);
        assert_eq!(event.display_name(), "C5");
        assert_eq!(event.duration_ms(), None);
    }

    #[test]
    fn test_single_note_event_with_duration() {
        let event = NoteEvent::single_with_duration(60, 500);
        assert!(!event.is_chord());
        assert_eq!(event.midi_numbers(), vec![60]);
        assert_eq!(event.display_name(), "C5 (500ms)");
        assert_eq!(event.duration_ms(), Some(500));
    }

    #[test]
    fn test_chord_event() {
        let event = NoteEvent::chord(vec![60, 64, 67], Some("C Major".to_string()));
        assert!(event.is_chord());
        assert_eq!(event.midi_numbers(), vec![60, 64, 67]);
        assert_eq!(event.display_name(), "C Major");
        assert_eq!(event.duration_ms(), None);
    }

    #[test]
    fn test_chord_event_without_name() {
        let event = NoteEvent::chord(vec![60, 64, 67], None);
        assert!(event.is_chord());
        assert_eq!(event.display_name(), "Chord [C5, E5, G5]");
    }

    #[test]
    fn test_chord_event_with_duration() {
        let event = NoteEvent::chord_with_duration(vec![60, 64, 67], Some("C Major".to_string()), 1000);
        assert!(event.is_chord());
        assert_eq!(event.midi_numbers(), vec![60, 64, 67]);
        assert_eq!(event.display_name(), "C Major (1000ms)");
        assert_eq!(event.duration_ms(), Some(1000));
    }

    #[test]
    fn test_display_name_detailed_single_note() {
        use crate::NoteName;

        let event = NoteEvent::single(60);
        assert_eq!(event.display_name_detailed(&NoteName::Western), "C5");
        assert_eq!(event.display_name_detailed(&NoteName::Solfege), "Do5");
    }

    #[test]
    fn test_display_name_detailed_chord() {
        use crate::NoteName;

        let event = NoteEvent::chord(vec![60, 64, 67], Some("C Major".to_string()));
        assert_eq!(event.display_name_detailed(&NoteName::Western), "C Major [C-E-G]");
        assert_eq!(event.display_name_detailed(&NoteName::Solfege), "C Major [Do-Mi-Sol]");
    }

    #[test]
    fn test_display_name_detailed_chord_without_name() {
        use crate::NoteName;

        let event = NoteEvent::chord(vec![60, 64, 67], None);
        assert_eq!(event.display_name_detailed(&NoteName::Western), "Chord [C-E-G]");
        assert_eq!(event.display_name_detailed(&NoteName::Solfege), "Chord [Do-Mi-Sol]");
    }
}
