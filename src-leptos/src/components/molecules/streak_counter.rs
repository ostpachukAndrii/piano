// Streak Counter Molecule - Success counter display
use leptos::*;

#[component]
pub fn StreakCounter(#[prop(default = 0)] count: u32) -> impl IntoView {
    view! {
        <div class="streak-counter">
            <span class="label">"Streak:"</span>
            <span class="count">{count}</span>
        </div>
    }
}
