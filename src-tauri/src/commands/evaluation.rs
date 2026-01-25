// Evaluation commands - Check note correctness
// Responsibility: Backend only (see RESPONSIBILITY_SEPARATION.md)
// Commands:
//   - check_note: Evaluate a single note
//   - get_stats: Get current session statistics
//   - reset_stats: Reset session statistics
// Events:
//   - note_evaluated: {correct: bool, feedback: String, score: u8}

use crate::services::{EvaluationResult, EvaluationService};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// Managed state for evaluation service
pub struct EvaluationState {
    pub service: Mutex<EvaluationService>,
}

impl Default for EvaluationState {
    fn default() -> Self {
        Self {
            service: Mutex::new(EvaluationService::new()),
        }
    }
}

/// Session statistics returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStats {
    pub total_notes: u32,
    pub correct_notes: u32,
    pub perfect_notes: u32,
    pub current_streak: u32,
    pub best_streak: u32,
    pub accuracy: f32,
    pub average_score: f32,
}

/// Check if a played note matches the expected note
#[tauri::command]
pub fn check_note(
    played_midi: u8,
    expected_midi: u8,
    played_time_ms: Option<u64>,
    expected_time_ms: Option<u64>,
    played_duration_ms: Option<u64>,
    expected_duration_ms: Option<u64>,
    state: State<EvaluationState>,
    app: AppHandle,
) -> Result<EvaluationResult, String> {
    let mut service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock evaluation service")?;

    let result = service.evaluate_note(
        played_midi,
        expected_midi,
        played_time_ms,
        expected_time_ms,
        played_duration_ms,
        expected_duration_ms,
    );

    // Emit event to frontend
    let _ = app.emit("note_evaluated", &result);

    Ok(result)
}

/// Get current session statistics
#[tauri::command]
pub fn get_stats(state: State<EvaluationState>) -> Result<SessionStats, String> {
    let service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock evaluation service")?;

    Ok(SessionStats {
        total_notes: service.total_notes,
        correct_notes: service.correct_notes,
        perfect_notes: service.perfect_notes,
        current_streak: service.current_streak,
        best_streak: service.best_streak,
        accuracy: service.accuracy(),
        average_score: service.average_score(),
    })
}

/// Reset session statistics
#[tauri::command]
pub fn reset_stats(state: State<EvaluationState>) -> Result<(), String> {
    let mut service = state
        .service
        .lock()
        .map_err(|_| "Failed to lock evaluation service")?;

    service.reset();
    Ok(())
}

/// Simple pitch-only check (for Waiting mode)
#[tauri::command]
pub fn check_pitch(
    played_midi: u8,
    expected_midi: u8,
    state: State<EvaluationState>,
    app: AppHandle,
) -> Result<EvaluationResult, String> {
    check_note(
        played_midi,
        expected_midi,
        None,
        None,
        None,
        None,
        state,
        app,
    )
}
