// Leptos Piano Frontend - Entry Point
use leptos::*;
use piano_leptos_frontend::App;

fn main() {
    // Initialize logging for WASM
    _ = console_log::init_with_level(log::Level::Debug);
    console_error_panic_hook::set_once();

    log::info!("🎹 Piano Learning App starting...");

    // Mount the Leptos app
    mount_to_body(App);
}
