// Bar Line Atom - Measure dividers
use leptos::*;

#[component]
pub fn BarLine(#[prop] x: f32, #[prop] y_start: f32, #[prop] y_end: f32) -> impl IntoView {
    view! {
        <line
            x1=x
            y1=y_start
            x2=x
            y2=y_end
            stroke="black"
            stroke-width="2"
        />
    }
}
