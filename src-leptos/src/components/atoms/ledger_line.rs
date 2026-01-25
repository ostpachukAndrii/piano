// Ledger Line Atom - Lines above/below staff
use leptos::*;

#[component]
pub fn LedgerLine(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop(default = 50.0)] width: f32,
) -> impl IntoView {
    view! {
        <line x1=x y1=y x2={x + width} y2=y stroke="black" stroke-width="1" />
    }
}
