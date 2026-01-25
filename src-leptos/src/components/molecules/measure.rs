// Measure Molecule - Bar lines + notes
use leptos::*;

#[component]
pub fn Measure(#[prop] measure_number: usize, #[prop] children: Children) -> impl IntoView {
    view! {
        <g class="measure" data-measure={measure_number}>
            {children()}
        </g>
    }
}
