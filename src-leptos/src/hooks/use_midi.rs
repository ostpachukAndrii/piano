// use_midi Hook - Subscribe to MIDI input events
// Uses Web MIDI API for browser-based MIDI access
// Falls back to mock data if Web MIDI is not available

use leptos::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// MIDI chord detected
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MidiChord {
    /// MIDI note numbers in this chord
    pub notes: Vec<u8>,
    /// Which hand this belongs to ("left", "right", or "both")
    pub hand: String,
    /// Average velocity (0-127)
    pub velocity: u8,
    /// Timestamp in milliseconds since MIDI listening started
    pub timestamp_ms: u64,
}

/// MIDI device info
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MidiDeviceInfo {
    /// Unique device ID
    pub id: String,
    /// Human-readable device name
    pub name: String,
    /// Whether this device is currently connected
    pub is_connected: bool,
}

/// Result of the use_midi hook
pub struct UseMidiResult {
    /// Currently active notes (from the most recent chord)
    pub active_notes: ReadSignal<Vec<u8>>,
    /// Set active notes (for external use)
    pub set_active_notes: WriteSignal<Vec<u8>>,
    /// Currently connected device (if any)
    pub connected_device: ReadSignal<Option<MidiDeviceInfo>>,
    /// Whether we're listening for MIDI input
    pub is_listening: ReadSignal<bool>,
    /// Available MIDI devices
    pub devices: ReadSignal<Vec<MidiDeviceInfo>>,
    /// Function to connect to a device
    pub connect: WriteSignal<Option<String>>,
    /// Function to disconnect
    pub disconnect: WriteSignal<bool>,
    /// Function to refresh device list
    pub refresh_devices: WriteSignal<bool>,
    /// Error message if any
    pub error: ReadSignal<Option<String>>,
}

/// Hook to manage MIDI input using Web MIDI API
pub fn use_midi() -> UseMidiResult {
    // State signals
    let (active_notes, set_active_notes) = create_signal(Vec::<u8>::new());
    let (connected_device, set_connected_device) = create_signal(None::<MidiDeviceInfo>);
    let (is_listening, set_is_listening) = create_signal(false);
    let (devices, set_devices) = create_signal(Vec::<MidiDeviceInfo>::new());
    let (error, set_error) = create_signal(None::<String>);

    // Trigger signals for actions
    let (connect_trigger, set_connect_trigger) = create_signal(None::<String>);
    let (disconnect_trigger, set_disconnect_trigger) = create_signal(false);
    let (refresh_trigger, set_refresh_trigger) = create_signal(false);

    // Initialize Web MIDI on mount
    create_effect(move |_| {
        spawn_local(async move {
            match request_midi_access().await {
                Ok(midi_access) => {
                    let device_list = get_midi_inputs(&midi_access);
                    set_devices.set(device_list);
                    set_error.set(None);
                    logging::log!("Web MIDI API initialized successfully");
                }
                Err(e) => {
                    set_error.set(Some(e.clone()));
                    logging::log!("Web MIDI API error: {}", e);
                    // Fall back to mock devices for development
                    set_devices.set(get_mock_devices());
                }
            }
        });
    });

    // Handle connect trigger
    create_effect(move |_| {
        if let Some(device_id) = connect_trigger.get() {
            let device_list = devices.get();
            if let Some(device) = device_list.iter().find(|d| d.id == device_id) {
                let device_name = device.name.clone();
                let device_id_clone = device_id.clone();

                spawn_local(async move {
                    match connect_to_device(&device_id_clone, set_active_notes).await {
                        Ok(()) => {
                            set_connected_device.set(Some(MidiDeviceInfo {
                                id: device_id_clone,
                                name: device_name.clone(),
                                is_connected: true,
                            }));
                            set_is_listening.set(true);
                            set_error.set(None);
                            logging::log!("Connected to MIDI device: {}", device_name);
                        }
                        Err(e) => {
                            set_error.set(Some(e.clone()));
                            logging::log!("Failed to connect: {}", e);
                        }
                    }
                });
            }
            set_connect_trigger.set(None);
        }
    });

    // Handle disconnect trigger
    create_effect(move |_| {
        if disconnect_trigger.get() {
            set_connected_device.set(None);
            set_is_listening.set(false);
            set_active_notes.set(Vec::new());
            logging::log!("Disconnected from MIDI device");
            set_disconnect_trigger.set(false);
        }
    });

    // Handle refresh trigger
    create_effect(move |_| {
        if refresh_trigger.get() {
            spawn_local(async move {
                match request_midi_access().await {
                    Ok(midi_access) => {
                        let device_list = get_midi_inputs(&midi_access);
                        set_devices.set(device_list);
                    }
                    Err(e) => {
                        set_error.set(Some(e));
                    }
                }
            });
            set_refresh_trigger.set(false);
        }
    });

    UseMidiResult {
        active_notes,
        set_active_notes,
        connected_device,
        is_listening,
        devices,
        connect: set_connect_trigger,
        disconnect: set_disconnect_trigger,
        refresh_devices: set_refresh_trigger,
        error,
    }
}

// ============================================================================
// Web MIDI API Integration
// ============================================================================

