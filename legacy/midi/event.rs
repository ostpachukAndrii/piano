/// Represents a MIDI event from any source
#[derive(Debug, Clone)]
pub enum MidiEvent {
    NoteOn { note: u8, velocity: u8 },
    NoteOff { note: u8 },
    ControlChange { controller: u8, value: u8 },
    PitchBend { value: i16 },
    Other(Vec<u8>),
}

/// Trait for sources that provide MIDI events
pub trait MidiSource {
    /// List available MIDI inputs
    fn list_inputs(&self) -> Result<Vec<String>, Box<dyn std::error::Error>>;

    /// Connect to a MIDI input and stream events
    fn connect(
        &self,
        port_index: usize,
        handler: Box<dyn MidiEventHandler>,
    ) -> Result<String, Box<dyn std::error::Error>>;
}

/// Trait for handlers that consume MIDI events
pub trait MidiEventHandler: Send + Sync {
    /// Called when a MIDI event is received
    fn handle_event(&self, event: MidiEvent);
}
