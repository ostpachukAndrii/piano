// Tauri Commands - API endpoints called from Leptos frontend
// Each command maps to a specific action:
// - load_lesson: Load a lesson from YAML
// - list_lessons: Get all available lessons
// - get_midi_devices: List available MIDI devices
// - start_midi_listening: Start listening to MIDI input
// - stop_midi_listening: Stop listening to MIDI input
// - scan_bluetooth_devices: Scan for Bluetooth MIDI devices
// - connect_bluetooth_midi: Connect to Bluetooth MIDI device
// - disconnect_bluetooth: Disconnect from Bluetooth MIDI
// - check_note: Evaluate if note was played correctly
// - seek_to_note: Move to a specific note in lesson
// - get_playback_state: Get current playback state
// - record_session_result: Save session statistics
// - get_session_history: Retrieve past session records

pub mod bluetooth;
pub mod evaluation;
pub mod lesson;
pub mod midi;
pub mod playback;

// Commands will be registered with Tauri app in main.rs
// Placeholder implementations for Phase 2-3
