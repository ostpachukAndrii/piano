// Bluetooth MIDI commands - Device discovery and connection
// Commands:
//   - scan_bluetooth_devices() -> Result<Vec<BluetoothDeviceInfo>, String>
//   - connect_bluetooth_midi(device_id: String) -> Result<(), String>
//   - disconnect_bluetooth() -> Result<(), String>
//   - get_bluetooth_status() -> Result<BluetoothStatus, String>
// Events:
//   - bluetooth_midi_chord_detected: Same format as midi_chord_detected
//   - bluetooth_status_changed: BluetoothStatus

use crate::services::{BluetoothDeviceInfo, BluetoothMidiService, BluetoothStatus};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::runtime::Runtime;

/// Managed state for Bluetooth MIDI service
pub struct BluetoothState {
    pub service: Arc<tokio::sync::Mutex<BluetoothMidiService>>,
    /// Flag to signal polling thread to stop
    pub stop_flag: Arc<AtomicBool>,
    /// Tokio runtime for async operations
    pub runtime: Runtime,
}

impl Default for BluetoothState {
    fn default() -> Self {
        Self {
            service: Arc::new(tokio::sync::Mutex::new(BluetoothMidiService::new())),
            stop_flag: Arc::new(AtomicBool::new(false)),
            runtime: Runtime::new().expect("Failed to create Tokio runtime"),
        }
    }
}

/// Initialize Bluetooth adapter
#[tauri::command]
pub fn init_bluetooth(state: State<BluetoothState>) -> Result<(), String> {
    tracing::info!("Initializing Bluetooth adapter...");

    state.runtime.block_on(async {
        let mut service = state.service.lock().await;
        service.initialize().await
    })
}

/// Scan for Bluetooth MIDI devices
#[tauri::command]
pub fn scan_bluetooth_devices(
    timeout_secs: Option<u64>,
    state: State<BluetoothState>,
    app: AppHandle,
) -> Result<Vec<BluetoothDeviceInfo>, String> {
    let timeout = timeout_secs.unwrap_or(5);
    tracing::info!("Scanning for Bluetooth MIDI devices ({} seconds)...", timeout);

    // Emit scanning status
    let _ = app.emit("bluetooth_status_changed", BluetoothStatus::Scanning);

    let result = state.runtime.block_on(async {
        let mut service = state.service.lock().await;

        // Initialize Bluetooth adapter if not already done
        if !service.is_initialized() {
            tracing::info!("Initializing Bluetooth adapter...");
            service.initialize().await?;
        }

        service.scan_devices(timeout).await
    });

    // Emit final status
    let status = if result.is_ok() {
        BluetoothStatus::Disconnected
    } else {
        BluetoothStatus::Error(result.as_ref().err().unwrap().clone())
    };
    let _ = app.emit("bluetooth_status_changed", status);

    result
}

/// Connect to a Bluetooth MIDI device
#[tauri::command]
pub fn connect_bluetooth_midi(
    device_id: String,
    state: State<BluetoothState>,
    app: AppHandle,
) -> Result<(), String> {
    tracing::info!("Connecting to Bluetooth MIDI device: {}", device_id);

    // Reset stop flag
    state.stop_flag.store(false, Ordering::SeqCst);

    // Emit connecting status
    let _ = app.emit("bluetooth_status_changed", BluetoothStatus::Connecting);

    // Connect to device
    state.runtime.block_on(async {
        let mut service = state.service.lock().await;
        service.connect(&device_id).await?;

        // Start receiving MIDI events
        let _rx = service.start_receiving().await?;

        // Spawn event processing task
        let app_handle = app.clone();
        let processor = crate::services::EventProcessor::from_config();
        let event_buffer = service.get_event_buffer();
        let stop_flag = Arc::clone(&state.stop_flag);

        tokio::spawn(async move {
            use crate::services::midi::ProcessResult;

            tracing::info!("Bluetooth MIDI event processing started");

            loop {
                if stop_flag.load(Ordering::SeqCst) {
                    tracing::info!("Bluetooth MIDI processing stopped");
                    break;
                }

                // Process buffered events
                match processor.process_buffer(&event_buffer) {
                    Ok(results) => {
                        for result in results {
                            match result {
                                ProcessResult::NoEvents | ProcessResult::WaitingForWindow => {}
                                ProcessResult::NoteOffsReady(notes) => {
                                    for midi in notes {
                                        let _ = app_handle.emit("midi_note_off", midi);
                                    }
                                }
                                ProcessResult::ChordReady(chord) => {
                                    tracing::info!(
                                        "Bluetooth MIDI chord: {:?} (hand: {})",
                                        chord.notes,
                                        chord.hand
                                    );
                                    let _ = app_handle.emit("midi_chord_detected", &chord);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        tracing::error!("Error processing Bluetooth MIDI: {}", e);
                    }
                }

                tokio::time::sleep(std::time::Duration::from_millis(10)).await;
            }
        });

        Ok::<(), String>(())
    })?;

    // Emit connected status
    let _ = app.emit("bluetooth_status_changed", BluetoothStatus::Connected);

    Ok(())
}

/// Disconnect from Bluetooth MIDI device
#[tauri::command]
pub fn disconnect_bluetooth(state: State<BluetoothState>, app: AppHandle) -> Result<(), String> {
    tracing::info!("Disconnecting from Bluetooth MIDI device");

    // Signal processing task to stop
    state.stop_flag.store(true, Ordering::SeqCst);

    state.runtime.block_on(async {
        let mut service = state.service.lock().await;
        service.disconnect().await
    })?;

    // Emit disconnected status
    let _ = app.emit("bluetooth_status_changed", BluetoothStatus::Disconnected);

    Ok(())
}

/// Get current Bluetooth connection status
#[tauri::command]
pub fn get_bluetooth_status(state: State<BluetoothState>) -> Result<BluetoothStatus, String> {
    state.runtime.block_on(async {
        let service = state.service.lock().await;
        Ok(service.get_status())
    })
}

/// Check if Bluetooth MIDI is connected
#[tauri::command]
pub fn is_bluetooth_connected(state: State<BluetoothState>) -> Result<bool, String> {
    state.runtime.block_on(async {
        let service = state.service.lock().await;
        Ok(service.is_connected())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bluetooth_state_default() {
        let state = BluetoothState::default();
        assert!(!state.stop_flag.load(Ordering::SeqCst));
    }

    #[test]
    fn test_stop_flag_thread_safety() {
        let state = BluetoothState::default();
        let flag = Arc::clone(&state.stop_flag);

        state.stop_flag.store(true, Ordering::SeqCst);
        assert!(flag.load(Ordering::SeqCst));
    }
}
