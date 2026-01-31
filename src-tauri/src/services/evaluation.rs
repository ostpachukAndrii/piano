// Evaluation Service
// Single responsibility: Check if played note matches expected note
// Features:
//   - Pitch check (MIDI number match)
//   - Timing check (±tolerance window)
//   - Duration check (note held for correct time)
//   - Score calculation
//   - Feedback generation

use serde::{Deserialize, Serialize};

/// Feedback type for evaluation results
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FeedbackType {
    /// Perfect - correct pitch, timing, and duration
    Perfect,
    /// Good - correct pitch, slightly off timing or duration
    Good,
    /// Close - correct pitch, significantly off timing or duration
    Close,
    /// Wrong - incorrect pitch
    Wrong,
}

impl FeedbackType {
    /// Get display message for this feedback type
    pub fn message(&self) -> &'static str {
        match self {
            FeedbackType::Perfect => "Perfect!",
            FeedbackType::Good => "Good!",
            FeedbackType::Close => "Close!",
            FeedbackType::Wrong => "Wrong",
        }
    }

    /// Get score value (0-100)
    pub fn score(&self) -> u8 {
        match self {
            FeedbackType::Perfect => 100,
            FeedbackType::Good => 80,
            FeedbackType::Close => 50,
            FeedbackType::Wrong => 0,
        }
    }

    /// Get CSS color class
    pub fn color(&self) -> &'static str {
        match self {
            FeedbackType::Perfect => "green",
            FeedbackType::Good => "green",
            FeedbackType::Close => "yellow",
            FeedbackType::Wrong => "red",
        }
    }
}

/// Result of evaluating a played note
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationResult {
    /// Whether the pitch was correct
    pub pitch_correct: bool,
    /// Whether the timing was acceptable
    pub timing_correct: bool,
    /// Whether the duration was acceptable
    pub duration_correct: bool,
    /// Overall feedback type
    pub feedback: FeedbackType,
    /// Score for this note (0-100)
    pub score: u8,
    /// Human-readable message
    pub message: String,
    /// Timing offset in ms (negative = early, positive = late)
    pub timing_offset_ms: i64,
    /// Duration difference as percentage
    pub duration_difference: f32,
}

/// Evaluation service for checking played notes
#[derive(Debug, Clone, Default)]
pub struct EvaluationService {
    /// Total notes evaluated
    pub total_notes: u32,
    /// Correct notes (pitch matches)
    pub correct_notes: u32,
    /// Perfect notes (pitch, timing, duration all correct)
    pub perfect_notes: u32,
    /// Current streak of correct notes
    pub current_streak: u32,
    /// Best streak achieved
    pub best_streak: u32,
    /// Cumulative score
    pub total_score: u32,
}

impl EvaluationService {
    /// Create a new evaluation service
    pub fn new() -> Self {
        Self::default()
    }

    /// Reset all statistics
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    /// Check if the pitch is correct
    pub fn pitch_correct(played_midi: u8, expected_midi: u8) -> bool {
        played_midi == expected_midi
    }

    /// Check if timing is within tolerance
    /// Returns (is_correct, offset_ms)
    pub fn timing_correct(played_time_ms: u64, expected_time_ms: u64) -> (bool, i64) {
        let config = crate::config::get_config();
        let tolerance = config.evaluation.timing_acceptable_ms as u64;
        let offset = played_time_ms as i64 - expected_time_ms as i64;
        let is_correct = offset.unsigned_abs() <= tolerance;
        (is_correct, offset)
    }

    /// Check if duration is within tolerance
    /// Returns (is_correct, difference_percentage)
    pub fn duration_correct(played_duration_ms: u64, expected_duration_ms: u64) -> (bool, f32) {
        if expected_duration_ms == 0 {
            return (true, 0.0);
        }

        let config = crate::config::get_config();
        let tolerance = config.evaluation.duration_tolerance_percent / 100.0; // Convert from percentage
        let difference =
            (played_duration_ms as f32 - expected_duration_ms as f32) / expected_duration_ms as f32;
        let is_correct = difference.abs() <= tolerance;
        (is_correct, difference)
    }

