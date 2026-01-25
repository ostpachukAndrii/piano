// MIDI Device Selector Molecule
// Single responsibility: Display list of MIDI devices and allow selection
// Uses Web MIDI API through the use_midi hook

use crate::hooks::use_midi::use_midi;
use leptos::*;

/// Convert MIDI number to note name
fn midi_to_note_name(midi: u8) -> String {
    let note_names = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    let octave = (midi / 12) as i32 - 1;
    let note = note_names[(midi % 12) as usize];
    format!("{}{}", note, octave)
}

/// MIDI device selector with connection status AND live note display
#[component]
pub fn MidiDeviceSelector() -> impl IntoView {
    let midi = use_midi();

    // Create a local signal to track selected device ID
    let (selected_device, set_selected_device) = create_signal(String::new());

    let devices = midi.devices;
    let connected_device = midi.connected_device;
    let is_listening = midi.is_listening;
    let active_notes = midi.active_notes;
    let connect = midi.connect;
    let disconnect = midi.disconnect;
    let refresh_devices = midi.refresh_devices;
    let error = midi.error;

    // Handle device selection change
    let on_select_change = move |ev: web_sys::Event| {
        let target = event_target::<web_sys::HtmlSelectElement>(&ev);
        set_selected_device.set(target.value());
    };

    // Handle connect button click
    let on_connect_click = move |_| {
        let device_id = selected_device.get();
        if !device_id.is_empty() {
            connect.set(Some(device_id));
        }
    };

    // Handle disconnect button click
    let on_disconnect_click = move |_| {
        disconnect.set(true);
    };

    // Handle refresh button click
    let on_refresh_click = move |_| {
        refresh_devices.set(true);
    };

    view! {
        <div class="midi-device-selector" style="padding: 16px; background: #1f2937; border-radius: 8px; border: 1px solid #374151; min-width: 300px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 18px; font-weight: 600; color: white; margin: 0;">"🎹 MIDI Device"</h3>
                <button
                    style="padding: 4px 8px; background: #374151; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 12px;"
                    on:click=on_refresh_click
                >
                    "🔄 Refresh"
                </button>
            </div>

            // Error message
            {move || error.get().map(|err| view! {
                <div style="padding: 8px 12px; background: #7f1d1d; color: #fca5a5; border-radius: 4px; margin-bottom: 12px; font-size: 14px;">
                    {err}
                </div>
            })}

            <div style="display: flex; flex-direction: column; gap: 12px;">
                // Device dropdown
                <select
                    style="background: #374151; color: white; border: 1px solid #4b5563; border-radius: 4px; padding: 8px 12px; width: 100%;"
                    on:change=on_select_change
                    disabled=move || is_listening.get()
                >
                    <option value="">"Select a device..."</option>
                    {move || devices.get().into_iter().map(|device| {
                        view! {
                            <option value={device.id.clone()}>
                                {device.name}
                            </option>
                        }
                    }).collect_view()}
                </select>

                // Connection status
                <div style="display: flex; align-items: center; gap: 8px;">
                    {move || {
                        if let Some(device) = connected_device.get() {
                            view! {
                                <span style="display: flex; align-items: center; gap: 8px; color: #4ade80;">
                                    <span style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%;"></span>
                                    "Connected: " {device.name}
                                </span>
                            }.into_view()
                        } else {
                            view! {
                                <span style="color: #9ca3af;">
                                    "Not connected"
                                </span>
                            }.into_view()
                        }
                    }}
                </div>

                // Connect/Disconnect button
                <div style="display: flex; gap: 8px;">
                    {move || {
                        if is_listening.get() {
                            view! {
                                <button
                                    style="padding: 8px 16px; background: #dc2626; border: none; border-radius: 4px; color: white; cursor: pointer;"
                                    on:click=on_disconnect_click
                                >
                                    "Disconnect"
                                </button>
                            }.into_view()
                        } else {
                            view! {
                                <button
                                    style="padding: 8px 16px; background: #2563eb; border: none; border-radius: 4px; color: white; cursor: pointer;"
                                    on:click=on_connect_click
                                    disabled=move || selected_device.get().is_empty()
                                >
                                    "Connect"
                                </button>
                            }.into_view()
                        }
                    }}
                </div>

                // LIVE NOTE DISPLAY - Shows what notes are being played
                {move || {
                    if is_listening.get() {
                        let notes = active_notes.get();
                        Some(view! {
                            <div style="margin-top: 8px; padding: 12px; background: #111827; border-radius: 8px; border: 2px solid #374151;">
                                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">"Now Playing:"</div>
                                {if notes.is_empty() {
                                    view! {
                                        <div style="font-size: 24px; color: #6b7280; text-align: center; padding: 8px;">
                                            "🎹 Play a note..."
                                        </div>
                                    }.into_view()
                                } else {
                                    let notes_display = notes.iter()
                                        .map(|&n| midi_to_note_name(n))
                                        .collect::<Vec<_>>()
                                        .join(" + ");
                                    let midi_numbers = notes.iter()
                                        .map(|n| n.to_string())
                                        .collect::<Vec<_>>()
                                        .join(", ");
                                    view! {
                                        <div>
                                            <div style="font-size: 32px; font-weight: bold; color: #22c55e; text-align: center;">
                                                {notes_display}
                                            </div>
                                            <div style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 4px;">
                                                "MIDI: " {midi_numbers}
                                            </div>
                                        </div>
                                    }.into_view()
                                }}
                            </div>
                        })
                    } else {
                        None
                    }
                }}
            </div>
        </div>
    }
}
