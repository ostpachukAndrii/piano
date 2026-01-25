// MIDI Input Display Organism - Show active chord
use leptos::*;

#[component]
pub fn MidiInputDisplay(#[prop(default = String::new())] active_chord: String) -> impl IntoView {
    view! {
        <div class="midi-input-display">
            <h4>"Active Chord:"</h4>
            <span class="chord-display">{active_chord}</span>
        </div>
    }
}
