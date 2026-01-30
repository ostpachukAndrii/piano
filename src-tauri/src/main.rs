// Tauri Piano Backend
// Prevents console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use piano_tauri_backend::commands;

fn main() {
    tauri::Builder::default()
        .manage(commands::midi::MidiState::default())
        .manage(commands::evaluation::EvaluationState::default())
        .invoke_handler(tauri::generate_handler![
            commands::lesson::load_lesson,
            commands::lesson::list_lessons,
            commands::midi::get_midi_devices,
            commands::midi::start_midi_listening,
            commands::midi::stop_midi_listening,
            commands::midi::is_midi_connected,
            commands::evaluation::check_note,
            commands::evaluation::check_pitch,
            commands::evaluation::get_stats,
            commands::evaluation::reset_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
