// Rest Atom - Rest symbols
use leptos::*;

#[component]
pub fn Rest(#[prop] rest_type: String, #[prop] x: f32, #[prop] y: f32) -> impl IntoView {
    // TODO: Render different rest symbols
    view! {
        <text x=x y=y font-size="20">
            {match rest_type.as_str() {
                "whole" => "𝄽",
                "half" => "𝄾",
                "quarter" => "𝄽",
                _ => "𝄽",
            }}
        </text>
    }
}
