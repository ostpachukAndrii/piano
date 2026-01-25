// Note Naming
// Convert MIDI numbers to note names (C4, D#5, etc)
// Responsibility: Single function - MIDI number → note name

// TODO: Implement note naming
// - midi_to_note_name: u8 -> String (60 -> "C4")
// - note_name_to_midi: String -> u8 ("C4" -> 60)
// Reference:
//   MIDI 60 = C4 (Middle C)
//   Each semitone = ±1 MIDI number
//   Octave changes at C (not between notes)
