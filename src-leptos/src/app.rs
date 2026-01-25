// Root App Component
// Serves as the main container for the entire application
// Responsibility: Layout and routing

use crate::components::containers::LessonStage;
use leptos::*;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <div id="app" class="app-container">
            <header class="app-header">
                <h1>"🎹 Piano Learning App"</h1>
            </header>

            <main class="app-main">
                <LessonStage />
            </main>
        </div>
    }
}
