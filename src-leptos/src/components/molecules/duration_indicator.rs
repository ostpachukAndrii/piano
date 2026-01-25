// Duration Indicator Molecule - Yellow/Green/Red feedback bar
use leptos::*;

#[component]
pub fn DurationIndicator(
    #[prop(default = 0.0)] progress: f32,  // 0.0 to 1.0
    #[prop(default = "gray".to_string())] color: String,
) -> impl IntoView {
    view! {
        <div class="duration-indicator" style={format!("width: {}%; background-color: {}", progress * 100.0, color)}>
        </div>
    }
}
