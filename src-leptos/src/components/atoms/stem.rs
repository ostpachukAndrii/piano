// Stem Atom - Vertical line
// Dumb component: NO state, NO hooks, ONLY props
// Props: x, y, height, direction (up/down)

use leptos::*;

#[component]
pub fn Stem(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop] height: f32,
    #[prop] direction: String, // "up" or "down"
) -> impl IntoView {
    let y_start = if direction == "up" { y - height } else { y };
    let y_end = if direction == "up" { y } else { y + height };
    
    view! {
        <line
            x1=x
            y1=y_start
            x2=x
            y2=y_end
            stroke="black"
            stroke-width="1.5"
        />
    }
}
