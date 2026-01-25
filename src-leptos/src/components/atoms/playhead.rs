// Playhead Atom - Cursor line with marker
use leptos::*;

#[component]
pub fn Playhead(#[prop] x: f32, #[prop] y_start: f32, #[prop] y_end: f32) -> impl IntoView {
    view! {
        <line
            x1=x
            y1=y_start
            x2=x
            y2=y_end
            stroke="red"
            stroke-width="2"
        />
        <circle cx=x cy=y_start r="4" fill="red" />
    }
}
