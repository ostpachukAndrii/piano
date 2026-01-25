// Results View Container - Show results after session
// Displays accuracy, streak, time, and option to retry or choose another lesson

use leptos::*;

#[component]
pub fn ResultsView(
    #[prop(default = 0)] accuracy: u8,
    #[prop(default = 0)] streak: u32,
    #[prop(default = 0)] elapsed_time: u32,
) -> impl IntoView {
    view! {
        <div class="results-view">
            <h2>"Session Results"</h2>
            <div class="results">
                <p>"Accuracy: " {accuracy}"%"</p>
                <p>"Streak: " {streak}</p>
                <p>"Time: " {elapsed_time}s</p>
            </div>
            <button>"Retry"</button>
            <button>"Choose Another Lesson"</button>
        </div>
    }
}
