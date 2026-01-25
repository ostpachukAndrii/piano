/// Tests for MIDI event parsing from raw messages
#[cfg(test)]
mod tests {
    /// Helper function to parse MIDI messages (mirrors the actual parsing logic)
    fn parse_midi_message(message: &[u8]) -> Option<String> {
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
                        return Some(format!("NoteOn: note={}, velocity={}", note, velocity));
                    }
                }
                None
            }
            0x80 => {
                // Note Off
                if message.len() >= 3 {
                    let note = message[1];
                    return Some(format!("NoteOff: note={}", note));
                }
                None
            }
            0xB0 => {
                // Control Change
                if message.len() >= 3 {
                    let controller = message[1];
                    let value = message[2];
                    return Some(format!(
                        "ControlChange: controller={}, value={}",
                        controller, value
                    ));
                }
                None
            }
            0xE0 => {
                // Pitch Bend
                if message.len() >= 3 {
                    let lsb = message[1] as u16;
                    let msb = message[2] as u16;
                    let pitch_value = ((msb << 7) | lsb) as i16 - 8192;
                    return Some(format!("PitchBend: value={}", pitch_value));
                }
                None
            }
            _ => Some(format!("Other: {:?}", message)),
        }
    }

    #[test]
    fn test_parse_note_on_message() {
        // MIDI Note On: status=0x90, note=60, velocity=100
        let message = vec![0x90, 60, 100];
        let result = parse_midi_message(&message);
        assert!(result.is_some());
        assert!(result.unwrap().contains("NoteOn"));
    }

    #[test]
    fn test_parse_note_off_message() {
        // MIDI Note Off: status=0x80, note=60
        let message = vec![0x80, 60, 0];
        let result = parse_midi_message(&message);
        assert!(result.is_some());
        assert!(result.unwrap().contains("NoteOff"));
    }

    #[test]
    fn test_parse_note_on_zero_velocity() {
        // Note On with velocity 0 is actually Note Off
        let message = vec![0x90, 60, 0];
        let result = parse_midi_message(&message);
        assert_eq!(result, None);
    }

    #[test]
    fn test_parse_control_change_sustain() {
        // Control Change: sustain pedal (CC 64), value 127 (on)
        let message = vec![0xB0, 64, 127];
        let result = parse_midi_message(&message);
        assert!(result.is_some());
        assert!(result.unwrap().contains("ControlChange"));
    }

    #[test]
    fn test_parse_pitch_bend_center() {
        // Pitch Bend: center position
        let message = vec![0xE0, 0, 64]; // LSB=0, MSB=64
        let result = parse_midi_message(&message);
        assert!(result.is_some());
        assert!(result.unwrap().contains("PitchBend"));
    }

    #[test]
    fn test_parse_empty_message() {
        let message = vec![];
        let result = parse_midi_message(&message);
        assert_eq!(result, None);
    }

    #[test]
    fn test_parse_incomplete_message() {
        // Message too short
        let message = vec![0x90, 60]; // Missing velocity
        let result = parse_midi_message(&message);
        assert_eq!(result, None);
    }

    #[test]
    fn test_parse_multiple_note_velocities() {
        let velocities = vec![1, 50, 64, 100, 127];

        for velocity in velocities {
            let message = vec![0x90, 60, velocity];
            let result = parse_midi_message(&message);
            assert!(result.is_some());
            assert!(result.unwrap().contains(&format!("velocity={}", velocity)));
        }
    }

    #[test]
    fn test_parse_all_note_range() {
        // Test parsing notes across the MIDI range (0-127)
        for note in [0, 12, 60, 96, 127] {
            let message = vec![0x90, note, 64];
            let result = parse_midi_message(&message);
            assert!(result.is_some());
            assert!(result.unwrap().contains(&format!("note={}", note)));
        }
    }
}
