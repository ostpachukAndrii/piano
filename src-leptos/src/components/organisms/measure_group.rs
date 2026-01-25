// Measure Group Organism - Multiple measures grouped
use leptos::*;

#[component]
pub fn MeasureGroup(
    #[prop] start_measure: usize,
    #[prop] children: Children,
) -> impl IntoView {
    view! {
        <g class="measure-group" data-start-measure={start_measure}>
            {children()}
        </g>
    }
}
