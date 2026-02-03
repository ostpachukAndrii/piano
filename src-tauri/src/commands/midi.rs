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
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

/// Managed state for MIDI service
pub struct MidiState {
    pub service: Mutex<MidiInputService>,
    /// Flag to signal polling thread to stop
    pub stop_flag: Arc<AtomicBool>,
}

impl Default for MidiState {
    fn default() -> Self {
        Self {
            service: Mutex::new(MidiInputService::new()),
            stop_flag: Arc::new(AtomicBool::new(false)),
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

    // Stop any existing polling thread first
    state.stop_flag.store(true, Ordering::SeqCst);
    // Give existing thread time to notice the flag
    std::thread::sleep(std::time::Duration::from_millis(20));

    // Reset the stop flag for the new thread
    state.stop_flag.store(false, Ordering::SeqCst);

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

    // Clone stop flag for the polling thread
    let stop_flag = Arc::clone(&state.stop_flag);

    // Start a polling loop in a separate thread
    let app_handle = app.clone();
    std::thread::spawn(move || {
        use crate::services::midi::ProcessResult;
        use std::time::Duration;

        tracing::info!("MIDI polling thread started");

        loop {
            // Check if we should stop
            if stop_flag.load(Ordering::SeqCst) {
                tracing::info!("MIDI polling thread received stop signal, exiting");
                break;
            }

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

        tracing::info!("MIDI polling thread terminated");
    });

    Ok(())
}

/// Stop listening to MIDI device
#[tauri::command]
pub fn stop_midi_listening(state: State<MidiState>) -> Result<(), String> {
    tracing::info!("stop_midi_listening called");

    // Signal the polling thread to stop
    state.stop_flag.store(true, Ordering::SeqCst);

    // Disconnect from the MIDI device and clear buffer
    let mut service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock MIDI service")?;

    service.disconnect();
    service.clear_event_buffer();

    tracing::info!("MIDI listening stopped, polling thread signaled to terminate");
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_midi_state_default() {
        let state = MidiState::default();

        // Service should be unlockable
        let service = state.service.lock().unwrap();
        assert!(!service.is_connected());

        // Stop flag should be false initially
        assert!(!state.stop_flag.load(Ordering::SeqCst));
    }

    #[test]
    fn test_midi_state_stop_flag_initially_false() {
        let state = MidiState::default();
        assert!(!state.stop_flag.load(Ordering::SeqCst));
    }

    #[test]
    fn test_midi_state_stop_flag_can_be_set() {
        let state = MidiState::default();

        state.stop_flag.store(true, Ordering::SeqCst);
        assert!(state.stop_flag.load(Ordering::SeqCst));

        state.stop_flag.store(false, Ordering::SeqCst);
        assert!(!state.stop_flag.load(Ordering::SeqCst));
    }

    #[test]
    fn test_midi_state_stop_flag_shared_across_clones() {
        let state = MidiState::default();
        let flag_clone = Arc::clone(&state.stop_flag);

        // Set via original
        state.stop_flag.store(true, Ordering::SeqCst);

        // Should be visible via clone
        assert!(flag_clone.load(Ordering::SeqCst));
    }

    #[test]
    fn test_stop_flag_thread_safety() {
        use std::thread;

        let state = MidiState::default();
        let flag = Arc::clone(&state.stop_flag);

        // Spawn a thread that checks the flag
        let handle = thread::spawn(move || {
            let mut iterations = 0;
            while !flag.load(Ordering::SeqCst) {
                thread::sleep(std::time::Duration::from_millis(1));
                iterations += 1;
                if iterations > 100 {
                    return false; // Timeout
                }
            }
            true
        });

        // Give thread time to start
        thread::sleep(std::time::Duration::from_millis(10));

        // Signal stop
        state.stop_flag.store(true, Ordering::SeqCst);

        // Thread should have received the signal
        let result = handle.join().unwrap();
        assert!(result, "Thread should have received stop signal");
    }

    #[test]
    fn test_get_midi_devices() {
        // This should work on any system (might return empty list)
        let result = get_midi_devices();
        assert!(result.is_ok());
    }
}
