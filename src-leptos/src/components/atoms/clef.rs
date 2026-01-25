// Clef Atom - Treble/Bass clef symbol
use leptos::*;

#[component]
pub fn Clef(#[prop] clef_type: String, #[prop] x: f32, #[prop] y: f32) -> impl IntoView {
    // TODO: Render treble (G clef) or bass (F clef) SVG paths
    view! {
        <text x=x y=y font-size="48">
            {if clef_type == "treble" { "𝄞" } else { "𝄢" }}
        </text>
    }
}
