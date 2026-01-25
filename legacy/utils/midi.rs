/// Convert MIDI note number to musical note name
pub fn midi_note_to_name(note: u8) -> String {
    let notes = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    let octave = (note / 12) as i8 - 1;
    let note_name = notes[(note % 12) as usize];
    format!("{}{}", note_name, octave)
}
