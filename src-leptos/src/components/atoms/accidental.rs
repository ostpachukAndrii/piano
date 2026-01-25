// Accidental Atom - Sharp/flat/natural symbols
use leptos::*;

#[component]
pub fn Accidental(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop] accidental_type: String, // "sharp", "flat", "natural"
) -> impl IntoView {
    // TODO: Render sharp (♯), flat (♭), or natural (♮) symbol
    view! {
        <text x=x y=y font-size="16">
            {match accidental_type.as_str() {
                "sharp" => "♯",
                "flat" => "♭",
                "natural" => "♮",
                _ => "",
            }}
        </text>
    }
}
