// Configuration constants for the Piano Learning App

// MIDI Configuration
pub const MIDI_CHORD_GROUPING_MS: u64 = 50; // Group notes within 50ms into a chord
pub const MIDI_HAND_SPLIT_POINT: u8 = 60; // C4 - notes below go to left hand, above to right

// Timing tolerances for evaluation
pub const TIMING_PERFECT_MS: i32 = 50; // Perfect: ±50ms
pub const TIMING_GOOD_MS: i32 = 100; // Good: ±100ms
pub const TIMING_ACCEPTABLE_MS: i32 = 200; // Acceptable: ±200ms

// Duration tolerances
pub const DURATION_TOLERANCE_PERCENT: f32 = 20.0; // Allow ±20% variation

// Staff positions (Y coordinates)
pub const STAFF_LINE_HEIGHT: f32 = 10.0;
pub const STAFF_TOP_Y: f32 = 0.0;
pub const STAFF_BOTTOM_Y: f32 = 40.0;

// Treble staff note positions (E4-G4-B4-D5-F5 on lines, F4-A4-C5-E5 in spaces)
pub const TREBLE_MIN_MIDI: u8 = 60; // C4
pub const TREBLE_MAX_MIDI: u8 = 77; // F5

// Bass staff note positions (G2-B2-D3-F3-A3 on lines, A2-C3-E3-G3 in spaces)
pub const BASS_MIN_MIDI: u8 = 43; // G2
pub const BASS_MAX_MIDI: u8 = 60; // C4
