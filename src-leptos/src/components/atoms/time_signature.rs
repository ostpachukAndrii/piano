// Time Signature Atom - 4/4, 3/4, etc
use leptos::*;

#[component]
pub fn TimeSignature(#[prop] top: u8, #[prop] bottom: u8, #[prop] x: f32, #[prop] y: f32) -> impl IntoView {
    view! {
        <text x=x y={y - 6.0} font-size="20" font-weight="bold">{top}</text>
        <text x=x y={y + 12.0} font-size="20" font-weight="bold">{bottom}</text>
    }
}
