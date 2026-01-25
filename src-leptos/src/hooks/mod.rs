// Hooks - Leptos Signal-based data management
// Each hook manages ONE piece of state
// Hooks call Tauri commands to communicate with backend

// 6 hooks total:
// 1. use_lesson - Load and manage lesson state ✅ Phase 4
// 2. use_midi - Subscribe to MIDI input events ✅ Phase 5
// 3. use_playback - Manage playhead position
// 4. use_evaluation - Subscribe to evaluation events ✅ Phase 6
// 5. use_statistics - Track session statistics
// 6. use_keyboard - Handle keyboard shortcuts

pub mod use_evaluation;
pub mod use_keyboard;
pub mod use_lesson;
pub mod use_midi;
pub mod use_playback;
pub mod use_statistics;

// Re-export use_lesson (Phase 4)
pub use use_lesson::*;

// Re-export use_midi (Phase 5)
pub use use_midi::{use_midi, MidiChord, MidiDeviceInfo, UseMidiResult};

// Re-export use_evaluation (Phase 6)
pub use use_evaluation::{
    use_evaluation, EvaluationResult, FeedbackType, SessionStats, UseEvaluationResult,
};
