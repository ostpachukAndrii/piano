// Key Signature Atom - Key indication (sharps/flats)
use leptos::*;

#[component]
pub fn KeySignature(
    #[prop] sharps: i8,  // positive = sharps, negative = flats
    #[prop] x: f32,
    #[prop] y: f32,
) -> impl IntoView {
    // TODO: Render sharps or flats based on key signature
    view! {
        <text x=x y=y font-size="16">
            {if sharps > 0 {
                format!("{}♯", sharps)
            } else if sharps < 0 {
                format!("{}♭", sharps.abs())
            } else {
                "No key".to_string()
            }}
        </text>
    }
}
