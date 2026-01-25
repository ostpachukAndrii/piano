// Metronome Display Molecule - Tempo/BPM indicator
use leptos::*;

#[component]
pub fn MetronomeDisplay(
    #[prop(default = 120)] bpm: u16,
    #[prop(default = false)] playing: bool,
) -> impl IntoView {
    view! {
        <div class="metronome-display">
            <span class="bpm">{bpm}</span>
            <span class="label">"BPM"</span>
            {if playing {
                view! { <span class="indicator playing">"●"</span> }.into_view()
            } else {
                view! { <span class="indicator">"○"</span> }.into_view()
            }}
        </div>
    }
}
