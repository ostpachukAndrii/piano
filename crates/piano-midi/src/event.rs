//! MIDI Event types

/// MIDI events from keyboard/device
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MidiEvent {
    /// Note pressed (with velocity 0-127)
    NoteOn { note: u8, velocity: u8 },
    /// Note released
    NoteOff { note: u8 },
    /// Control change (e.g., modulation, sustain)
    ControlChange { controller: u8, value: u8 },
    /// Pitch bend
    PitchBend { value: u16 },
    /// Other MIDI message
    Other { status: u8, data: Vec<u8> },
}

impl MidiEvent {
    /// Parse raw MIDI bytes into an event
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        if bytes.is_empty() {
            return None;
        }

        let status = bytes[0];
        let msg_type = status & 0xF0;

        match msg_type {
            0x90 => {
                // Note On
                if bytes.len() >= 3 {
                    Some(MidiEvent::NoteOn {
                        note: bytes[1],
                        velocity: bytes[2],
                    })
                } else {
                    None
                }
            }
            0x80 => {
                // Note Off
                if bytes.len() >= 2 {
                    Some(MidiEvent::NoteOff { note: bytes[1] })
                } else {
                    None
                }
            }
            0xB0 => {
                // Control Change
                if bytes.len() >= 3 {
                    Some(MidiEvent::ControlChange {
                        controller: bytes[1],
                        value: bytes[2],
                    })
                } else {
                    None
                }
            }
            0xE0 => {
                // Pitch Bend
                if bytes.len() >= 3 {
                    let value = ((bytes[2] as u16) << 7) | (bytes[1] as u16);
                    Some(MidiEvent::PitchBend { value })
                } else {
                    None
                }
            }
            _ => Some(MidiEvent::Other {
                status,
                data: bytes[1..].to_vec(),
            }),
        }
    }

    /// Check if this is a note-on event
    pub fn is_note_on(&self) -> bool {
        matches!(self, MidiEvent::NoteOn { .. })
    }

    /// Get note number if this is a NoteOn event
    pub fn note_on(&self) -> Option<u8> {
        if let MidiEvent::NoteOn { note, velocity: _ } = self {
            Some(*note)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_note_on() {
        let bytes = [0x90, 0x3C, 0x64]; // Note On, middle C, velocity 100
        let event = MidiEvent::from_bytes(&bytes);
        assert_eq!(
            event,
            Some(MidiEvent::NoteOn {
                note: 0x3C,
                velocity: 0x64
            })
        );
    }

    #[test]
    fn test_parse_note_off() {
        let bytes = [0x80, 0x3C, 0x40]; // Note Off, middle C
        let event = MidiEvent::from_bytes(&bytes);
        assert_eq!(event, Some(MidiEvent::NoteOff { note: 0x3C }));
    }
}
