// Feedback Badge Molecule - Show evaluation feedback
// Single responsibility: Display feedback badge with animation

use crate::hooks::FeedbackType;
use leptos::*;

/// Feedback badge component showing Perfect/Good/Close/Wrong
#[component]
pub fn FeedbackBadge(
    /// The feedback type to display
    feedback: FeedbackType,
    /// Whether the badge is visible
    #[prop(default = true)]
    visible: bool,
) -> impl IntoView {
    let bg_color = match feedback {
        FeedbackType::Perfect => "#22c55e", // green-500
        FeedbackType::Good => "#4ade80",    // green-400
        FeedbackType::Close => "#eab308",   // yellow-500
        FeedbackType::Wrong => "#ef4444",   // red-500
    };

    let message = feedback.message();

    let opacity = if visible { "1" } else { "0" };
    let transform = if visible { "scale(1)" } else { "scale(0.8)" };

    view! {
        <div
            class="feedback-badge"
            style=format!(
                "background-color: {}; color: white; padding: 12px 24px; border-radius: 8px; \
                font-size: 24px; font-weight: bold; text-align: center; \
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) {}; \
                opacity: {}; transition: all 0.2s ease-out; z-index: 1000; \
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);",
                bg_color, transform, opacity
            )
        >
            {message}
        </div>
    }
}

/// Inline feedback badge for use within a component
#[component]
pub fn FeedbackBadgeInline(
    feedback: FeedbackType,
    #[prop(default = true)] visible: bool,
) -> impl IntoView {
    let bg_color = match feedback {
        FeedbackType::Perfect => "#22c55e",
        FeedbackType::Good => "#4ade80",
        FeedbackType::Close => "#eab308",
        FeedbackType::Wrong => "#ef4444",
    };

    let message = feedback.message();
    let display = if visible { "inline-block" } else { "none" };

    view! {
        <span
            class="feedback-badge-inline"
            style=format!(
                "background-color: {}; color: white; padding: 4px 12px; border-radius: 4px; \
                font-size: 14px; font-weight: bold; display: {};",
                bg_color, display
            )
        >
            {message}
        </span>
    }
}
