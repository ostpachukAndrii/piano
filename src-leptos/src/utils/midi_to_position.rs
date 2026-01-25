// MIDI to screen position conversion
// Convert MIDI notes to SVG Y positions on treble/bass staff
//
// Staff Layout (Y coordinates increase downward on screen):
// Y=40:  Line 5 (F5, MIDI 77)
// Y=50:  Space 4 (E5, MIDI 76)
// Y=60:  Line 4 (D5, MIDI 74)
// Y=70:  Space 3 (C5, MIDI 72)
// Y=80:  Line 3 (B4, MIDI 71)
// Y=90:  Space 2 (A4, MIDI 69)
// Y=100: Line 2 (G4, MIDI 67)
// Y=110: Space 1 (F4, MIDI 65)
// Y=120: Line 1 (E4, MIDI 64) - bottom staff line
// Y=130: Space below (D4, MIDI 62)
// Y=140: Ledger line (C4, MIDI 60) - Middle C
//
// Each staff LINE/SPACE = 10 pixels
// Lines are counted from BOTTOM (1) to TOP (5) per music notation

/// Staff line spacing in pixels
const LINE_SPACING: f32 = 10.0;

/// E4 (MIDI 64) is on Line 1 (bottom line) at Y=120
const E4_Y: f32 = 120.0;

/// Convert MIDI number to diatonic staff position (lines from bottom of treble staff)
/// Returns the number of staff steps from E4 (Line 1)
/// Uses the natural note positions (C, D, E, F, G, A, B pattern)
fn midi_to_staff_steps(midi: u8) -> i32 {
    // Natural note pattern within an octave: C(0), D(2), E(4), F(5), G(7), A(9), B(11)
    // Staff position within octave:          0,    1,    2,    3,    4,    5,    6
    let note_in_octave = midi % 12;
    let octave = (midi / 12) as i32;

    // Map semitone to diatonic position within octave
    // C=0→0, C#=1→0, D=2→1, D#=3→1, E=4→2, F=5→3, F#=6→3, G=7→4, G#=8→4, A=9→5, A#=10→5, B=11→6
    let diatonic_in_octave = match note_in_octave {
        0 | 1 => 0,  // C, C#
        2 | 3 => 1,  // D, D#
        4 => 2,      // E
        5 | 6 => 3,  // F, F#
        7 | 8 => 4,  // G, G#
        9 | 10 => 5, // A, A#
        11 => 6,     // B
        _ => 0,      // Should never happen
    };

    // E4 (MIDI 64) is our reference: octave 5, diatonic position 2
    // Calculate total diatonic position from C0
    let total_diatonic = octave * 7 + diatonic_in_octave;

    // E4 total diatonic position: octave 5 (64/12=5), diatonic 2 → 5*7 + 2 = 37
    let e4_total = 5 * 7 + 2; // = 37

    total_diatonic - e4_total
}

/// Convert MIDI number to SVG Y position on treble staff
/// E4 (MIDI 64) is on Line 1 (bottom) at Y=120
/// Higher notes → lower Y values (moving up visually on screen)
pub fn midi_to_y_treble(midi: u8) -> f32 {
    let steps_from_e4 = midi_to_staff_steps(midi);
    // Each step UP = 10 pixels UP on screen (decreasing Y)
    // E4 is at Y=120, so going up means subtracting
    E4_Y - (steps_from_e4 as f32 * LINE_SPACING)
}

/// G2 (MIDI 43) is on Line 1 (bottom) of bass staff at Y=120
const G2_Y: f32 = 120.0;

/// Convert MIDI number to SVG Y position on bass staff
/// G2 (MIDI 43) is on Line 1 (bottom) at Y=120
pub fn midi_to_y_bass(midi: u8) -> f32 {
    let steps_from_g2 = midi_to_bass_steps(midi);
    // Each step UP = 10 pixels UP on screen (decreasing Y)
    G2_Y - (steps_from_g2 as f32 * LINE_SPACING)
}

/// Convert MIDI to bass staff steps (from G2 on Line 1)
fn midi_to_bass_steps(midi: u8) -> i32 {
    let note_in_octave = midi % 12;
    let octave = (midi / 12) as i32;

    let diatonic_in_octave = match note_in_octave {
        0 | 1 => 0,  // C, C#
        2 | 3 => 1,  // D, D#
        4 => 2,      // E
        5 | 6 => 3,  // F, F#
        7 | 8 => 4,  // G, G#
        9 | 10 => 5, // A, A#
        11 => 6,     // B
        _ => 0,
    };

    let total_diatonic = octave * 7 + diatonic_in_octave;

    // G2 total diatonic position: octave 3 (43/12=3), diatonic 4 → 3*7 + 4 = 25
    let g2_total = 3 * 7 + 4; // = 25

    total_diatonic - g2_total
}

/// Convert MIDI number to Y position for either clef
pub fn midi_to_y(midi: u8, clef: &str) -> f32 {
    match clef {
        "bass" => midi_to_y_bass(midi),
        _ => midi_to_y_treble(midi), // default to treble
    }
}

/// Determine stem direction based on note position
/// Notes on or above Line 3 (B4): stem down
/// Notes below Line 3: stem up
pub fn stem_direction(midi: u8, clef: &str) -> &'static str {
    // B4 (MIDI 71) is on Line 3 - the middle line
    let middle_line_midi = match clef {
        "bass" => 50, // D3 on bass Line 3
        _ => 71,      // B4 on treble Line 3
    };

    if (midi as i32) >= (middle_line_midi as i32) {
        "down"
    } else {
        "up"
    }
}

