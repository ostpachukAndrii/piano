use crate::midi::{MidiEvent, MidiEventHandler};
use crate::utils::midi_note_to_name;

/// Console MIDI event handler - displays events in the console
pub struct ConsoleHandler;

impl ConsoleHandler {
    pub fn new() -> Self {
        ConsoleHandler
    }
}

impl MidiEventHandler for ConsoleHandler {
    fn handle_event(&self, event: MidiEvent) {
        match event {
            MidiEvent::NoteOn { note, velocity } => {
                let note_name = midi_note_to_name(note);
                println!(
                    "🎹 Key Pressed: {} (MIDI Note: {}, Velocity: {})",
                    note_name, note, velocity
                );
            }
            MidiEvent::NoteOff { note } => {
                let note_name = midi_note_to_name(note);
                println!("🎹 Key Released: {} (MIDI Note: {})", note_name, note);
            }
            MidiEvent::ControlChange { controller, value } => {
                println!("🎚️  Control Change: CC {} = {}", controller, value);
            }
            MidiEvent::PitchBend { value } => {
                println!("🎵 Pitch Bend: {}", value);
            }
            MidiEvent::Other(msg) => {
                println!("MIDI Message: {:?}", msg);
            }
        }
    }
}
