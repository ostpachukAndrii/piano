// Timeline Viewer Organism - Scrollable note list
use leptos::*;

#[component]
pub fn TimelineViewer() -> impl IntoView {
    view! {
        <div class="timeline-viewer">
            <h3>"Notes"</h3>
            <ul class="notes-list">
                // TODO: List all notes with progress indicator
            </ul>
        </div>
    }
}