/// Calculate horizontal offset for chord notes to prevent collision
///
/// When multiple notes are played together (chord), their noteheads need
/// to be offset horizontally to prevent overlap and maintain readability.
///
/// Formula:
/// - Unison (0 semitones): offset = 18px (different voices, same note)
/// - Secundal (1-2 semitones): offset = 12px (adjacent lines/spaces)
/// - Perfect intervals (3+ semitones): offset = 0px (stack vertically)
///
/// # Arguments
/// * `midi_1` - First MIDI note number
/// * `midi_2` - Second MIDI note number
/// * `note_index` - 0 for first note, 1+ for subsequent notes in chord
///
/// # Returns
/// Horizontal offset in pixels (positive = move right)
pub fn chord_x_offset(midi_1: u8, midi_2: u8, note_index: usize) -> f32 {
    // If this is the first note in the chord, no offset
    if note_index == 0 {
        return 0.0;
    }

    // Calculate semitone distance between notes
    let semitone_distance = (midi_1 as i32 - midi_2 as i32).abs() as u8;

    // Apply offset based on distance
    match semitone_distance {
        0 => 18.0,     // Unison: offset further to show both voices
        1 | 2 => 12.0, // Secundal: slight offset for adjacent notes
        _ => 0.0,      // Perfect interval: stack vertically (no offset)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test the C-D-E-F-G lesson notes per QUICK_REFERENCE_POSITIONS.md
    // | Note | MIDI | Y-Position |
    // | C4   | 60   | 140        |
    // | D4   | 62   | 130        |
    // | E4   | 64   | 120        |
    // | F4   | 65   | 110        |
    // | G4   | 67   | 100        |

    #[test]
    fn test_c4_middle_c() {
        // C4 (Middle C) is on ledger line below staff at Y=140
        let y = midi_to_y_treble(60);
        assert_eq!(y, 140.0);
    }

    #[test]
    fn test_d4() {
        // D4 is in space below Line 1 at Y=130
        let y = midi_to_y_treble(62);
        assert_eq!(y, 130.0);
    }

    #[test]
    fn test_e4_line_1() {
        // E4 is on Line 1 (bottom staff line) at Y=120
        let y = midi_to_y_treble(64);
        assert_eq!(y, 120.0);
    }

    #[test]
    fn test_f4() {
        // F4 is in Space 1 at Y=110
        let y = midi_to_y_treble(65);
        assert_eq!(y, 110.0);
    }

    #[test]
    fn test_g4_line_2() {
        // G4 is on Line 2 at Y=100
        let y = midi_to_y_treble(67);
        assert_eq!(y, 100.0);
    }

    #[test]
    fn test_b4_line_3() {
        // B4 is on Line 3 (middle line) at Y=80
        let y = midi_to_y_treble(71);
        assert_eq!(y, 80.0);
    }

    #[test]
    fn test_d5_line_4() {
        // D5 is on Line 4 at Y=60
        let y = midi_to_y_treble(74);
        assert_eq!(y, 60.0);
    }

    #[test]
    fn test_f5_line_5() {
        // F5 is on Line 5 (top staff line) at Y=40
        let y = midi_to_y_treble(77);
        assert_eq!(y, 40.0);
    }

    #[test]
    fn test_c5_space_3() {
        // C5 is in Space 3 at Y=70
        let y = midi_to_y_treble(72);
        assert_eq!(y, 70.0);
    }

    #[test]
    fn test_a4_space_2() {
        // A4 is in Space 2 at Y=90
        let y = midi_to_y_treble(69);
        assert_eq!(y, 90.0);
    }

    #[test]
    fn test_stem_direction_treble() {
        // Notes below B4 (Line 3): stem up
        assert_eq!(stem_direction(60, "treble"), "up"); // C4
        assert_eq!(stem_direction(64, "treble"), "up"); // E4
        assert_eq!(stem_direction(67, "treble"), "up"); // G4
        assert_eq!(stem_direction(69, "treble"), "up"); // A4
        assert_eq!(stem_direction(70, "treble"), "up"); // A#4/Bb4

        // Notes at or above B4 (Line 3): stem down
        assert_eq!(stem_direction(71, "treble"), "down"); // B4
        assert_eq!(stem_direction(72, "treble"), "down"); // C5
        assert_eq!(stem_direction(77, "treble"), "down"); // F5
    }

    #[test]
    fn test_chord_offset_unison() {
        // C4 played twice (unison) - should offset 18 pixels
        let offset = chord_x_offset(60, 60, 1); // note_index=1 means second voice
        assert_eq!(offset, 18.0);
    }

    #[test]
    fn test_chord_offset_secundal() {
        // C4 and D4 (2 semitones) - should offset 12 pixels
        let offset = chord_x_offset(60, 62, 1);
        assert_eq!(offset, 12.0);

        // C4 and B3 (1 semitone) - should offset 12 pixels
        let offset = chord_x_offset(60, 59, 1);
        assert_eq!(offset, 12.0);
    }

    #[test]
    fn test_chord_offset_perfect_interval() {
        // C4 and E4 (4 semitones, major third) - should not offset
        let offset = chord_x_offset(60, 64, 1);
        assert_eq!(offset, 0.0);

        // C4 and G4 (7 semitones, perfect fifth) - should not offset
        let offset = chord_x_offset(60, 67, 1);
        assert_eq!(offset, 0.0);
    }

    #[test]
    fn test_chord_offset_first_note() {
        // First note in chord always has no offset
        let offset = chord_x_offset(60, 62, 0);
        assert_eq!(offset, 0.0);

        // Even if it's a unison, first note is always at base position
        let offset = chord_x_offset(60, 60, 0);
        assert_eq!(offset, 0.0);
    }
}