    /// Evaluate a single note
    pub fn evaluate_note(
        &mut self,
        played_midi: u8,
        expected_midi: u8,
        played_time_ms: Option<u64>,
        expected_time_ms: Option<u64>,
        played_duration_ms: Option<u64>,
        expected_duration_ms: Option<u64>,
    ) -> EvaluationResult {
        // Check pitch
        let pitch_ok = Self::pitch_correct(played_midi, expected_midi);

        // Check timing (if provided)
        let (timing_ok, timing_offset) = match (played_time_ms, expected_time_ms) {
            (Some(played), Some(expected)) => Self::timing_correct(played, expected),
            _ => (true, 0), // No timing data, assume correct
        };

        // Check duration (if provided)
        let (duration_ok, duration_diff) = match (played_duration_ms, expected_duration_ms) {
            (Some(played), Some(expected)) => Self::duration_correct(played, expected),
            _ => (true, 0.0), // No duration data, assume correct
        };

        // Determine feedback type
        let feedback = if !pitch_ok {
            FeedbackType::Wrong
        } else if timing_ok && duration_ok {
            FeedbackType::Perfect
        } else if timing_ok || duration_ok {
            FeedbackType::Good
        } else {
            FeedbackType::Close
        };

        let score = feedback.score();

        // Update statistics
        self.total_notes += 1;
        self.total_score += score as u32;

        if pitch_ok {
            self.correct_notes += 1;
            self.current_streak += 1;
            if self.current_streak > self.best_streak {
                self.best_streak = self.current_streak;
            }
        } else {
            self.current_streak = 0;
        }

        if feedback == FeedbackType::Perfect {
            self.perfect_notes += 1;
        }

        EvaluationResult {
            pitch_correct: pitch_ok,
            timing_correct: timing_ok,
            duration_correct: duration_ok,
            feedback,
            score,
            message: feedback.message().to_string(),
            timing_offset_ms: timing_offset,
            duration_difference: duration_diff,
        }
    }

    /// Get current accuracy as percentage
    pub fn accuracy(&self) -> f32 {
        if self.total_notes == 0 {
            return 100.0;
        }
        (self.correct_notes as f32 / self.total_notes as f32) * 100.0
    }

    /// Get average score
    pub fn average_score(&self) -> f32 {
        if self.total_notes == 0 {
            return 0.0;
        }
        self.total_score as f32 / self.total_notes as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pitch_correct() {
        assert!(EvaluationService::pitch_correct(60, 60));
        assert!(!EvaluationService::pitch_correct(60, 61));
    }

    #[test]
    fn test_timing_correct() {
        // Exact timing
        let (ok, offset) = EvaluationService::timing_correct(1000, 1000);
        assert!(ok);
        assert_eq!(offset, 0);

        // Within tolerance
        let (ok, offset) = EvaluationService::timing_correct(1100, 1000);
        assert!(ok);
        assert_eq!(offset, 100);

        // Outside tolerance (config default is 200ms, so 250ms should fail)
        let (ok, offset) = EvaluationService::timing_correct(1250, 1000);
        assert!(!ok);
        assert_eq!(offset, 250);
    }

    #[test]
    fn test_duration_correct() {
        // Exact duration
        let (ok, diff) = EvaluationService::duration_correct(500, 500);
        assert!(ok);
        assert!((diff - 0.0).abs() < 0.001);

        // Within tolerance (20% over)
        let (ok, diff) = EvaluationService::duration_correct(600, 500);
        assert!(ok);
        assert!((diff - 0.2).abs() < 0.001);

        // Outside tolerance (50% over)
        let (ok, diff) = EvaluationService::duration_correct(750, 500);
        assert!(!ok);
        assert!((diff - 0.5).abs() < 0.001);
    }

    #[test]
    fn test_evaluate_note_perfect() {
        let mut service = EvaluationService::new();
        let result = service.evaluate_note(60, 60, Some(1000), Some(1000), Some(500), Some(500));

        assert!(result.pitch_correct);
        assert!(result.timing_correct);
        assert!(result.duration_correct);
        assert_eq!(result.feedback, FeedbackType::Perfect);
        assert_eq!(result.score, 100);
    }

    #[test]
    fn test_evaluate_note_wrong_pitch() {
        let mut service = EvaluationService::new();
        let result = service.evaluate_note(61, 60, Some(1000), Some(1000), Some(500), Some(500));

        assert!(!result.pitch_correct);
        assert_eq!(result.feedback, FeedbackType::Wrong);
        assert_eq!(result.score, 0);
    }

    #[test]
    fn test_streak_tracking() {
        let mut service = EvaluationService::new();

        // Three correct notes
        service.evaluate_note(60, 60, None, None, None, None);
        service.evaluate_note(62, 62, None, None, None, None);
        service.evaluate_note(64, 64, None, None, None, None);
        assert_eq!(service.current_streak, 3);

        // One wrong note
        service.evaluate_note(65, 64, None, None, None, None);
        assert_eq!(service.current_streak, 0);
        assert_eq!(service.best_streak, 3);
    }

    #[test]
    fn test_accuracy() {
        let mut service = EvaluationService::new();

        service.evaluate_note(60, 60, None, None, None, None); // Correct
        service.evaluate_note(62, 62, None, None, None, None); // Correct
        service.evaluate_note(64, 65, None, None, None, None); // Wrong
        service.evaluate_note(67, 67, None, None, None, None); // Correct

        assert!((service.accuracy() - 75.0).abs() < 0.001);
    }
}
