// Notehead Atom - Circle/oval SVG
// Dumb component: NO state, NO hooks, ONLY props
// Props: x, y, filled (black=quarter/half note, white=whole/half note), radius

use leptos::*;

#[component]
pub fn Notehead(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop] filled: bool,
    #[prop] radius: f32,
) -> impl IntoView {
    view! {
        <ellipse
            cx=x
            cy=y
            rx=radius
            ry={radius * 0.8}
            fill={if filled { "black" } else { "white" }}
            stroke="black"
            stroke-width="1"
        />
    }
}
