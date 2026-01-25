// Virtual Keyboard Molecule - Interactive keyboard display
use leptos::*;

#[component]
pub fn VirtualKeyboard(
    #[prop(default = String::new())] _active_notes: String,  // CSV of MIDI numbers
) -> impl IntoView {
    view! {
        <div class="virtual-keyboard">
            // TODO: Render 52 white + 36 black keys
            // Highlight active notes based on MIDI input
            <p>"Virtual Keyboard"</p>
        </div>
    }
}
