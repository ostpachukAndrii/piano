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
        tracing::info!("=== LIST MIDI DEVICES START ===");

        tracing::info!("Creating MIDI input instance...");
        let midi_in = MidiInput::new("Piano Lesson App - Device List")
            .map_err(|e| {
                tracing::error!("Failed to create MIDI input: {}", e);
                format!("Failed to create MIDI input: {}", e)
            })?;
        tracing::info!("MIDI input instance created successfully");

        tracing::info!("Getting available ports...");
        let ports = midi_in.ports();
        tracing::info!("Found {} MIDI input ports", ports.len());

        let devices: Vec<MidiDeviceInfo> = ports
            .iter()
            .enumerate()
            .map(|(idx, port)| {
                let name = midi_in
                    .port_name(port)
                    .unwrap_or_else(|_| format!("Unknown Device {}", idx));
                tracing::info!("  Port {}: \"{}\"", idx, name);
                MidiDeviceInfo {
                    id: idx.to_string(),
                    name,
                    is_connected: false,
                }
            })
            .collect();

        tracing::info!("=== LIST MIDI DEVICES END: {} devices found ===", devices.len());
        Ok(devices)
    }

    /// Connect to a MIDI device by ID
    pub fn connect(&mut self, device_id: &str) -> Result<(), String> {
        tracing::info!("=== USB MIDI CONNECT START ===");
        tracing::info!("Requested device_id: {}", device_id);

        // Disconnect existing connection
        tracing::info!("Step 1/6: Disconnecting any existing connection...");
        self.disconnect();
        tracing::info!("Step 1/6: Done disconnecting");

        tracing::info!("Step 2/6: Creating MIDI input instance...");
        let midi_in = MidiInput::new("Piano Lesson App")
            .map_err(|e| format!("Failed to create MIDI input: {}", e))?;
        tracing::info!("Step 2/6: MIDI input created successfully");

        tracing::info!("Step 3/6: Getting available ports...");
        let ports = midi_in.ports();
        tracing::info!("Step 3/6: Found {} ports", ports.len());

        // Log all available ports
        for (idx, port) in ports.iter().enumerate() {
            let name = midi_in.port_name(port).unwrap_or_else(|_| "Unknown".to_string());
            tracing::info!("  Port {}: {}", idx, name);
        }

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

        tracing::info!("Step 4/6: Selected port {} ({})", port_idx, port_name);

        // Create callback for MIDI events
        tracing::info!("Step 5/6: Setting up MIDI callback...");
        let event_buffer = Arc::clone(&self.event_buffer);

        tracing::info!("Step 6/6: Connecting to MIDI port (this may block on Bluetooth devices)...");
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

                        tracing::debug!("MIDI raw: status=0x{:02X} note={} vel={}", status, midi_note, velocity);

                        let event = match status {
                            0x90 if velocity > 0 => {
                                tracing::info!(">>> NOTE ON: midi={} velocity={}", midi_note, velocity);
                                Some(MidiEvent::note_on(midi_note, velocity))
                            }
                            0x90 | 0x80 => {
                                tracing::debug!(">>> NOTE OFF: midi={}", midi_note);
                                Some(MidiEvent::note_off(midi_note))
                            }
                            _ => None,
                        };

                        if let Some(evt) = event {
                            if let Ok(mut buffer) = event_buffer.lock() {
                                buffer.push(evt);
                                tracing::debug!("Event added to buffer, buffer size: {}", buffer.len());
                            }
                        }
                    }
                },
                (),
            )
            .map_err(|e| format!("Failed to connect to {}: {}", port_name, e))?;

        self.connection = Some(connection);
        self.start_time = Instant::now();

        tracing::info!("=== USB MIDI CONNECT SUCCESS ===");
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

    /// Clear the event buffer
    pub fn clear_event_buffer(&mut self) {
        if let Ok(mut buffer) = self.event_buffer.lock() {
            buffer.clear();
            tracing::debug!("Event buffer cleared");
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
    use crate::models::MidiEvent;

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

    #[test]
    fn test_new_service_has_empty_buffer() {
        let service = MidiInputService::new();
        let buffer = service.get_event_buffer();
        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_get_event_buffer_returns_shared_reference() {
        let service = MidiInputService::new();
        let buffer1 = service.get_event_buffer();
        let buffer2 = service.get_event_buffer();

        // Both should reference the same buffer
        buffer1.lock().unwrap().push(MidiEvent::note_on(60, 100));
        assert_eq!(buffer2.lock().unwrap().len(), 1);
    }

    #[test]
    fn test_clear_event_buffer() {
        let mut service = MidiInputService::new();
        let buffer = service.get_event_buffer();

        // Add some events
        {
            let mut buf = buffer.lock().unwrap();
            buf.push(MidiEvent::note_on(60, 100));
            buf.push(MidiEvent::note_on(64, 100));
            buf.push(MidiEvent::note_on(67, 100));
        }

        assert_eq!(buffer.lock().unwrap().len(), 3);

        // Clear the buffer
        service.clear_event_buffer();

        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_clear_event_buffer_when_empty() {
        let mut service = MidiInputService::new();

        // Should not panic when clearing empty buffer
        service.clear_event_buffer();

        let buffer = service.get_event_buffer();
        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_is_connected_initially_false() {
        let service = MidiInputService::new();
        assert!(!service.is_connected());
    }

    #[test]
    fn test_disconnect_when_not_connected() {
        let mut service = MidiInputService::new();

        // Should not panic when disconnecting without connection
        service.disconnect();

        assert!(!service.is_connected());
    }

    #[test]
    fn test_connect_with_invalid_device_id() {
        let mut service = MidiInputService::new();

        let result = service.connect("not-a-number");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid device ID"));
    }

    #[test]
    fn test_connect_with_out_of_range_device_id() {
        let mut service = MidiInputService::new();

        // Use a very high device ID that won't exist
        let result = service.connect("9999");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_process_events_with_empty_buffer() {
        let mut service = MidiInputService::new();
        let chords = service.process_events();
        assert!(chords.is_empty());
    }

    #[test]
    fn test_process_events_with_only_note_offs() {
        let mut service = MidiInputService::new();
        let buffer = service.get_event_buffer();

        // Add only note-off events
        {
            let mut buf = buffer.lock().unwrap();
            buf.push(MidiEvent::note_off(60));
            buf.push(MidiEvent::note_off(64));
        }

        let chords = service.process_events();

        // No chords should be produced from note-offs alone
        assert!(chords.is_empty());
        // Buffer should be cleared
        assert!(buffer.lock().unwrap().is_empty());
    }

    #[test]
    fn test_set_chord_callback() {
        use std::sync::atomic::{AtomicUsize, Ordering};

        let mut service = MidiInputService::new();
        let call_count = Arc::new(AtomicUsize::new(0));
        let call_count_clone = Arc::clone(&call_count);

        service.set_chord_callback(move |_chord| {
            call_count_clone.fetch_add(1, Ordering::SeqCst);
        });

        // Add old events that will trigger chord grouping
        let buffer = service.get_event_buffer();
        {
            let mut buf = buffer.lock().unwrap();
            buf.push(MidiEvent {
                timestamp: Instant::now() - Duration::from_millis(100),
                midi: 60,
                velocity: 100,
                is_note_on: true,
            });
        }

        service.process_events();

        assert_eq!(call_count.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn test_default_trait() {
        let service = MidiInputService::default();
        assert!(!service.is_connected());
    }
}
