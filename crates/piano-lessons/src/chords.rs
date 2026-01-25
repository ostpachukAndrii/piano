//! Standard chord library
//!
//! Defines common chord patterns that can be referenced in lesson files.

use std::collections::HashMap;
use once_cell::sync::Lazy;

/// A chord definition with name and MIDI pitches
#[derive(Debug, Clone)]
pub struct Chord {
    pub name: &'static str,
    pub pitches: &'static [u8],
}

/// Standard chord library - common chords in C major scale and beyond
static STANDARD_CHORDS: &[Chord] = &[
    // Major chords
    Chord {
        name: "C Major",
        pitches: &[60, 64, 67], // C-E-G
    },
    Chord {
        name: "D Major",
        pitches: &[62, 66, 69], // D-F#-A
    },
    Chord {
        name: "E Major",
        pitches: &[64, 68, 71], // E-G#-B
    },
    Chord {
        name: "F Major",
        pitches: &[65, 69, 72], // F-A-C
    },
    Chord {
        name: "G Major",
        pitches: &[67, 71, 74], // G-B-D
    },
    Chord {
        name: "A Major",
        pitches: &[69, 73, 76], // A-C#-E
    },
    Chord {
        name: "B Major",
        pitches: &[71, 75, 78], // B-D#-F#
    },
    // Minor chords
    Chord {
        name: "C Minor",
        pitches: &[60, 63, 67], // C-Eb-G
    },
    Chord {
        name: "D Minor",
        pitches: &[62, 65, 69], // D-F-A
    },
    Chord {
        name: "E Minor",
        pitches: &[64, 67, 71], // E-G-B
    },
    Chord {
        name: "F Minor",
        pitches: &[65, 68, 72], // F-Ab-C
    },
    Chord {
        name: "G Minor",
        pitches: &[67, 70, 74], // G-Bb-D
    },
    Chord {
        name: "A Minor",
        pitches: &[69, 72, 76], // A-C-E
    },
    Chord {
        name: "B Minor",
        pitches: &[71, 74, 78], // B-D-F#
    },
    // Seventh chords (common jazz/blues chords)
    Chord {
        name: "C7",
        pitches: &[60, 64, 67, 70], // C-E-G-Bb
    },
    Chord {
        name: "G7",
        pitches: &[67, 71, 74, 77], // G-B-D-F
    },
    Chord {
        name: "D7",
        pitches: &[62, 66, 69, 72], // D-F#-A-C
    },
    // Diminished chords
    Chord {
        name: "C Diminished",
        pitches: &[60, 63, 66], // C-Eb-Gb
    },
    Chord {
        name: "B Diminished",
        pitches: &[71, 74, 77], // B-D-F
    },
];

/// Lazy-initialized chord lookup map for fast access
static CHORD_MAP: Lazy<HashMap<&'static str, &'static Chord>> = Lazy::new(|| {
    STANDARD_CHORDS
        .iter()
        .map(|chord| (chord.name, chord))
        .collect()
});

/// Get a chord by name from the standard library
pub fn get_chord(name: &str) -> Option<&'static Chord> {
    CHORD_MAP.get(name).copied()
}

/// Get all available chord names
pub fn available_chords() -> Vec<&'static str> {
    STANDARD_CHORDS.iter().map(|c| c.name).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_chord() {
        let c_major = get_chord("C Major").unwrap();
        assert_eq!(c_major.name, "C Major");
        assert_eq!(c_major.pitches, &[60, 64, 67]);
    }

    #[test]
    fn test_get_nonexistent_chord() {
        assert!(get_chord("Z Major").is_none());
    }

    #[test]
    fn test_all_chords_available() {
        let chords = available_chords();
        assert!(chords.contains(&"C Major"));
        assert!(chords.contains(&"A Minor"));
        assert!(chords.contains(&"G7"));
    }
}
