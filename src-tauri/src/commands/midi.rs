// MIDI commands - Device management and listening
// Responsibility: Backend only (see RESPONSIBILITY_SEPARATION.md)
// Commands:
//   - get_midi_devices() -> Result<Vec<MidiDevice>, String>
//   - start_midi_listening(device_id: String) -> Result<(), String>
//   - stop_midi_listening() -> Result<(), String>
// Events:
//   - midi_chord_detected: {notes: Vec<u8>, hand: String}

use crate::models::{MidiChord, MidiDeviceInfo};
use crate::services::MidiInputService;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// Managed state for MIDI service
pub struct MidiState {
    pub service: Mutex<MidiInputService>,
}

impl Default for MidiState {
    fn default() -> Self {
        Self {
            service: Mutex::new(MidiInputService::new()),
        }
    }
}

/// Get list of available MIDI input devices
#[tauri::command]
pub fn get_midi_devices() -> Result<Vec<MidiDeviceInfo>, String> {
    MidiInputService::list_devices()
}

/// Start listening to a MIDI device
#[tauri::command]
pub fn start_midi_listening(
    device_id: String,
    state: State<MidiState>,
    app: AppHandle,
) -> Result<(), String> {
    tracing::info!("start_midi_listening called with device_id: {}", device_id);

    // First connect to the device (briefly lock)
    {
        let mut service = state
            .service
            .lock()
            .map_err(|_| "Failed to lock MIDI service")?;
        service.connect(&device_id)?;
        tracing::info!("Successfully connected to MIDI device");
    }

    // Get a clone of the event buffer and start time from the service
    let event_buffer = {
        let service = state
            .service
            .lock()
            .map_err(|_| "Failed to lock MIDI service")?;
        service.get_event_buffer()
    };

    tracing::info!("Starting MIDI polling thread...");

    // Start a polling loop in a separate thread
    let app_handle = app.clone();
    std::thread::spawn(move || {
        use crate::models::MidiChord;
        use std::time::{Duration, Instant};

        let start_time = Instant::now();
        const CHORD_WINDOW_MS: u64 = 50;

        loop {
            std::thread::sleep(Duration::from_millis(10));

            // Process events from the shared buffer
            if let Ok(mut buffer) = event_buffer.lock() {
                if buffer.is_empty() {
                    continue;
                }

                // Separate Note On and Note Off events
                let note_on_events: Vec<_> =
                    buffer.iter().filter(|e| e.is_note_on).cloned().collect();
                let note_off_events: Vec<_> =
                    buffer.iter().filter(|e| !e.is_note_on).cloned().collect();

                // Emit note-off events immediately (no grouping needed)
                for event in &note_off_events {
                    let _ = app_handle.emit("midi_note_off", event.midi);
                    tracing::debug!("Emitted note_off: {}", event.midi);
                }

                // Process note-on events with chord grouping
                if note_on_events.is_empty() {
                    buffer.clear();
                    continue;
                }

                // Check if oldest event is older than chord window
                let oldest = note_on_events
                    .first()
                    .map(|e| e.timestamp)
                    .unwrap_or_else(Instant::now);

                if oldest.elapsed() >= Duration::from_millis(CHORD_WINDOW_MS) {
                    // Group events into a chord
                    let chord = MidiChord::from_events(&note_on_events, start_time);

                    // Emit to frontend
                    let _ = app_handle.emit("midi_chord_detected", &chord);

                    tracing::info!(
                        "Emitted chord: {:?} (hand: {}) to frontend",
                        chord.notes,
                        chord.hand
                    );

                    // Clear buffer
                    buffer.clear();
                }
            }
        }
    });

    Ok(())
}

/// Stop listening to MIDI device
#[tauri::command]
pub fn stop_midi_listening(state: State<MidiState>) -> Result<(), String> {
    let mut service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock MIDI service")?;

    service.disconnect();
    Ok(())
}

/// Check if currently connected to a MIDI device
#[tauri::command]
pub fn is_midi_connected(state: State<MidiState>) -> Result<bool, String> {
    let service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock MIDI service")?;

    Ok(service.is_connected())
}

/// Emit a chord event to the frontend (for testing)
#[allow(dead_code)]
fn emit_chord_event(app: &AppHandle, chord: MidiChord) {
    let _ = app.emit("midi_chord_detected", chord);
}
