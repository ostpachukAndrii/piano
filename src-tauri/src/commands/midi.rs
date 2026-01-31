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

    // Create event processor using configuration
    let processor = crate::services::EventProcessor::from_config();

    // Start a polling loop in a separate thread
    let app_handle = app.clone();
    std::thread::spawn(move || {
        use crate::services::midi::ProcessResult;
        use std::time::Duration;

        loop {
            std::thread::sleep(Duration::from_millis(10));

            // Process events from the shared buffer
            match processor.process_buffer(&event_buffer) {
                Ok(results) => {
                    for result in results {
                        match result {
                            ProcessResult::NoEvents | ProcessResult::WaitingForWindow => {
                                // Nothing to emit
                            }
                            ProcessResult::NoteOffsReady(notes) => {
                                // Emit note-off events
                                for midi in notes {
                                    let _ = app_handle.emit("midi_note_off", midi);
                                    tracing::debug!("Emitted note_off: {}", midi);
                                }
                            }
                            ProcessResult::ChordReady(chord) => {
                                // Emit chord to frontend
                                tracing::info!(
                                    "Emitted chord: {:?} (hand: {}) to frontend",
                                    chord.notes,
                                    chord.hand
                                );
                                let _ = app_handle.emit("midi_chord_detected", &chord);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Error processing MIDI events: {}", e);
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
