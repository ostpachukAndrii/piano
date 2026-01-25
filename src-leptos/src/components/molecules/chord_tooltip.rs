// Chord Tooltip Molecule - Show chord name
use leptos::*;

#[component]
pub fn ChordTooltip(
    #[prop(default = "C major".to_string())] chord_name: String,
    #[prop(default = 0.0)] x: f32,
    #[prop(default = 0.0)] y: f32,
) -> impl IntoView {
    view! {
        <div class="chord-tooltip" style={format!("left: {}px; top: {}px", x, y)}>
            {chord_name}
        </div>
    }
}
