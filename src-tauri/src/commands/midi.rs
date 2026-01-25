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
    let mut service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock MIDI service")?;

    // Connect to the device
    service.connect(&device_id)?;

    // Start a polling loop in a separate thread
    let _app_handle = app.clone();
    std::thread::spawn(move || {
        // We need a separate service instance for the polling thread
        // This is a simplified approach - in production you'd use channels
        loop {
            std::thread::sleep(std::time::Duration::from_millis(10));

            // TODO: Implement proper event emission from the service
            // For now, we'll emit a test event periodically for development
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