/// Request MIDI access from the browser
async fn request_midi_access() -> Result<web_sys::MidiAccess, String> {
    let window = web_sys::window().ok_or("No window object")?;
    let navigator = window.navigator();

    // Check if Web MIDI API is available
    let midi_promise = navigator.request_midi_access().map_err(|_| {
        "Web MIDI API not supported in this browser. Try Chrome or Edge.".to_string()
    })?;

    let midi_access = wasm_bindgen_futures::JsFuture::from(midi_promise)
        .await
        .map_err(|e| format!("MIDI access denied: {:?}", e))?;

    midi_access
        .dyn_into::<web_sys::MidiAccess>()
        .map_err(|_| "Failed to cast to MidiAccess".to_string())
}

/// Get list of MIDI input devices
fn get_midi_inputs(midi_access: &web_sys::MidiAccess) -> Vec<MidiDeviceInfo> {
    let inputs = midi_access.inputs();
    let mut devices = Vec::new();

    // Iterate through the MIDIInputMap
    let entries = js_sys::try_iter(&inputs).ok().flatten();

    if let Some(iter) = entries {
        for entry in iter {
            if let Ok(entry) = entry {
                let array = js_sys::Array::from(&entry);
                if array.length() >= 2 {
                    let id = array.get(0).as_string().unwrap_or_default();
                    let input = array.get(1);

                    if let Ok(midi_input) = input.dyn_into::<web_sys::MidiInput>() {
                        let name = midi_input
                            .name()
                            .unwrap_or_else(|| "Unknown Device".to_string());
                        devices.push(MidiDeviceInfo {
                            id,
                            name,
                            is_connected: false,
                        });
                    }
                }
            }
        }
    }

    // If no devices found, add a helpful message
    if devices.is_empty() {
        logging::log!("No MIDI devices found. Make sure your keyboard is connected via USB.");
    }

    devices
}

/// Connect to a MIDI device and set up message handling
async fn connect_to_device(
    device_id: &str,
    set_active_notes: WriteSignal<Vec<u8>>,
) -> Result<(), String> {
    let midi_access = request_midi_access().await?;
    let inputs = midi_access.inputs();

    // Find the device
    let entries = js_sys::try_iter(&inputs)
        .ok()
        .flatten()
        .ok_or("Failed to iterate MIDI inputs")?;

    for entry in entries {
        if let Ok(entry) = entry {
            let array = js_sys::Array::from(&entry);
            if array.length() >= 2 {
                let id = array.get(0).as_string().unwrap_or_default();
                if id == device_id {
                    let input = array.get(1);
                    if let Ok(midi_input) = input.dyn_into::<web_sys::MidiInput>() {
                        // Set up message handler
                        let callback =
                            Closure::wrap(Box::new(move |event: web_sys::MidiMessageEvent| {
                                handle_midi_message(event, set_active_notes);
                            })
                                as Box<dyn FnMut(web_sys::MidiMessageEvent)>);

                        midi_input.set_onmidimessage(Some(callback.as_ref().unchecked_ref()));

                        // Leak the closure to keep it alive
                        // In production, you'd store this and clean it up on disconnect
                        callback.forget();

                        logging::log!("MIDI message handler attached to device: {}", device_id);
                        return Ok(());
                    }
                }
            }
        }
    }

    Err(format!("Device {} not found", device_id))
}

/// Handle incoming MIDI messages
fn handle_midi_message(event: web_sys::MidiMessageEvent, set_active_notes: WriteSignal<Vec<u8>>) {
    // MidiMessageEvent.data returns Result<Vec<u8>, JsValue>
    let data = match event.data() {
        Ok(d) => d,
        Err(_) => return,
    };

    if data.len() < 3 {
        return;
    }

    let status = data[0];
    let note = data[1];
    let velocity = data[2];

    // Note On: status 0x90-0x9F (144-159)
    // Note Off: status 0x80-0x8F (128-143) or Note On with velocity 0
    let is_note_on = (status & 0xF0) == 0x90 && velocity > 0;
    let is_note_off = (status & 0xF0) == 0x80 || ((status & 0xF0) == 0x90 && velocity == 0);

    if is_note_on {
        set_active_notes.update(|notes| {
            if !notes.contains(&note) {
                notes.push(note);
            }
        });
        logging::log!("Note ON: {} (velocity: {})", note, velocity);
    } else if is_note_off {
        set_active_notes.update(|notes| {
            notes.retain(|&n| n != note);
        });
        logging::log!("Note OFF: {}", note);
    }
}

/// Simulate a chord being played (for testing)
#[allow(dead_code)]
pub fn simulate_chord(notes: Vec<u8>) -> MidiChord {
    MidiChord {
        notes,
        hand: "right".to_string(),
        velocity: 80,
        timestamp_ms: 0,
    }
}

/// Get mock MIDI devices for development (fallback when Web MIDI not available)
fn get_mock_devices() -> Vec<MidiDeviceInfo> {
    vec![MidiDeviceInfo {
        id: "mock-0".to_string(),
        name: "Mock Piano (Web MIDI unavailable)".to_string(),
        is_connected: false,
    }]
}
