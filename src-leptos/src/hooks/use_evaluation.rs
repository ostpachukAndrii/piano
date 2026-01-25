// use_evaluation Hook - Subscribe to evaluation events
// Single responsibility: Listen to note_evaluated events from backend
// Returns: latest feedback, score, and session statistics

use leptos::*;
use serde::{Deserialize, Serialize};

/// Feedback type for evaluation results
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum FeedbackType {
    /// Perfect - correct pitch, timing, and duration
    Perfect,
    /// Good - correct pitch, slightly off timing or duration
    Good,
    /// Close - correct pitch, significantly off timing or duration
    Close,
    /// Wrong - incorrect pitch
    #[default]
    Wrong,
}

impl FeedbackType {
    /// Get display message
    pub fn message(&self) -> &'static str {
        match self {
            FeedbackType::Perfect => "Perfect!",
            FeedbackType::Good => "Good!",
            FeedbackType::Close => "Close!",
            FeedbackType::Wrong => "Wrong",
        }
    }

    /// Get CSS color class
    pub fn color_class(&self) -> &'static str {
        match self {
            FeedbackType::Perfect => "text-green-500",
            FeedbackType::Good => "text-green-400",
            FeedbackType::Close => "text-yellow-500",
            FeedbackType::Wrong => "text-red-500",
        }
    }

    /// Get background color class
    pub fn bg_class(&self) -> &'static str {
        match self {
            FeedbackType::Perfect => "bg-green-500",
            FeedbackType::Good => "bg-green-400",
            FeedbackType::Close => "bg-yellow-500",
            FeedbackType::Wrong => "bg-red-500",
        }
    }
}

/// Result of evaluating a played note
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EvaluationResult {
    pub pitch_correct: bool,
    pub timing_correct: bool,
    pub duration_correct: bool,
    pub feedback: FeedbackType,
    pub score: u8,
    pub message: String,
    pub timing_offset_ms: i64,
    pub duration_difference: f32,
}

/// Session statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionStats {
    pub total_notes: u32,
    pub correct_notes: u32,
    pub perfect_notes: u32,
    pub current_streak: u32,
    pub best_streak: u32,
    pub accuracy: f32,
    pub average_score: f32,
}

/// Result of the use_evaluation hook
pub struct UseEvaluationResult {
    /// Last evaluation result
    pub last_result: ReadSignal<Option<EvaluationResult>>,
    /// Current session stats
    pub stats: ReadSignal<SessionStats>,
    /// Whether feedback is currently visible
    pub show_feedback: ReadSignal<bool>,
    /// Function to check a note
    pub check_note: WriteSignal<Option<(u8, u8)>>,
    /// Function to reset stats
    pub reset: WriteSignal<bool>,
}

/// Hook to manage note evaluation
///
/// Currently uses mock evaluation. When Tauri is integrated:
/// 1. Replace with `invoke("check_note", { ... })`
/// 2. Subscribe to `note_evaluated` events
pub fn use_evaluation() -> UseEvaluationResult {
    // State signals
    let (last_result, set_last_result) = create_signal(None::<EvaluationResult>);
    let (stats, set_stats) = create_signal(SessionStats::default());
    let (show_feedback, set_show_feedback) = create_signal(false);
    
    // Trigger signals
    let (check_note_trigger, set_check_note_trigger) = create_signal(None::<(u8, u8)>);
    let (reset_trigger, set_reset_trigger) = create_signal(false);

    // React to check_note trigger
    create_effect(move |_| {
        if let Some((played, expected)) = check_note_trigger.get() {
            // Mock evaluation (will be replaced with Tauri invoke)
            let result = mock_evaluate(played, expected);
            
            // Update stats
            let mut current_stats = stats.get();
            current_stats.total_notes += 1;
            if result.pitch_correct {
                current_stats.correct_notes += 1;
                current_stats.current_streak += 1;
                if current_stats.current_streak > current_stats.best_streak {
                    current_stats.best_streak = current_stats.current_streak;
                }
            } else {
                current_stats.current_streak = 0;
            }
            if result.feedback == FeedbackType::Perfect {
                current_stats.perfect_notes += 1;
            }
            current_stats.accuracy = if current_stats.total_notes > 0 {
                (current_stats.correct_notes as f32 / current_stats.total_notes as f32) * 100.0
            } else {
                100.0
            };
            
            set_stats.set(current_stats);
            set_last_result.set(Some(result));
            set_show_feedback.set(true);
            
            // Hide feedback after 1 second
            set_timeout(
                move || set_show_feedback.set(false),
                std::time::Duration::from_millis(1000),
            );
            
            // Clear trigger
            set_check_note_trigger.set(None);
        }
    });

    // React to reset trigger
    create_effect(move |_| {
        if reset_trigger.get() {
            set_stats.set(SessionStats::default());
            set_last_result.set(None);
            set_show_feedback.set(false);
            set_reset_trigger.set(false);
        }
    });

    UseEvaluationResult {
        last_result,
        stats,
        show_feedback,
        check_note: set_check_note_trigger,
        reset: set_reset_trigger,
    }
}

/// Mock evaluation function for standalone testing
fn mock_evaluate(played: u8, expected: u8) -> EvaluationResult {
    let pitch_correct = played == expected;
    
    let feedback = if pitch_correct {
        FeedbackType::Perfect
    } else {
        FeedbackType::Wrong
    };

    EvaluationResult {
        pitch_correct,
        timing_correct: true,
        duration_correct: true,
        feedback,
        score: feedback.score(),
        message: feedback.message().to_string(),
        timing_offset_ms: 0,
        duration_difference: 0.0,
    }
}

impl FeedbackType {
    fn score(&self) -> u8 {
        match self {
            FeedbackType::Perfect => 100,
            FeedbackType::Good => 80,
            FeedbackType::Close => 50,
            FeedbackType::Wrong => 0,
        }
    }
}
