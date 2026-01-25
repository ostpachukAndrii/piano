use crate::midi::{MidiEvent, MidiEventHandler, MidiSource};
use midir::MidiInput;
use std::error::Error;
use std::sync::Arc;

/// USB MIDI source implementation
pub struct UsbMidiSource;

impl UsbMidiSource {
    pub fn new() -> Self {
        UsbMidiSource
    }
}

impl MidiSource for UsbMidiSource {
    fn list_inputs(&self) -> Result<Vec<String>, Box<dyn Error>> {
        let midi_input = MidiInput::new("MIDI Input")?;
        let ports = midi_input.ports();
        let mut port_names = Vec::new();

        for port in ports.iter() {
            let name = midi_input.port_name(port)?;
            port_names.push(name);
        }

        Ok(port_names)
    }

    fn connect(
        &self,
        port_index: usize,
        handler: Box<dyn MidiEventHandler>,
    ) -> Result<String, Box<dyn Error>> {
        let midi_input = MidiInput::new("MIDI Input")?;
        let ports = midi_input.ports();

        if port_index >= ports.len() {
            return Err("Invalid port index".into());
        }

        let port = &ports[port_index];
        let port_name = midi_input.port_name(port)?;

        let handler = Arc::new(handler);

        let _conn_in = midi_input.connect(
            port,
            "Piano Input",
            move |_stamp, message, _| {
                if let Some(event) = Self::parse_message(message) {
                    handler.handle_event(event);
                }
            },
            (),
        )?;

        // Keep connection alive
        std::mem::forget(_conn_in);

        Ok(port_name)
    }
}

impl UsbMidiSource {
    fn parse_message(message: &[u8]) -> Option<MidiEvent> {
        if message.is_empty() {
            return None;
        }

        let status = message[0] & 0xF0;

        match status {
            0x90 => {
                // Note On
                if message.len() >= 3 {
                    let note = message[1];
                    let velocity = message[2];
                    if velocity > 0 {
                        return Some(MidiEvent::NoteOn { note, velocity });
                    }
                }
                None
            }
            0x80 => {
                // Note Off
                if message.len() >= 3 {
                    let note = message[1];
                    return Some(MidiEvent::NoteOff { note });
                }
                None
            }
            0xB0 => {
                // Control Change
                if message.len() >= 3 {
                    let controller = message[1];
                    let value = message[2];
                    return Some(MidiEvent::ControlChange { controller, value });
                }
                None
            }
            0xE0 => {
                // Pitch Bend
                if message.len() >= 3 {
                    let lsb = message[1] as u16;
                    let msb = message[2] as u16;
                    let pitch_value = ((msb << 7) | lsb) as i16 - 8192;
                    return Some(MidiEvent::PitchBend { value: pitch_value });
                }
                None
            }
            _ => Some(MidiEvent::Other(message.to_vec())),
        }
    }
}
