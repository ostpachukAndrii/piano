// Lesson Select Container - Lesson picker
// Shows all available lessons and lets user pick one

use leptos::*;

#[component]
pub fn LessonSelect() -> impl IntoView {
    // TODO: Use hook to load lesson list from backend
    // TODO: Display list of lessons with thumbnails
    
    view! {
        <div class="lesson-select">
            <h2>"Select Lesson"</h2>
            <ul class="lessons-list">
                // TODO: List lessons from backend
            </ul>
        </div>
    }
}
