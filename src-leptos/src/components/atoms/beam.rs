// Beam Atom - Connects eighth/sixteenth note stems
use leptos::*;

#[component]
pub fn Beam(
    #[prop] x1: f32,
    #[prop] y1: f32,
    #[prop] x2: f32,
    #[prop] y2: f32,
) -> impl IntoView {
    view! {
        <polygon
            points={format!("{},{} {},{} {},{} {},{}", x1, y1, x2, y2, x2 - 3.0, y2 - 5.0, x1 - 3.0, y1 - 5.0)}
            fill="black"
        />
    }
}
