// MIDI Input Service
// Single responsibility: Listen to MIDI hardware via midir library
// Features:
//   - Connect to MIDI device
//   - Group notes into chords (50ms window)
//   - Separate left/right hand (split point at MIDI 60)
//   - Emit midi_chord_detected event to frontend

use crate::models::{MidiChord, MidiDeviceInfo, MidiEvent};
use midir::{MidiInput, MidiInputConnection};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Chord grouping window in milliseconds
const CHORD_WINDOW_MS: u64 = 50;

/// MIDI Input Service - manages connection and event processing
pub struct MidiInputService {
    /// Active connection (None if not connected)
    connection: Option<MidiInputConnection<()>>,
    /// Currently buffered events for chord grouping
    event_buffer: Arc<Mutex<Vec<MidiEvent>>>,
    /// Start time for timestamp calculations
    start_time: Instant,
    /// Callback for when a chord is detected
    on_chord_detected: Option<Box<dyn Fn(MidiChord) + Send + 'static>>,
}

impl MidiInputService {
    /// Create a new MIDI input service
    pub fn new() -> Self {
        Self {
            connection: None,
            event_buffer: Arc::new(Mutex::new(Vec::new())),
            start_time: Instant::now(),
            on_chord_detected: None,
        }
    }

    /// Get a clone of the event buffer for external processing
    pub fn get_event_buffer(&self) -> Arc<Mutex<Vec<MidiEvent>>> {
        Arc::clone(&self.event_buffer)
    }

    /// Set callback for chord detection
    pub fn set_chord_callback<F>(&mut self, callback: F)
    where
        F: Fn(MidiChord) + Send + 'static,
    {
        self.on_chord_detected = Some(Box::new(callback));
    }

    /// List available MIDI input devices
    pub fn list_devices() -> Result<Vec<MidiDeviceInfo>, String> {
        let midi_in = MidiInput::new("Piano Lesson App - Device List")
            .map_err(|e| format!("Failed to create MIDI input: {}", e))?;

        let ports = midi_in.ports();
        let devices: Vec<MidiDeviceInfo> = ports
            .iter()
            .enumerate()
            .map(|(idx, port)| {
                let name = midi_in
                    .port_name(port)
                    .unwrap_or_else(|_| format!("Unknown Device {}", idx));
                MidiDeviceInfo {
                    id: idx.to_string(),
                    name,
                    is_connected: false,
                }
            })
            .collect();

        Ok(devices)
    }

    /// Connect to a MIDI device by ID
    pub fn connect(&mut self, device_id: &str) -> Result<(), String> {
        // Disconnect existing connection
        self.disconnect();

        let midi_in = MidiInput::new("Piano Lesson App")
            .map_err(|e| format!("Failed to create MIDI input: {}", e))?;

        let ports = midi_in.ports();
        let port_idx: usize = device_id
            .parse()
            .map_err(|_| format!("Invalid device ID: {}", device_id))?;

        if port_idx >= ports.len() {
            return Err(format!(
                "Device ID {} not found. Available: 0-{}",
                device_id,
                ports.len().saturating_sub(1)
            ));
        }

        let port = &ports[port_idx];
        let port_name = midi_in
            .port_name(port)
            .unwrap_or_else(|_| "Unknown".to_string());

        // Create callback for MIDI events
        let event_buffer = Arc::clone(&self.event_buffer);

        let connection = midi_in
            .connect(
                port,
                "piano-lesson-input",
                move |_timestamp, message, _| {
                    // Parse MIDI message
                    if message.len() >= 3 {
                        let status = message[0] & 0xF0;
                        let midi_note = message[1];
                        let velocity = message[2];

                        let event = match status {
                            0x90 if velocity > 0 => Some(MidiEvent::note_on(midi_note, velocity)),
                            0x90 | 0x80 => Some(MidiEvent::note_off(midi_note)),
                            _ => None,
                        };

                        if let Some(evt) = event {
                            if let Ok(mut buffer) = event_buffer.lock() {
                                buffer.push(evt);
                            }
                        }
                    }
                },
                (),
            )
            .map_err(|e| format!("Failed to connect to {}: {}", port_name, e))?;

        self.connection = Some(connection);
        self.start_time = Instant::now();

        tracing::info!("Connected to MIDI device: {}", port_name);
        Ok(())
    }

    /// Disconnect from current MIDI device
    pub fn disconnect(&mut self) {
        if let Some(conn) = self.connection.take() {
            conn.close();
            tracing::info!("Disconnected from MIDI device");
        }
    }

    /// Check if currently connected
    pub fn is_connected(&self) -> bool {
        self.connection.is_some()
    }

    /// Process buffered events and emit chords
    /// Should be called periodically (e.g., every 10ms)
    pub fn process_events(&mut self) -> Vec<MidiChord> {
        let mut chords = Vec::new();

        if let Ok(mut buffer) = self.event_buffer.lock() {
            if buffer.is_empty() {
                return chords;
            }

            // Get only Note On events
            let note_on_events: Vec<MidiEvent> =
                buffer.iter().filter(|e| e.is_note_on).cloned().collect();

            if note_on_events.is_empty() {
                buffer.clear();
                return chords;
            }

            // Check if oldest event is older than chord window
            let oldest = note_on_events
                .first()
                .map(|e| e.timestamp)
                .unwrap_or_else(Instant::now);

            let elapsed = oldest.elapsed();

            if elapsed >= Duration::from_millis(CHORD_WINDOW_MS) {
                // Group events into a chord
                let chord = MidiChord::from_events(&note_on_events, self.start_time);
                chords.push(chord);

                // Clear buffer
                buffer.clear();
            }
        }

        // Notify callback for each chord
        if let Some(ref callback) = self.on_chord_detected {
            for chord in &chords {
                callback(chord.clone());
            }
        }

        chords
    }
}

impl Default for MidiInputService {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for MidiInputService {
    fn drop(&mut self) {
        self.disconnect();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_devices() {
        // This test will pass on any system (might return empty list)
        let result = MidiInputService::list_devices();
        assert!(result.is_ok());
    }

    #[test]
    fn test_new_service() {
        let service = MidiInputService::new();
        assert!(!service.is_connected());
    }
}
