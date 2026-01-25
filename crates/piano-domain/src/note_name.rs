//! Note naming systems
//! 
//! Different ways to represent note names for teaching.

use std::fmt;

/// Different notation systems for musical notes
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NoteName {
    /// Western notation: C, D, E, F, G, A, B
    Western,
    /// Solfege notation: Do, Re, Mi, Fa, Sol, La, Ti
    Solfege,
}

impl NoteName {
    /// Get all available naming systems
    pub fn all() -> &'static [NoteName] {
        &[NoteName::Western, NoteName::Solfege]
    }

    /// Get a human-readable display name for this system
    pub fn display_name(&self) -> &'static str {
        match self {
            NoteName::Western => "Western (C, D, E, F)",
            NoteName::Solfege => "Solfege (Do, Re, Mi, Fa)",
        }
    }

    /// Get the name of a note (0-11) in this system
    pub fn note_name(&self, note_class: u8) -> &'static str {
        let note_class = note_class % 12;
        match self {
            NoteName::Western => {
                const WESTERN: &[&str] = &[
                    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
                ];
                WESTERN[note_class as usize]
            }
            NoteName::Solfege => {
                const SOLFEGE: &[&str] = &[
                    "Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Ti",
                ];
                SOLFEGE[note_class as usize]
            }
        }
    }
}

impl fmt::Display for NoteName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.display_name())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_western_names() {
        let western = NoteName::Western;
        assert_eq!(western.note_name(0), "C");
        assert_eq!(western.note_name(2), "D");
        assert_eq!(western.note_name(4), "E");
    }

    #[test]
    fn test_solfege_names() {
        let solfege = NoteName::Solfege;
        assert_eq!(solfege.note_name(0), "Do");
        assert_eq!(solfege.note_name(2), "Re");
        assert_eq!(solfege.note_name(4), "Mi");
    }
}
